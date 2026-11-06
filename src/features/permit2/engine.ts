import {
  decodeEventLog,
  decodeFunctionResult,
  encodeFunctionData,
  keccak256,
  pad,
  toEventSelector,
  type Address,
} from 'viem';
import { permit2Abi } from '../../lib/abi/permit2';
import { PERMIT2_ADDRESS, spenders } from '../../data/spenders';
import { tokens } from '../../data/tokens';
import type { AnonRpcManager } from '../anon-rpc/AnonRpcManager';
import type { ReadChainId } from '../anon-rpc/transportRegistry';
import { rpcQuantity } from '../anon-rpc/JsonRpcAdapter';
import { parseAddress } from '../wallet/address';
import { blockHeader, pagedLogs, type ChainLog } from '../discovery/logs';
import { contractRead, permissionId, readErc20Pair } from '../erc20/engine';
import type { Erc20Permission, TokenSpenderPair } from '../erc20/types';

export type Permit2Grant = {
  id: string;
  kind: 'permit2';
  owner: Address;
  chainId: ReadChainId;
  token: Address;
  spender: Address;
  amount: bigint;
  expiration: bigint;
  nonce: bigint;
  blockNumber: bigint;
  blockTimestamp: bigint;
  expired: boolean;
  underlying: Erc20Permission;
  codeHash: string;
  readAt: number;
};
export const PERMIT_TOPIC = toEventSelector(
  'Permit(address,address,address,uint160,uint48,uint48)',
);
export const PERMIT_APPROVAL_TOPIC = toEventSelector(
  'Approval(address,address,address,uint160,uint48)',
);
export function permitEventPair(
  log: ChainLog,
  owner: Address,
): TokenSpenderPair | null {
  if (
    log.removed ||
    log.address.toLowerCase() !== PERMIT2_ADDRESS.toLowerCase() ||
    log.topics.length !== 4 ||
    log.topics[1]?.toLowerCase() !== pad(owner).toLowerCase()
  )
    return null;
  try {
    const decoded = decodeEventLog({
      abi: permit2Abi,
      topics: log.topics as [typeof PERMIT_TOPIC, ...(typeof PERMIT_TOPIC)[]],
      data: log.data,
      strict: true,
    });
    if (decoded.eventName !== 'Permit' && decoded.eventName !== 'Approval')
      return null;
    return {
      token: parseAddress(decoded.args.token),
      spender: parseAddress(decoded.args.spender),
      source: 'event',
    };
  } catch {
    return null;
  }
}
function smallUint(value: unknown): bigint {
  if (
    typeof value !== 'number' ||
    !Number.isSafeInteger(value) ||
    value < 0 ||
    value > 2 ** 48 - 1
  )
    throw new Error('Malformed uint48');
  return BigInt(value);
}
export async function inspectPermit2(
  manager: AnonRpcManager,
  ownerInput: string,
  chainId: ReadChainId,
  pairs: readonly TokenSpenderPair[],
  options: { signal?: AbortSignal | undefined; blockNumber?: bigint } = {},
) {
  const owner = parseAddress(ownerInput),
    signal = options.signal;
  signal?.throwIfAborted();
  await manager.initialize();
  if (
    rpcQuantity(await manager.request(chainId, 'eth_chainId', [], signal)) !==
    BigInt(chainId)
  )
    throw new Error('Wrong Permit2 chain');
  const blockNumber =
    options.blockNumber ??
    rpcQuantity(await manager.request(chainId, 'eth_blockNumber', [], signal));
  const header = await blockHeader(manager, chainId, blockNumber, signal);
  const code = await manager.request(
    chainId,
    'eth_getCode',
    [PERMIT2_ADDRESS, `0x${blockNumber.toString(16)}`],
    signal,
  );
  if (typeof code !== 'string' || !/^0x(?:[0-9a-f]{2})+$/i.test(code))
    throw new Error('Canonical Permit2 address has no readable code');
  const unique = [
    ...new Map(
      pairs.map((pair) => {
        const p = {
          ...pair,
          token: parseAddress(pair.token),
          spender: parseAddress(pair.spender),
        };
        return [`${p.token}:${p.spender}`, p] as const;
      }),
    ).values(),
  ];
  if (unique.length > 500)
    throw new Error('Permit2 verification capped at 500 pairs');
  const rows: Permit2Grant[] = [],
    failures: TokenSpenderPair[] = [];
  const underlying = new Map<Address, Erc20Permission>();
  for (const pair of unique) {
    signal?.throwIfAborted();
    try {
      const data = encodeFunctionData({
        abi: permit2Abi,
        functionName: 'allowance',
        args: [owner, pair.token, pair.spender],
      });
      const [amount, expirationValue, nonceValue] = decodeFunctionResult({
        abi: permit2Abi,
        functionName: 'allowance',
        data: await contractRead(
          manager,
          chainId,
          PERMIT2_ADDRESS,
          data,
          blockNumber,
          signal,
        ),
      });
      const expiration = smallUint(expirationValue),
        nonce = smallUint(nonceValue);
      if (amount < 0n || amount > (1n << 160n) - 1n)
        throw new Error('Malformed uint160');
      let dependency = underlying.get(pair.token);
      if (!dependency) {
        dependency = await readErc20Pair(
          manager,
          chainId,
          owner,
          { token: pair.token, spender: PERMIT2_ADDRESS, source: pair.source },
          blockNumber,
          signal,
        );
        underlying.set(pair.token, dependency);
      }
      rows.push({
        id: `permit2:${permissionId(chainId, owner, pair.token, pair.spender)}`,
        kind: 'permit2',
        owner,
        chainId,
        token: pair.token,
        spender: pair.spender,
        amount,
        expiration,
        nonce,
        blockNumber,
        blockTimestamp: header.timestamp,
        expired: header.timestamp > expiration,
        underlying: dependency,
        codeHash: keccak256(code as `0x${string}`),
        readAt: Date.now(),
      });
    } catch {
      signal?.throwIfAborted();
      failures.push(pair);
    }
  }
  return {
    rows,
    failures,
    blockNumber,
    coverage: `${unique.length} selected AllowanceTransfer pairs at block ${blockNumber}. Offchain SignatureTransfer permissions are not enumerable.`,
  };
}
export function knownPermit2Pairs(chainId: ReadChainId): TokenSpenderPair[] {
  return tokens[chainId].flatMap((token) =>
    spenders[chainId]
      .filter((spender) => spender.address !== PERMIT2_ADDRESS)
      .map((spender) => ({
        token: token.address,
        spender: spender.address,
        source: 'known-pair' as const,
      })),
  );
}
export async function discoverPermit2(
  manager: AnonRpcManager,
  ownerInput: string,
  chain: ReadChainId,
  signal?: AbortSignal,
) {
  const owner = parseAddress(ownerInput);
  await manager.initialize();
  if (
    rpcQuantity(await manager.request(chain, 'eth_chainId', [], signal)) !==
    BigInt(chain)
  )
    throw new Error('Wrong discovery chain');
  const head = rpcQuantity(
    await manager.request(chain, 'eth_blockNumber', [], signal),
  );
  const to = head > 12n ? head - 12n : 0n,
    from = to > 1999n ? to - 1999n : 0n;
  const before = await blockHeader(manager, chain, to, signal);
  const coverage = await pagedLogs(
    manager,
    chain,
    {
      address: PERMIT2_ADDRESS,
      topics: [[PERMIT_TOPIC, PERMIT_APPROVAL_TOPIC], pad(owner)],
    },
    from,
    to,
    { signal },
  );
  const candidates: TokenSpenderPair[] = [];
  const headers = new Map<bigint, string>();
  for (const log of coverage.logs) {
    const pair = permitEventPair(log, owner);
    if (!pair) {
      coverage.warnings.push('Unrecognized Permit2 event excluded.');
      continue;
    }
    let hash = headers.get(log.blockNumber);
    if (!hash) {
      hash = (await blockHeader(manager, chain, log.blockNumber, signal)).hash;
      headers.set(log.blockNumber, hash);
    }
    if (hash.toLowerCase() === log.blockHash.toLowerCase())
      candidates.push(pair);
    else coverage.warnings.push('Noncanonical Permit2 event excluded.');
  }
  const after = await blockHeader(manager, chain, to, signal);
  if (before.hash.toLowerCase() !== after.hash.toLowerCase())
    throw new Error('Permit2 discovery anchor changed; retry explicitly');
  return {
    coverage,
    verification: await inspectPermit2(manager, owner, chain, candidates, {
      signal,
    }),
  };
}
