import { PERMIT2_ADDRESS, classifySpender } from '../../data/spenders';
import { maxUint256 } from 'viem';
import type { Erc20Permission } from '../erc20/types';
import type { Permit2Grant } from '../permit2/engine';

export type Permission = Erc20Permission | Permit2Grant;
export type Assessment = {
  id: string;
  status: 'zero' | 'expired' | 'dependency-blocked' | 'active' | 'review';
  bound: bigint;
  reasons: string[];
  warnings: string[];
  layer: 'direct' | 'permit2-underlying' | 'permit2-grant';
  needsReview: boolean;
};
const min = (...values: bigint[]) => values.reduce((a, b) => (a < b ? a : b));
export function analyze(
  permission: Permission,
  context: { nowSeconds: bigint; incomplete: boolean },
): Assessment {
  const reasons: string[] = [],
    warnings: string[] = [];
  const token =
    permission.kind === 'erc20' ? permission : permission.underlying;
  if (
    token.amount < 0n ||
    token.balance < 0n ||
    permission.amount < 0n ||
    token.amount > maxUint256 ||
    token.balance > maxUint256 ||
    permission.amount >
      (permission.kind === 'permit2' ? (1n << 160n) - 1n : maxUint256)
  )
    throw new Error('Negative permission inputs');
  const layer =
    permission.kind === 'permit2'
      ? 'permit2-grant'
      : permission.spender.toLowerCase() === PERMIT2_ADDRESS.toLowerCase()
        ? 'permit2-underlying'
        : 'direct';
  const result: Assessment = {
    id: permission.id,
    status: 'active',
    bound: 0n,
    reasons,
    warnings,
    layer,
    needsReview: false,
  };
  if (context.incomplete)
    warnings.push(
      'Coverage is bounded or incomplete. Other permissions and nonstandard behavior may be missing.',
    );
  warnings.push(
    'This is a current authority bound, not an expected loss or a guarantee of contract behavior.',
  );
  if (permission.amount === 0n) {
    result.status = 'zero';
    reasons.push('This checked permission has zero current allowance.');
    return result;
  }
  if (permission.kind === 'permit2') {
    if (permission.blockTimestamp > permission.expiration) {
      result.status = 'expired';
      reasons.push(
        'Stored AllowanceTransfer grant was expired at the verified block.',
      );
      return result;
    }
    if (permission.underlying.amount === 0n) {
      result.status = 'dependency-blocked';
      reasons.push(
        'Permit2 lacks the required underlying token approval at this block. A later approval can reactivate an unexpired grant.',
      );
      return result;
    }
    result.bound = min(permission.amount, token.amount, token.balance);
    reasons.push(
      'Per-spender bound is the minimum of balance, ERC-20 approval to Permit2, and this unexpired grant. Shared layers must not be added.',
    );
    if (permission.amount === (1n << 160n) - 1n) {
      result.needsReview = true;
      reasons.push(
        'Permit2 grant uses the maximum uint160 amount. This is authority, not evidence of theft.',
      );
    }
    if (!classifySpender(permission.chainId, permission.spender).known) {
      result.needsReview = true;
      reasons.push('Spender is unclassified. Unknown does not mean malicious.');
    }
    warnings.push(
      'Unused signed permits or SignatureTransfer permissions are not enumerated. Lockdown alone does not invalidate them.',
    );
  } else {
    result.bound = min(permission.amount, permission.balance);
    reasons.push(
      layer === 'permit2-underlying'
        ? 'This is the shared ERC-20 approval to Permit2, not a separate per-spender grant.'
        : 'Per-permission bound is the minimum of current balance and allowance.',
    );
    if (permission.size === 'maximum' || permission.size === 'near-maximum') {
      result.needsReview = true;
      reasons.push(
        'Maximum or near-maximum authority can also cover future balances. It does not imply certain loss.',
      );
    }
    if (!permission.knownSpender) {
      result.needsReview = true;
      reasons.push('Spender is unclassified. Unknown does not mean malicious.');
    }
    if (permission.observedAt !== undefined) {
      if (permission.observedAt > context.nowSeconds)
        warnings.push(
          'Observed event timestamp is ahead of this analysis clock; age is unknown.',
        );
      else if (context.nowSeconds - permission.observedAt > 180n * 86400n) {
        result.needsReview = true;
        reasons.push(
          'Latest observed Approval event is over 180 days old. This is not proof of the original grant age.',
        );
      }
    } else
      warnings.push('Grant age is unknown; no creation date was inferred.');
    warnings.push(...permission.warnings);
  }
  if (token.balance === 0n)
    reasons.push(
      'Current token balance is zero; positive authority may cover future deposits.',
    );
  else if (permission.amount > token.balance) {
    result.needsReview = true;
    reasons.push(
      'Allowance exceeds the current balance; later deposits may also be within its authority.',
    );
  }
  result.status = result.needsReview ? 'review' : 'active';
  return result;
}
export function groupPermissions(records: readonly Permission[]) {
  const groups = new Map<string, Permission[]>();
  for (const record of records) {
    const key = `${record.chainId}:${record.owner.toLowerCase()}:${record.token.toLowerCase()}`;
    groups.set(key, [...(groups.get(key) ?? []), record]);
  }
  return [...groups.entries()].map(([id, rows]) => ({
    id,
    rows,
    mixedBlocks:
      new Set(rows.map((row) => row.blockNumber.toString())).size > 1,
  }));
}
