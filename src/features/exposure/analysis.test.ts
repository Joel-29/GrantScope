import { describe, expect, it } from 'vitest';
import { maxUint256 } from 'viem';
import { PERMIT2_ADDRESS } from '../../data/spenders';
import type { Erc20Permission } from '../erc20/types';
import type { Permit2Grant } from '../permit2/engine';
import { analyze, groupPermissions } from './analysis';
const address = '0x0000000000000000000000000000000000000001';
export const row: Erc20Permission = {
  id: 'checked-record',
  kind: 'erc20',
  chainId: 11155111,
  owner: address,
  token: address,
  spender: address,
  symbol: 'TEST',
  name: 'Unit fixture',
  decimals: 18,
  balance: 1000000000000000001n,
  amount: 2n,
  size: 'limited',
  blockNumber: 10n,
  readAt: 1,
  knownSpender: false,
  spenderName: 'Unclassified',
  source: 'manual',
  warnings: [],
};
const context = { nowSeconds: 20000000n, incomplete: true };
function grant(overrides: Partial<Permit2Grant> = {}): Permit2Grant {
  return {
    id: 'permit2-record',
    kind: 'permit2',
    owner: address,
    chainId: 11155111,
    token: address,
    spender: address,
    amount: 50n,
    expiration: 100n,
    nonce: 0n,
    blockNumber: 10n,
    blockTimestamp: 100n,
    expired: false,
    underlying: { ...row, spender: PERMIT2_ADDRESS, amount: 30n },
    codeHash: '0x',
    readAt: 1,
    ...overrides,
  };
}
describe('deterministic authority analysis', () => {
  it('keeps unknown classification separate from maliciousness and preserves one-wei precision', () => {
    const a = analyze(row, context);
    expect(a.bound).toBe(2n);
    expect(a.status).toBe('review');
    expect(a.reasons.join(' ')).toContain('Unknown does not mean malicious');
    expect(a.warnings.join(' ')).toContain('age is unknown');
  });
  it('never equates maximum allowance with certain loss, including a zero balance', () => {
    const a = analyze(
      { ...row, amount: maxUint256, size: 'maximum', balance: 0n },
      context,
    );
    expect(a.bound).toBe(0n);
    expect(a.reasons.join(' ')).toContain('future deposits');
    expect(a.reasons.join(' ')).toContain('does not imply certain loss');
  });
  it('applies Permit2 expiration and shared dependency rather than adding overlapping layers', () => {
    expect(analyze(grant(), context).bound).toBe(30n);
    expect(analyze(grant({ blockTimestamp: 101n }), context).status).toBe(
      'expired',
    );
    expect(
      analyze(grant({ underlying: { ...row, amount: 0n } }), context).status,
    ).toBe('dependency-blocked');
    expect(analyze(grant({ amount: 0n }), context).status).toBe('zero');
  });
  it('only uses a known observed event time, disclosing future-clock and creation-age uncertainty', () => {
    expect(
      analyze({ ...row, observedAt: 1n }, context).reasons.join(' '),
    ).toContain('not proof of the original grant age');
    expect(
      analyze(
        { ...row, observedAt: context.nowSeconds + 1n },
        context,
      ).warnings.join(' '),
    ).toContain('ahead');
  });
  it('groups by chain owner token and flags mixed block snapshots without computing total loss', () => {
    const g = groupPermissions([
      row,
      { ...row, id: 'second', blockNumber: 11n },
      grant(),
    ]);
    expect(g).toHaveLength(1);
    expect(g[0]?.mixedBlocks).toBe(true);
    expect(g[0]).not.toHaveProperty('totalLoss');
  });
  it('rejects negative and out-of-width adversarial quantities', () => {
    for (const amount of [-1n, maxUint256 + 1n])
      expect(() => analyze({ ...row, amount }, context)).toThrow();
    expect(() => analyze(grant({ amount: 1n << 160n }), context)).toThrow();
  });
});
