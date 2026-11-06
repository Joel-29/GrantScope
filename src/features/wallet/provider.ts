import { walletRequest } from './requests';
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
  if (
    typeof value !== 'string' ||
    value.length > 66 ||
    !/^0x[0-9a-f]+$/i.test(value)
  )
    throw new Error('Invalid wallet chain');
  const id = BigInt(value);
  if (id <= 0n || id > BigInt(Number.MAX_SAFE_INTEGER))
    throw new Error('Invalid wallet chain');
  return Number(id);
}
function firstAccount(value: unknown): Address | null {
  if (!Array.isArray(value)) throw new Error('Invalid wallet accounts');
  return typeof value[0] === 'string' ? parseAddress(value[0]) : null;
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
    const attempt = ++generation;
    detach();
    const provider = injectedProvider();
    if (!provider) {
      set({
        address: null,
        chainId: null,
        connecting: false,
        error:
          'No injected Ethereum wallet found. Read-only inspection does not require one.',
      });
      return;
    }
    set({ address: null, chainId: null, connecting: true, error: null });
    let initializing = true,
      events = 0;
    const registered: { event: string; fn: (...args: unknown[]) => void }[] =
      [];
    const cleanup = () => {
      for (const { event, fn } of registered.splice(0)) {
        try {
          provider.removeListener?.(event, fn);
        } catch {
          /* Untrusted wallet cleanup must not prevent other listeners being detached. */
        }
      }
    };
    detach = cleanup;
    const accountsChanged = (...args: unknown[]) => {
      if (attempt !== generation) return;
      events++;
      if (initializing) return;
      try {
        set({ address: firstAccount(args[0]), error: null });
      } catch {
        set({
          address: null,
          error: 'Wallet account changed to invalid data. Reconnect.',
        });
      }
    };
    const chainChanged = (...args: unknown[]) => {
      if (attempt !== generation) return;
      events++;
      if (initializing) return;
      try {
        set({ chainId: walletChain(args[0]), error: null });
      } catch {
        set({
          address: null,
          chainId: null,
          error: 'Invalid wallet network event. Reconnect.',
        });
      }
    };
    const disconnected = () => {
      if (attempt !== generation) return;
      generation++;
      cleanup();
      set({
        address: null,
        chainId: null,
        connecting: false,
        error: 'Wallet disconnected.',
      });
    };
    try {
      for (const [event, fn] of [
        ['accountsChanged', accountsChanged],
        ['chainChanged', chainChanged],
        ['disconnect', disconnected],
      ] as const) {
        registered.push({ event, fn });
        provider.on?.(event, fn);
      }
      if (attempt !== generation) {
        cleanup();
        return;
      }
      await walletRequest(provider, { method: 'eth_requestAccounts' });
      for (let retry = 0; retry < 2; retry++) {
        const version = events;
        const accounts = await walletRequest(provider, {
          method: 'eth_accounts',
        });
        const chainId = walletChain(
          await walletRequest(provider, { method: 'eth_chainId' }),
        );
        if (attempt !== generation) {
          cleanup();
          return;
        }
        if (version !== events) continue;
        const address = firstAccount(accounts);
        if (!address) throw new Error('No authorized account');
        initializing = false;
        set({ address, chainId, connecting: false, error: null });
        return;
      }
      throw new Error('Wallet context changed during connection');
    } catch (error) {
      cleanup();
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
              : 'Wallet connection failed or changed while connecting. Retry explicitly. No transaction was requested.',
        });
    }
  },
  disconnect: () => {
    generation++;
    detach();
    set({ address: null, chainId: null, connecting: false, error: null });
  },
}));
