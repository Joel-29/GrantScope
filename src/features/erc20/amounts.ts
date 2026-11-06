import { formatUnits, maxUint256 } from 'viem';

export const NEAR_MAXIMUM = maxUint256 - ((1n << 128n) - 1n);
export function allowanceSize(
  amount: bigint,
): 'zero' | 'limited' | 'maximum' | 'near-maximum' {
  if (amount < 0n || amount > maxUint256)
    throw new Error('Allowance is outside uint256');
  if (amount === 0n) return 'zero';
  if (amount === maxUint256) return 'maximum';
  if (amount >= NEAR_MAXIMUM) return 'near-maximum';
  return 'limited';
}
export function tokenAmount(amount: bigint, decimals: number): string {
  if (
    !Number.isInteger(decimals) ||
    decimals < 0 ||
    decimals > 255 ||
    amount < 0n ||
    amount > maxUint256
  )
    throw new Error('Invalid token units');
  return formatUnits(amount, decimals);
}
