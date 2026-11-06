import {
  decodeFunctionResult,
  encodeFunctionData,
  maxUint256,
  type Address,
  type Hex,
} from 'viem';
import { erc20Abi } from '../../lib/abi/erc20';
import { tokens } from '../../data/tokens';
import { classifySpender, spenders } from '../../data/spenders';
import type { AnonRpcManager } from '../anon-rpc/AnonRpcManager';
import { rpcQuantity } from '../anon-rpc/JsonRpcAdapter';
import type { ReadChainId } from '../anon-rpc/transportRegistry';
import { parseAddress } from '../wallet/address';
import { blockHeader } from '../discovery/logs';
import { allowanceSize } from './amounts';
import type { AllowanceScan, Erc20Permission, TokenSpenderPair } from './types';

function hasControl(value: string) {
  return [...value].some((char) => {
    const code = char.charCodeAt(0);
    return (
      code < 32 ||
      code === 127 ||
      (code >= 0x202a && code <= 0x202e) ||
      (code >= 0x2066 && code <= 0x2069)
    );
  });
}
export function knownPairs(chainId: ReadChainId): TokenSpenderPair[] {
  return tokens[chainId].flatMap((token) =>
    spenders[chainId].map((spender) => ({
      token: token.address,
      spender: spender.address,
      source: 'known-pair' as const,
    })),
  );
}
export function permissionId(
  chainId: ReadChainId,
  owner: Address,
  token: Address,
  spender: Address,
) {
  return `${chainId}:${owner.toLowerCase()}:${token.toLowerCase()}:${spender.toLowerCase()}`;
}
function validAmount(value: unknown): bigint {
  if (typeof value !== 'bigint' || value < 0n || value > maxUint256)
    throw new Error('Invalid token uint256');
  return value;
}
export async function contractRead(
  manager: AnonRpcManager,
  chainId: ReadChainId,
  token: Address,
  data: Hex,
  blockNumber: bigint,
  signal?: AbortSignal,
): Promise<Hex> {
  const result = await manager.request(
    chainId,
    'eth_call',
    [{ to: token, data }, `0x${blockNumber.toString(16)}`],
    signal,
  );
  if (
    typeof result !== 'string' ||
    !/^0x(?:[0-9a-f]{2})*$/i.test(result) ||
    result.length > 262146
  )
    throw new Error('Invalid or oversized contract response');
  return result as Hex;
}
type TokenSnapshot = {
  symbol: string;
  name: string;
  decimals: number;
  balance: bigint;
  warnings: string[];
};
async function readTokenSnapshot(
  manager: AnonRpcManager,
  chain: ReadChainId,
  owner: Address,
  token: Address,
  block: bigint,
  signal?: AbortSignal,
): Promise<TokenSnapshot> {
  const code = await manager.request(
    chain,
    'eth_getCode',
    [token, `0x${block.toString(16)}`],
    signal,
  );
  if (typeof code !== 'string' || !/^0x(?:[0-9a-f]{2})+$/i.test(code))
    throw new Error('Token has no readable contract bytecode');
  const read = async (
    functionName: 'decimals' | 'symbol' | 'name' | 'balanceOf',
  ) => {
    const data =
      functionName === 'balanceOf'
        ? encodeFunctionData({ abi: erc20Abi, functionName, args: [owner] })
        : encodeFunctionData({ abi: erc20Abi, functionName });
    const result = await contractRead(
      manager,
      chain,
      token,
      data,
      block,
      signal,
    );
    if (
      (functionName === 'decimals' || functionName === 'balanceOf') &&
      result.length !== 66
    )
      throw new Error('Noncanonical numeric token result');
    return decodeFunctionResult({ abi: erc20Abi, functionName, data: result });
  };
  const decimals = await read('decimals'),
    symbol = await read('symbol');
  if (
    typeof decimals !== 'number' ||
    !Number.isInteger(decimals) ||
    decimals < 0 ||
    decimals > 255 ||
    typeof symbol !== 'string' ||
    !symbol.length ||
    symbol.length > 64 ||
    hasControl(symbol)
  )
    throw new Error('Unsupported or malformed token metadata');
  const warnings: string[] = [];
  let name = symbol;
  try {
    const value = await read('name');
    if (
      typeof value === 'string' &&
      value.length > 0 &&
      value.length <= 128 &&
      !hasControl(value)
    )
      name = value;
    else warnings.push('Token name is unsupported.');
  } catch {
    signal?.throwIfAborted();
    warnings.push('Optional name() unavailable.');
  }
  const balance = validAmount(await read('balanceOf'));
  const registered = tokens[chain].find((item) => item.address === token);
  if (
    registered &&
    (registered.decimals !== decimals || registered.symbol !== symbol)
  )
    warnings.push(
      'Onchain metadata differs from the local registry; onchain values are displayed.',
    );
  return { symbol, name, decimals, balance, warnings };
}
export async function readErc20Pair(
  manager: AnonRpcManager,
  chainId: ReadChainId,
  owner: Address,
  pair: TokenSpenderPair,
  blockNumber: bigint,
  signal?: AbortSignal,
  cache?: Map<Address, Promise<TokenSnapshot>>,
): Promise<Erc20Permission> {
  const token = parseAddress(pair.token),
    spender = parseAddress(pair.spender);
  let pending = cache?.get(token);
  if (!pending) {
    pending = readTokenSnapshot(
      manager,
      chainId,
      owner,
      token,
      blockNumber,
      signal,
    );
    cache?.set(token, pending);
  }
  const snapshot = await pending;
  const data = encodeFunctionData({
    abi: erc20Abi,
    functionName: 'allowance',
    args: [owner, spender],
  });
  const result = await contractRead(
    manager,
    chainId,
    token,
    data,
    blockNumber,
    signal,
  );
  if (result.length !== 66) throw new Error('Noncanonical allowance result');
  const amount = validAmount(
    decodeFunctionResult({
      abi: erc20Abi,
      functionName: 'allowance',
      data: result,
    }),
  );
  const classification = classifySpender(chainId, spender);
  return {
    id: permissionId(chainId, owner, token, spender),
    kind: 'erc20',
    chainId,
    owner,
    token,
    spender,
    ...snapshot,
    warnings: [...snapshot.warnings],
    amount,
    size: allowanceSize(amount),
    blockNumber,
    readAt: Date.now(),
    knownSpender: classification.known,
    spenderName: classification.name,
    source: pair.source,
    ...(pair.observedAt === undefined ? {} : { observedAt: pair.observedAt }),
  };
}
export async function scanAllowances(
  manager: AnonRpcManager,
  ownerInput: string,
  chainId: ReadChainId,
  pairs: readonly TokenSpenderPair[],
  options: {
    signal?: AbortSignal;
    concurrency?: number;
    onProgress?: (done: number, total: number) => void;
  } = {},
): Promise<AllowanceScan> {
  const owner = parseAddress(ownerInput),
    { signal } = options;
  signal?.throwIfAborted();
  const requested = options.concurrency ?? 2;
  if (!Number.isFinite(requested)) throw new Error('Invalid scan concurrency');
  const concurrency = Math.max(1, Math.min(4, Math.floor(requested)));
  const unique = [
    ...new Map(
      pairs.map((pair) => {
        const item = {
          ...pair,
          token: parseAddress(pair.token),
          spender: parseAddress(pair.spender),
        };
        return [`${item.token}:${item.spender}`, item] as const;
      }),
    ).values(),
  ];
  if (unique.length > 512) throw new Error('Scan capped at 512 selected pairs');
  await manager.initialize();
  if (
    rpcQuantity(await manager.request(chainId, 'eth_chainId', [], signal)) !==
    BigInt(chainId)
  )
    throw new Error('Wrong chain; allowance scan refused');
  const blockNumber = rpcQuantity(
      await manager.request(chainId, 'eth_blockNumber', [], signal),
    ),
    before = await blockHeader(manager, chainId, blockNumber, signal);
  const rows: Erc20Permission[] = [],
    failures: AllowanceScan['failures'] = [],
    cache = new Map<Address, Promise<TokenSnapshot>>();
  let cursor = 0,
    completed = 0;
  options.onProgress?.(0, unique.length);
  await Promise.all(
    Array.from({ length: Math.min(concurrency, unique.length) }, async () => {
      while (cursor < unique.length) {
        signal?.throwIfAborted();
        const pair = unique[cursor++];
        if (!pair) break;
        try {
          rows.push(
            await readErc20Pair(
              manager,
              chainId,
              owner,
              pair,
              blockNumber,
              signal,
              cache,
            ),
          );
        } catch (error) {
          signal?.throwIfAborted();
          if (manager.getSnapshot().phase !== 'ready') throw error;
          failures.push({
            pair,
            reason:
              'Incomplete contract read: missing/nonstandard metadata, provider refusal, malformed return data or RPC failure. This is not zero allowance.',
          });
        }
        options.onProgress?.(++completed, unique.length);
      }
    }),
  );
  signal?.throwIfAborted();
  const after = await blockHeader(manager, chainId, blockNumber, signal);
  if (before.hash !== after.hash)
    throw new Error(
      'Allowance snapshot changed during scan; results discarded. Retry explicitly',
    );
  return {
    owner,
    chainId,
    rows: rows.sort((a, b) => a.id.localeCompare(b.id)),
    failures,
    blockNumber,
    attempted: unique.length,
    readAt: Date.now(),
    coverage: `${unique.length} selected token/spender pairs at block ${blockNumber}. No historical or exhaustive discovery is claimed.`,
  };
}
