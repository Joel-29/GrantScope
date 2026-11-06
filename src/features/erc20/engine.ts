import {
  decodeFunctionResult,
  encodeFunctionData,
  type Address,
  type Hex,
  maxUint256,
} from 'viem';
import { erc20Abi } from '../../lib/abi/erc20';
import { tokens } from '../../data/tokens';
import { classifySpender, spenders } from '../../data/spenders';
import type { AnonRpcManager } from '../anon-rpc/AnonRpcManager';
import { rpcQuantity } from '../anon-rpc/JsonRpcAdapter';
import type { ReadChainId } from '../anon-rpc/transportRegistry';
import { parseAddress } from '../wallet/address';
import { allowanceSize } from './amounts';
import type { AllowanceScan, Erc20Permission, TokenSpenderPair } from './types';

function hasControl(value: string) {
  return [...value].some(
    (char) => char.charCodeAt(0) < 32 || char.charCodeAt(0) === 127,
  );
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
export async function readErc20Pair(
  manager: AnonRpcManager,
  chainId: ReadChainId,
  owner: Address,
  pair: TokenSpenderPair,
  blockNumber: bigint,
  signal?: AbortSignal,
): Promise<Erc20Permission> {
  const token = parseAddress(pair.token),
    spender = parseAddress(pair.spender);
  const warnings: string[] = [];
  const code = await manager.request(
    chainId,
    'eth_getCode',
    [token, `0x${blockNumber.toString(16)}`],
    signal,
  );
  if (typeof code !== 'string' || !/^0x(?:[0-9a-f]{2})+$/i.test(code))
    throw new Error('Token has no readable contract bytecode');
  const read = async (
    name: 'decimals' | 'symbol' | 'name' | 'balanceOf' | 'allowance',
  ) => {
    const data =
      name === 'allowance'
        ? encodeFunctionData({
            abi: erc20Abi,
            functionName: name,
            args: [owner, spender],
          })
        : name === 'balanceOf'
          ? encodeFunctionData({
              abi: erc20Abi,
              functionName: name,
              args: [owner],
            })
          : encodeFunctionData({ abi: erc20Abi, functionName: name });
    const result = await contractRead(
      manager,
      chainId,
      token,
      data,
      blockNumber,
      signal,
    );
    return decodeFunctionResult({
      abi: erc20Abi,
      functionName: name,
      data: result,
    });
  };
  const decimals = await read('decimals');
  const symbol = await read('symbol');
  if (
    typeof decimals !== 'number' ||
    !Number.isInteger(decimals) ||
    decimals < 0 ||
    decimals > 255 ||
    typeof symbol !== 'string' ||
    symbol.length < 1 ||
    symbol.length > 64 ||
    hasControl(symbol)
  )
    throw new Error('Unsupported or malformed token metadata');
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
  const balance = validAmount(await read('balanceOf')),
    amount = validAmount(await read('allowance'));
  const registered = tokens[chainId].find((item) => item.address === token);
  if (
    registered &&
    (registered.decimals !== decimals || registered.symbol !== symbol)
  )
    warnings.push(
      'Onchain metadata differs from the local registry; onchain values are displayed.',
    );
  const classification = classifySpender(chainId, spender);
  return {
    id: permissionId(chainId, owner, token, spender),
    kind: 'erc20',
    chainId,
    owner,
    token,
    spender,
    symbol,
    name,
    decimals,
    balance,
    amount,
    size: allowanceSize(amount),
    blockNumber,
    readAt: Date.now(),
    knownSpender: classification.known,
    spenderName: classification.name,
    source: pair.source,
    warnings,
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
  const owner = parseAddress(ownerInput);
  const { signal } = options;
  signal?.throwIfAborted();
  await manager.initialize();
  if (
    rpcQuantity(await manager.request(chainId, 'eth_chainId', [], signal)) !==
    BigInt(chainId)
  )
    throw new Error('Wrong chain; allowance scan refused');
  const blockNumber = rpcQuantity(
    await manager.request(chainId, 'eth_blockNumber', [], signal),
  );
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
  const rows: Erc20Permission[] = [],
    failures: AllowanceScan['failures'] = [];
  let cursor = 0,
    completed = 0;
  options.onProgress?.(0, unique.length);
  const requested = options.concurrency ?? 2;
  if (!Number.isFinite(requested)) throw new Error('Invalid scan concurrency');
  const count = Math.max(1, Math.min(4, Math.floor(requested)));
  await Promise.all(
    Array.from({ length: Math.min(count, unique.length) }, async () => {
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
            ),
          );
        } catch {
          signal?.throwIfAborted();
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
