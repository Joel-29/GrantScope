import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { RevocationControl } from './RevocationControl';
import { ActivityList } from './ActivityList';
import { useTransactions } from './store';
import { useWallet } from '../wallet/provider';
import type { Erc20Permission } from '../erc20/types';
vi.mock('../wallet/useInspection', () => ({
  useInspection: () => ({ data: { kind: 'code-present' } }),
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
  useTransactions.setState({ busy: false, activity: [] });
  useWallet.getState().disconnect();
});
describe('revocation UI security boundaries', () => {
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
