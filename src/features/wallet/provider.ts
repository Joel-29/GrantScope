import { create } from 'zustand';
import type { Address } from 'viem';
import { parseAddress } from './address';

export type InjectedProvider = {
  request(args: {
    method: string;
    params?: readonly unknown[];
  }): Promise<unknown>;
  on?(event: string, listener: (...args: unknown[]) => void): void;
  removeListener?(event: string, listener: (...args: unknown[]) => void): void;
};
export function injectedProvider(): InjectedProvider | null {
  const value: unknown = (window as unknown as { ethereum?: unknown }).ethereum;
  return value &&
    typeof value === 'object' &&
    'request' in value &&
    typeof value.request === 'function'
    ? (value as InjectedProvider)
    : null;
}
export function walletChain(value: unknown): number {
  if (typeof value !== 'string' || !/^0x[0-9a-f]+$/i.test(value))
    throw new Error('Invalid wallet chain');
  const id = BigInt(value);
  if (id <= 0n || id > BigInt(Number.MAX_SAFE_INTEGER))
    throw new Error('Invalid wallet chain');
  return Number(id);
}
type WalletState = {
  address: Address | null;
  chainId: number | null;
  connecting: boolean;
  error: string | null;
  connect(): Promise<void>;
  disconnect(): void;
};
let detach = () => {};
let generation = 0;
export const useWallet = create<WalletState>((set) => ({
  address: null,
  chainId: null,
  connecting: false,
  error: null,
  connect: async () => {
    const provider = injectedProvider();
    if (!provider) {
      set({
        error:
          'No injected Ethereum wallet found. Read-only inspection does not require one.',
      });
      return;
    }
    const attempt = ++generation;
    detach();
    set({ address: null, chainId: null, connecting: true, error: null });
    try {
      const accounts = await provider.request({
        method: 'eth_requestAccounts',
      });
      const chainId = walletChain(
        await provider.request({ method: 'eth_chainId' }),
      );
      if (!Array.isArray(accounts) || typeof accounts[0] !== 'string')
        throw new Error('No wallet account');
      const address = parseAddress(accounts[0]);
      if (attempt !== generation) return;
      const accountsChanged = (...args: unknown[]) => {
        try {
          const next = args[0];
          set({
            address:
              Array.isArray(next) && typeof next[0] === 'string'
                ? parseAddress(next[0])
                : null,
          });
        } catch {
          set({
            address: null,
            error: 'Wallet account changed to invalid data. Reconnect.',
          });
        }
      };
      const chainChanged = (...args: unknown[]) => {
        try {
          set({ chainId: walletChain(args[0]) });
        } catch {
          set({
            address: null,
            chainId: null,
            error: 'Invalid wallet network event. Reconnect.',
          });
        }
      };
      const disconnected = () => {
        generation++;
        detach();
        set({ address: null, chainId: null, connecting: false });
      };
      provider.on?.('accountsChanged', accountsChanged);
      provider.on?.('chainChanged', chainChanged);
      provider.on?.('disconnect', disconnected);
      detach = () => {
        provider.removeListener?.('accountsChanged', accountsChanged);
        provider.removeListener?.('chainChanged', chainChanged);
        provider.removeListener?.('disconnect', disconnected);
      };
      set({ address, chainId, connecting: false });
    } catch (error) {
      if (attempt === generation)
        set({
          address: null,
          chainId: null,
          connecting: false,
          error:
            error &&
            typeof error === 'object' &&
            'code' in error &&
            error.code === 4001
              ? 'Wallet connection rejected.'
              : 'Wallet connection failed. No transaction was requested.',
        });
    }
  },
  disconnect: () => {
    generation++;
    detach();
    set({ address: null, chainId: null, connecting: false, error: null });
  },
}));
