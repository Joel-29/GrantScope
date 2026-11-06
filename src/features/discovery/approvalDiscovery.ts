import { pad, toEventSelector, type Address } from 'viem';
import type { AnonRpcManager } from '../anon-rpc/AnonRpcManager';
import { rpcQuantity } from '../anon-rpc/JsonRpcAdapter';
import type { ReadChainId } from '../anon-rpc/transportRegistry';
import { parseAddress } from '../wallet/address';
import type { TokenSpenderPair } from '../erc20/types';
import { blockHeader, pagedLogs, type ChainLog } from './logs';

export const APPROVAL_TOPIC = toEventSelector(
  'Approval(address,address,uint256)',
);
export function approvalPair(
  log: ChainLog,
  owner: Address,
): TokenSpenderPair | null {
  // ERC-721 shares topic0 but indexes tokenId (four topics, empty data).
  if (
    log.removed ||
    log.topics.length !== 3 ||
    log.topics[0]?.toLowerCase() !== APPROVAL_TOPIC.toLowerCase() ||
    log.topics[1]?.toLowerCase() !== pad(owner).toLowerCase() ||
    !/^0x[0-9a-f]{64}$/i.test(log.data)
  )
    return null;
  const topic = log.topics[2]!;
  if (!/^0x0{24}[0-9a-f]{40}$/i.test(topic)) return null;
  return {
    token: log.address,
    spender: parseAddress(`0x${topic.slice(-40)}`),
    source: 'event',
  };
}
export async function discoverApprovals(
  manager: AnonRpcManager,
  ownerInput: string,
  chain: ReadChainId,
  options: {
    from?: bigint;
    to?: bigint;
    signal?: AbortSignal;
    onProgress?: (through: bigint) => void;
  } = {},
) {
  const owner = parseAddress(ownerInput);
  options.signal?.throwIfAborted();
  await manager.initialize();
  if (
    rpcQuantity(
      await manager.request(chain, 'eth_chainId', [], options.signal),
    ) !== BigInt(chain)
  )
    throw new Error('Wrong discovery chain');
  const head = rpcQuantity(
    await manager.request(chain, 'eth_blockNumber', [], options.signal),
  );
  const safe = head >= 12n ? head - 12n : 0n;
  const to = options.to ?? safe;
  if (to > safe)
    throw new Error(
      'Discovery ends at least 12 blocks behind the observed head',
    );
  const from = options.from ?? (to > 1999n ? to - 1999n : 0n);
  if (from < 0n || to < from || to - from >= 50000n)
    throw new Error('Invalid bounded discovery range');
  const anchor = await blockHeader(manager, chain, to, options.signal);
  const coverage = await pagedLogs(
    manager,
    chain,
    { topics: [APPROVAL_TOPIC, pad(owner)] },
    from,
    to,
    options,
  );
  const candidates = new Map<string, TokenSpenderPair>();
  let ignored = 0;
  const headers = new Map<bigint, Awaited<ReturnType<typeof blockHeader>>>();
  for (const log of coverage.logs) {
    const pair = approvalPair(log, owner);
    if (!pair) {
      ignored++;
      continue;
    }
    let header = headers.get(log.blockNumber);
    if (!header) {
      header = await blockHeader(
        manager,
        chain,
        log.blockNumber,
        options.signal,
      );
      headers.set(log.blockNumber, header);
    }
    if (header.hash.toLowerCase() !== log.blockHash.toLowerCase()) {
      coverage.warnings.push(
        'Noncanonical event excluded. Re-run after the chain stabilizes.',
      );
      continue;
    }
    const key = `${pair.token}:${pair.spender}`;
    const previous = candidates.get(key);
    if (!previous?.observedAt || previous.observedAt < header.timestamp)
      candidates.set(key, { ...pair, observedAt: header.timestamp });
  }
  const after = await blockHeader(manager, chain, to, options.signal);
  const reorg = anchor.hash.toLowerCase() !== after.hash.toLowerCase();
  if (reorg) {
    candidates.clear();
    coverage.warnings.push(
      'Range anchor changed during discovery; all candidates discarded. Re-run the range.',
    );
  }
  if (ignored)
    coverage.warnings.push(
      `${ignored} ambiguous/nonstandard events excluded; ERC-721 and nonstandard approvals are not covered.`,
    );
  if (candidates.size > 500)
    coverage.warnings.push(
      'Candidate verification capped at 500 pairs; additional candidates omitted.',
    );
  return {
    coverage,
    candidates: [...candidates.values()].slice(0, 500),
    ignored,
    reorg,
    head,
    safe,
    anchorHash: after.hash,
    completeRange:
      coverage.gaps.length === 0 && !reorg && !coverage.warnings.length,
  };
}
