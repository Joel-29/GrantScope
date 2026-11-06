import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { RevocationControl } from './RevocationControl';
import { ActivityList } from './ActivityList';
import { useTransactions } from './store';
import { useWallet } from '../wallet/provider';
import type { Erc20Permission } from '../erc20/types';
import { useInspectionSession } from '../wallet/session';
import { revocationIntent, type Prepared } from './engine';
import * as engine from './engine';
const inspection = vi.hoisted(() => ({ kind: 'code-present' }));
vi.mock('../wallet/useInspection', () => ({
  useInspection: () => ({ data: inspection }),
}));
const address = '0x0000000000000000000000000000000000000001';
const record: Erc20Permission = {
  id: 'unit-ui',
  kind: 'erc20',
  chainId: 11155111,
  owner: address,
  token: address,
  spender: address,
  symbol: 'TEST',
  name: 'Test fixture',
  decimals: 18,
  amount: 1n,
  balance: 1n,
  size: 'limited',
  blockNumber: 1n,
  readAt: 1,
  knownSpender: false,
  spenderName: 'Unclassified',
  source: 'manual',
  warnings: [],
};
afterEach(() => {
  inspection.kind = 'code-present';
  useTransactions.setState({ busy: false, activity: [] });
  useWallet.getState().disconnect();
  useInspectionSession.getState().clear();
  Reflect.deleteProperty(window, 'ethereum');
});
describe('revocation UI security boundaries', () => {
  it('cancels the final preflight on unmount before any wallet submission', async () => {
    inspection.kind = 'eoa';
    useWallet.setState({ address, chainId: 11155111 });
    useInspectionSession.getState().inspect(address, 11155111);
    Object.defineProperty(window, 'ethereum', {
      configurable: true,
      value: { request: vi.fn() },
    });
    const prepared: Prepared = {
      record,
      intent: revocationIntent(record),
      amount: 1n,
      blockNumber: 1n,
      codeHash: '0x00',
      gas: 21000n,
      gasPrice: 1n,
      feeCap: 21000n,
      nonce: 0n,
      createdAt: Date.now(),
    };
    vi.spyOn(engine, 'prepareRevocation').mockResolvedValue(prepared);
    let release!: () => void;
    const pending = new Promise<void>((resolve) => {
      release = resolve;
    });
    const send = vi.fn();
    const submit = vi
      .spyOn(engine, 'submitRevocation')
      .mockImplementation(
        async (_manager, _provider, _prepared, guard, signal) => {
          await pending;
          signal?.throwIfAborted();
          guard();
          send();
          throw new Error('Submission should have been cancelled');
        },
      );
    const user = userEvent.setup();
    const view = render(
      <QueryClientProvider client={new QueryClient()}>
        <RevocationControl record={record} />
      </QueryClientProvider>,
    );
    await user.click(
      screen.getByRole('button', { name: 'Prepare revocation' }),
    );
    await user.click(
      await screen.findByRole('button', { name: 'Confirm in wallet' }),
    );
    await waitFor(() => expect(submit).toHaveBeenCalledOnce());
    view.unmount();
    await act(async () => {
      release();
      await pending;
    });
    expect(submit.mock.calls[0]?.[4]?.aborted).toBe(true);
    expect(send).not.toHaveBeenCalled();
    expect(useTransactions.getState().busy).toBe(false);
    expect(useTransactions.getState().activity[0]?.phase).toBe('failed');
  });
  it('disables signing for a connected code-present owner', () => {
    useWallet.setState({ address, chainId: 11155111 });
    render(
      <QueryClientProvider client={new QueryClient()}>
        <RevocationControl record={record} />
      </QueryClientProvider>,
    );
    expect(
      screen.getByRole('button', { name: 'Prepare revocation' }),
    ).toBeDisabled();
    expect(
      screen.getByText(
        'Smart-account execution is unsupported. Revocation is disabled.',
      ),
    ).toBeInTheDocument();
  });
  it('keeps receipt confirmation separate from verified zero state', () => {
    useTransactions.setState({
      activity: [
        {
          id: 'test',
          recordId: record.id,
          chainId: 11155111,
          phase: 'confirmed',
        },
      ],
    });
    render(<ActivityList />);
    expect(
      screen.getByText(
        'Receipt obtained. Current allowance has not yet been verified.',
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByText('Allowance verified zero'),
    ).not.toBeInTheDocument();
  });
  it('serializes owner-authorized submission flows across views', () => {
    const state = useTransactions.getState();
    expect(
      state.start({
        id: 'one',
        recordId: record.id,
        chainId: 11155111,
        phase: 'checking',
      }),
    ).toBe(true);
    expect(
      state.start({
        id: 'two',
        recordId: record.id,
        chainId: 11155111,
        phase: 'checking',
      }),
    ).toBe(false);
    state.finish();
  });
});
