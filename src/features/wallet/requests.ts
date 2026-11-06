import type { InjectedProvider } from './provider';
import { anonRpc } from '../anon-rpc/runtime';
import type { RequestMetric } from '../anon-rpc/types';
type WalletMethod =
  | 'eth_requestAccounts'
  | 'eth_accounts'
  | 'eth_chainId'
  | 'wallet_switchEthereumChain'
  | 'eth_sendTransaction';
let sequence = 0;
export async function walletRequest(
  provider: InjectedProvider,
  args: { method: WalletMethod; params?: readonly unknown[] },
  chainId = 0,
): Promise<unknown> {
  const allowed = new Set<WalletMethod>([
    'eth_requestAccounts',
    'eth_accounts',
    'eth_chainId',
    'wallet_switchEthereumChain',
    'eth_sendTransaction',
  ]);
  if (!allowed.has(args.method))
    throw new Error('Wallet adapter refuses application blockchain reads');
  if (args.method === 'wallet_switchEthereumChain') {
    const parameter = args.params?.[0];
    if (
      !Array.isArray(args.params) ||
      args.params?.length !== 1 ||
      !parameter ||
      typeof parameter !== 'object' ||
      Array.isArray(parameter) ||
      Object.keys(parameter).length !== 1 ||
      !Object.hasOwn(parameter, 'chainId') ||
      !('chainId' in parameter) ||
      typeof parameter.chainId !== 'string' ||
      !['0x1', '0xaa36a7'].includes(parameter.chainId)
    )
      throw new Error('Wallet network switch requires one supported chain ID');
    chainId = Number(BigInt(parameter.chainId));
  }
  const start = performance.now(),
    timestamp = new Date().toISOString(),
    id = --sequence;
  let outcome: RequestMetric['outcome'] = 'failed';
  try {
    const result = await provider.request(args);
    if (
      args.method === 'eth_chainId' &&
      typeof result === 'string' &&
      result.length <= 66 &&
      /^0x[0-9a-f]+$/i.test(result) &&
      BigInt(result) <= BigInt(Number.MAX_SAFE_INTEGER)
    )
      chainId = Number(BigInt(result));
    outcome = 'successful';
    return result;
  } catch (error) {
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      error.code === 4001
    )
      outcome = 'cancelled';
    throw error;
  } finally {
    anonRpc.recordWallet({
      id,
      timestamp,
      method: args.method,
      chainId,
      category: 'wallet',
      requestedTransport: 'wallet',
      actualTransport: 'wallet-provider',
      outcome,
      durationMs: Math.round(performance.now() - start),
      anonymized: false,
      directException: false,
      reason:
        args.method === 'eth_sendTransaction'
          ? 'Wallet-provider submission; extension internals unobserved'
          : args.method === 'wallet_switchEthereumChain'
            ? 'Explicit wallet network change; extension internals unobserved'
            : 'Wallet account/network metadata; extension internals unobserved',
    });
  }
}
