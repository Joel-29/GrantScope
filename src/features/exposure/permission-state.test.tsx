import { act, renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, describe, expect, it } from 'vitest';
import type { PropsWithChildren } from 'react';
import { usePermissionData } from './usePermissionData';
import { useInspectionSession } from '../wallet/session';
import { anonRpc } from '../anon-rpc/runtime';
import { useTransactions } from '../revocation/store';
import { PERMIT2_ADDRESS } from '../../data/spenders';
import type { Erc20Permission } from '../erc20/types';
import type { Permit2Grant } from '../permit2/engine';

const owner = '0x0000000000000000000000000000000000000001';
const row: Erc20Permission = {
  id: 'cached-unit-record',
  kind: 'erc20',
  chainId: 1,
  owner,
  token: owner,
  spender: PERMIT2_ADDRESS,
  symbol: 'TEST',
  name: 'Unit fixture',
  decimals: 18,
  amount: 10n,
  balance: 10n,
  size: 'limited',
  blockNumber: 10n,
  readAt: 100,
  knownSpender: true,
  spenderName: 'Permit2',
  source: 'manual',
  warnings: [],
};
function setup() {
  useInspectionSession.getState().inspect(owner, 1);
  const manager = anonRpc.current();
  const scope = [
    1,
    owner,
    manager.transport,
    manager.sessionId,
    useInspectionSession.getState().revision,
  ];
  const client = new QueryClient();
  const key = ['allowances', ...scope];
  const scan = (record: Erc20Permission) => ({
    rows: [record],
    failures: [],
    coverage: 'Unit pair',
  });
  client.setQueryData(key, scan(row));
  const wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return { client, key, scope, scan, wrapper };
}
afterEach(() => {
  act(() => {
    useTransactions.setState({ busy: false, activity: [] });
    useInspectionSession.getState().clear();
  });
});
describe('permission snapshot lifecycle', () => {
  it('removes assessments immediately when the source query is removed', () => {
    const t = setup();
    const { result } = renderHook(usePermissionData, { wrapper: t.wrapper });
    expect(result.current.records).toHaveLength(1);
    act(() => t.client.removeQueries({ queryKey: t.key }));
    expect(result.current.records).toHaveLength(0);
    expect(result.current.scans).toBe(0);
  });
  it('uses the later checked snapshot when the canonical head moved backwards', () => {
    const t = setup();
    t.client.setQueryData(['discovery', ...t.scope], {
      verification: t.scan({
        ...row,
        blockNumber: 9n,
        readAt: 200,
        amount: 2n,
      }),
    });
    const { result } = renderHook(usePermissionData, { wrapper: t.wrapper });
    expect(result.current.records[0]?.amount).toBe(2n);
  });
  it('does not hide a newer positive read behind a historical zero at the same height', () => {
    const t = setup();
    useTransactions.setState({
      activity: [
        {
          id: 'zero-unit',
          recordId: row.id,
          chainId: 1,
          phase: 'verified-zero',
          verifiedBlock: 10n,
          verifiedAt: 150,
        },
      ],
    });
    const { result } = renderHook(usePermissionData, { wrapper: t.wrapper });
    expect(result.current.currentRecords).toHaveLength(0);
    act(() => t.client.setQueryData(t.key, t.scan({ ...row, readAt: 200 })));
    expect(result.current.currentRecords).toHaveLength(1);
  });
  it('withholds an older Permit2 bound after its ERC-20 dependency was verified zero', () => {
    const t = setup();
    const grant: Permit2Grant = {
      id: 'permit-unit',
      kind: 'permit2',
      chainId: 1,
      owner,
      token: owner,
      spender: owner,
      amount: 10n,
      expiration: 1000n,
      nonce: 0n,
      blockNumber: 10n,
      blockTimestamp: 1n,
      expired: false,
      underlying: row,
      codeHash: '0x',
      readAt: 100,
    };
    t.client.setQueryData(['permit2', ...t.scope], {
      verification: { rows: [grant], failures: [], coverage: 'Unit grant' },
    });
    useTransactions.setState({
      activity: [
        {
          id: 'dependency-zero',
          recordId: row.id,
          chainId: 1,
          phase: 'verified-zero',
          verifiedBlock: 11n,
          verifiedAt: 150,
        },
      ],
    });
    const { result } = renderHook(usePermissionData, { wrapper: t.wrapper });
    expect(result.current.records).toHaveLength(2);
    expect(result.current.currentRecords).toHaveLength(0);
    expect(
      result.current.records.find((record) => record.id === grant.id)?.amount,
    ).toBe(10n);
  });
});
