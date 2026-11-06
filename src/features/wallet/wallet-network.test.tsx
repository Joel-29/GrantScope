import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { anonRpc } from '../anon-rpc/runtime';
import { WalletNetworkControl } from './WalletNetworkControl';
import { useWallet } from './provider';
import { walletRequest } from './requests';
import { useInspectionSession } from './session';

// Isolated provider fixtures; these tests never connect a real wallet.
const owner = '0x0000000000000000000000000000000000000001';
const other = '0x0000000000000000000000000000000000000002';
afterEach(() => {
  useWallet.getState().disconnect();
  useInspectionSession.getState().clear();
  Reflect.deleteProperty(window, 'ethereum');
  vi.restoreAllMocks();
});
function setup(request = vi.fn().mockResolvedValue(null)) {
  const provider = { request };
  Object.defineProperty(window, 'ethereum', {
    configurable: true,
    value: provider,
  });
  useWallet.setState({ address: owner, chainId: 84532 });
  const view = render(<WalletNetworkControl />);
  return { provider, request, ...view };
}
function clickSwitch() {
  fireEvent.click(screen.getByRole('button', { name: /^Switch wallet to/ }));
}
it('requests only an explicit Sepolia switch and verifies the reported chain without submitting or counting anonymous reads', async () => {
  const before = anonRpc.getSnapshot().totals;
  const { request } = setup(
    vi.fn().mockResolvedValueOnce(null).mockResolvedValueOnce('0xaa36a7'),
  );
  expect(request).not.toHaveBeenCalled();
  clickSwitch();
  await waitFor(() => expect(useWallet.getState().chainId).toBe(11155111));
  expect(request.mock.calls).toEqual([
    [
      {
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0xaa36a7' }],
      },
    ],
    [{ method: 'eth_chainId' }],
  ]);
  const after = anonRpc.getSnapshot().totals;
  expect(after.read).toEqual(before.read);
  expect(after.walletSubmissions).toBe(before.walletSubmissions);
  expect(after.wallet.completed - before.wallet.completed).toBe(2);
  expect(anonRpc.getSnapshot().metrics.slice(-2)).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ category: 'wallet', anonymized: false }),
    ]),
  );
});
it('targets the inspected mainnet instead of defaulting to Sepolia', async () => {
  useInspectionSession.getState().inspect(owner, 1);
  const { request } = setup(
    vi.fn().mockResolvedValueOnce(null).mockResolvedValueOnce('0x1'),
  );
  expect(screen.getByRole('button')).toHaveTextContent('Ethereum mainnet (1)');
  clickSwitch();
  await waitFor(() => expect(useWallet.getState().chainId).toBe(1));
  expect(request.mock.calls[0]).toEqual([
    { method: 'wallet_switchEthereumChain', params: [{ chainId: '0x1' }] },
  ]);
});
it.each([
  [4001, /network change rejected/],
  [4902, /Enable the requested network/],
  [-32002, /could not be verified/],
])(
  'handles wallet error %s without adding a network or exposing provider text',
  async (code, message) => {
    const { request } = setup(
      vi.fn().mockRejectedValue({ code, message: 'private provider detail' }),
    );
    clickSwitch();
    expect(await screen.findByRole('alert')).toHaveTextContent(message);
    expect(
      screen.queryByText(/private provider detail/),
    ).not.toBeInTheDocument();
    expect(request).toHaveBeenCalledTimes(1);
    expect(useWallet.getState().chainId).toBe(84532);
  },
);
it.each(['0x14a34', 'invalid'])(
  'refuses a success claim when actual chain is %s',
  async (chain) => {
    setup(vi.fn().mockResolvedValueOnce(null).mockResolvedValueOnce(chain));
    clickSwitch();
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'could not be verified',
    );
    expect(useWallet.getState().chainId).toBe(84532);
  },
);
it('accepts the normal chainChanged event before verifying metadata', async () => {
  setup(
    vi.fn().mockImplementation(async ({ method }: { method: string }) => {
      if (method === 'wallet_switchEthereumChain') {
        useWallet.setState({ chainId: 11155111 });
        return null;
      }
      return '0xaa36a7';
    }),
  );
  clickSwitch();
  await waitFor(() =>
    expect(screen.queryByRole('button')).not.toBeInTheDocument(),
  );
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
});
it('does not overwrite a newer network event with stale metadata', async () => {
  let finish!: (value: unknown) => void;
  const { request } = setup(
    vi
      .fn()
      .mockResolvedValueOnce(null)
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            finish = resolve;
          }),
      ),
  );
  clickSwitch();
  await waitFor(() => expect(request).toHaveBeenCalledTimes(2));
  act(() => useWallet.setState({ chainId: 1 }));
  await act(async () => finish('0xaa36a7'));
  expect(screen.getByRole('alert')).toHaveTextContent('could not be verified');
  expect(useWallet.getState().chainId).toBe(1);
});
it.each(['disconnect', 'account', 'inspection', 'unmount', 'provider'])(
  'ignores late switch responses after %s changes',
  async (change) => {
    let finish!: (value: unknown) => void;
    const { request, unmount } = setup(
      vi.fn().mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            finish = resolve;
          }),
      ),
    );
    clickSwitch();
    act(() => {
      if (change === 'disconnect') useWallet.getState().disconnect();
      if (change === 'account') useWallet.setState({ address: other });
      if (change === 'inspection')
        useInspectionSession.getState().inspect(other, 1);
      if (change === 'unmount') unmount();
      if (change === 'provider')
        Object.defineProperty(window, 'ethereum', {
          configurable: true,
          value: { request: vi.fn() },
        });
    });
    await act(async () => finish(null));
    expect(request).toHaveBeenCalledTimes(1);
    expect(useWallet.getState().chainId).toBe(
      change === 'disconnect' ? null : 84532,
    );
  },
);
it('rejects unsupported chains, malformed parameters and added RPC URLs before touching the provider', async () => {
  const { provider, request } = setup();
  for (const params of [
    undefined,
    [],
    [{ chainId: '0x14a34' }],
    [{ chainId: 11155111 }],
    [{ chainId: '0xaa36a7', rpcUrls: ['https://invalid.example'] }],
    [{ chainId: '0xaa36a7' }, { chainId: '0x1' }],
  ]) {
    await expect(
      walletRequest(provider, {
        method: 'wallet_switchEthereumChain',
        ...(params ? { params } : {}),
      }),
    ).rejects.toThrow('one supported chain ID');
  }
  expect(request).not.toHaveBeenCalled();
});
