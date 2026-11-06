import { createPublicClient, formatEther, type Address } from 'viem';
import { mainnet, sepolia } from 'viem/chains';
import type { AnonRpcManager } from '../anon-rpc/AnonRpcManager';
import {
  anonymousViemTransport,
  rpcQuantity,
} from '../anon-rpc/JsonRpcAdapter';
import type {
  ReadChainId,
  AnonymousTransport,
} from '../anon-rpc/transportRegistry';
import { accountKind, parseAddress } from './address';

export type AccountInspection = {
  address: Address;
  chainId: ReadChainId;
  blockNumber: bigint;
  balanceWei: bigint;
  eth: string;
  code: `0x${string}`;
  kind: 'eoa' | 'code-present';
  readAt: number;
  transport: AnonymousTransport;
};
export function publicClient(
  manager: AnonRpcManager,
  chainId: ReadChainId,
  signal?: AbortSignal,
) {
  return createPublicClient({
    chain: chainId === 1 ? mainnet : sepolia,
    transport: anonymousViemTransport((method, params) =>
      manager.request(chainId, method, params, signal),
    ),
    batch: { multicall: false },
    cacheTime: 0,
  });
}
export async function inspectAccount(
  manager: AnonRpcManager,
  input: string,
  chainId: ReadChainId,
  signal?: AbortSignal,
): Promise<AccountInspection> {
  const address = parseAddress(input);
  signal?.throwIfAborted();
  await manager.initialize();
  signal?.throwIfAborted();
  const actualChain = rpcQuantity(
    await manager.request(chainId, 'eth_chainId', [], signal),
  );
  if (actualChain !== BigInt(chainId))
    throw new Error(
      'Anonymous RPC endpoint returned the wrong chain. No account reads were sent.',
    );
  const blockNumber = rpcQuantity(
    await manager.request(chainId, 'eth_blockNumber', [], signal),
  );
  const block = `0x${blockNumber.toString(16)}`;
  const balanceWei = rpcQuantity(
    await manager.request(chainId, 'eth_getBalance', [address, block], signal),
  );
  const code = await manager.request(
    chainId,
    'eth_getCode',
    [address, block],
    signal,
  );
  const kind = accountKind(code);
  signal?.throwIfAborted();
  return {
    address,
    chainId,
    blockNumber,
    balanceWei,
    eth: formatEther(balanceWei),
    code: code as `0x${string}`,
    kind,
    readAt: Date.now(),
    transport: manager.transport,
  };
}
