import { type Address, type Hex } from 'viem';
import type { AnonRpcManager } from '../anon-rpc/AnonRpcManager';
import type { ReadChainId } from '../anon-rpc/transportRegistry';
import { rpcQuantity } from '../anon-rpc/JsonRpcAdapter';
import { parseAddress } from '../wallet/address';

export type ChainLog = {
  address: Address;
  topics: Hex[];
  data: Hex;
  blockNumber: bigint;
  blockHash: Hex;
  transactionHash: Hex;
  logIndex: bigint;
  removed: boolean;
};
export function hash32(value: unknown): Hex {
  if (typeof value !== 'string' || !/^0x[0-9a-f]{64}$/i.test(value))
    throw new Error('Invalid block/log hash');
  return value as Hex;
}
export function logValue(value: unknown): ChainLog {
  if (!value || typeof value !== 'object') throw new Error('Invalid log');
  const v = value as Record<string, unknown>;
  if (
    !Array.isArray(v.topics) ||
    v.topics.length > 4 ||
    typeof v.data !== 'string' ||
    !/^0x(?:[0-9a-f]{2})*$/i.test(v.data) ||
    v.data.length > 4098 ||
    typeof v.removed !== 'boolean'
  )
    throw new Error('Malformed log');
  return {
    address: parseAddress(String(v.address)),
    topics: v.topics.map(hash32),
    data: v.data as Hex,
    blockNumber: rpcQuantity(v.blockNumber),
    blockHash: hash32(v.blockHash),
    transactionHash: hash32(v.transactionHash),
    logIndex: rpcQuantity(v.logIndex),
    removed: v.removed,
  };
}
export async function blockHeader(
  manager: AnonRpcManager,
  chain: ReadChainId,
  block: bigint,
  signal?: AbortSignal,
) {
  const v = await manager.request(
    chain,
    'eth_getBlockByNumber',
    [`0x${block.toString(16)}`, false],
    signal,
  );
  if (
    !v ||
    typeof v !== 'object' ||
    !('number' in v) ||
    !('hash' in v) ||
    !('timestamp' in v) ||
    rpcQuantity(v.number) !== block
  )
    throw new Error('Unreadable block anchor');
  return {
    number: block,
    hash: hash32(v.hash),
    timestamp: rpcQuantity(v.timestamp),
  };
}
export type LogCoverage = {
  from: bigint;
  to: bigint;
  covered: { from: bigint; to: bigint }[];
  gaps: { from: bigint; to: bigint }[];
  requests: number;
  warnings: string[];
  logs: ChainLog[];
};
export async function pagedLogs(
  manager: AnonRpcManager,
  chain: ReadChainId,
  filter: {
    topics: readonly (Hex | readonly Hex[] | null)[];
    address?: Address;
  },
  from: bigint,
  to: bigint,
  options: {
    signal?: AbortSignal;
    chunk?: bigint;
    maxRequests?: number;
    onProgress?: (through: bigint) => void;
  } = {},
): Promise<LogCoverage> {
  if (from < 0n || to < from || to - from >= 50000n)
    throw new Error('Choose an ordered range of at most 50,000 blocks');
  const cap = options.maxRequests ?? 128;
  if (!Number.isInteger(cap) || cap < 1 || cap > 512)
    throw new Error('Invalid request cap');
  let chunk = options.chunk ?? 2000n;
  if (chunk < 1n || chunk > 10000n) throw new Error('Invalid log chunk');
  const result: LogCoverage = {
    from,
    to,
    covered: [],
    gaps: [],
    requests: 0,
    warnings: [],
    logs: [],
  };
  const seen = new Set<string>();
  let cursor = from;
  while (cursor <= to && result.requests < cap) {
    options.signal?.throwIfAborted();
    const end = cursor + chunk - 1n > to ? to : cursor + chunk - 1n;
    try {
      result.requests++;
      const value = await manager.request(
        chain,
        'eth_getLogs',
        [
          {
            ...filter,
            fromBlock: `0x${cursor.toString(16)}`,
            toBlock: `0x${end.toString(16)}`,
          },
        ],
        options.signal,
      );
      if (!Array.isArray(value) || value.length > 10000)
        throw new Error('Invalid or oversized log page');
      // Provider result caps may truncate even successful responses. Split dense pages.
      if (value.length >= 1000 && chunk > 1n) {
        chunk = (chunk + 1n) / 2n;
        continue;
      }
      if (value.length >= 1000) {
        result.gaps.push({ from: cursor, to: end });
        result.warnings.push('Dense single-block log page may be truncated.');
        cursor = end + 1n;
        continue;
      }
      const page = value.map(logValue);
      if (page.some((log) => log.blockNumber < cursor || log.blockNumber > end))
        throw new Error('Out-of-range log response');
      for (const log of page) {
        if (log.removed) {
          result.warnings.push(
            'Removed log ignored; reorg or provider inconsistency detected.',
          );
          continue;
        }
        const key = `${log.blockHash}:${log.transactionHash}:${log.logIndex}`;
        if (!seen.has(key)) {
          seen.add(key);
          result.logs.push(log);
        }
      }
      result.covered.push({ from: cursor, to: end });
      cursor = end + 1n;
      options.onProgress?.(end);
      if (result.logs.length > 2000) {
        result.warnings.push(
          'Local 2,000-event safety limit reached; candidates are incomplete.',
        );
        break;
      }
    } catch {
      options.signal?.throwIfAborted();
      if (chunk > 1n) {
        chunk = (chunk + 1n) / 2n;
        continue;
      }
      result.gaps.push({ from: cursor, to: end });
      cursor = end + 1n;
    }
  }
  if (cursor <= to) result.gaps.push({ from: cursor, to });
  if (result.gaps.length)
    result.warnings.push(
      'Some blocks could not be scanned. No exhaustive discovery is claimed.',
    );
  return result;
}
