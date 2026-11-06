import { READ_NETWORKS, type ReadChainId } from '../anon-rpc/transportRegistry';

export function supportedWalletChain(
  chainId: number | null,
): chainId is ReadChainId {
  return chainId !== null && Object.hasOwn(READ_NETWORKS, chainId);
}
export function walletNetworkLabel(chainId: number | null): string {
  if (chainId === null) return 'Not reported';
  if (!supportedWalletChain(chainId)) return `Unsupported network (${chainId})`;
  return `${chainId === 1 ? 'Ethereum mainnet' : 'Ethereum Sepolia'} (${chainId})`;
}
