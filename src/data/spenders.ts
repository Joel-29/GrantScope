import { getAddress, type Address } from 'viem';
import type { ReadChainId } from '../features/anon-rpc/transportRegistry';

export const PERMIT2_ADDRESS = getAddress(
  '0x000000000022d473030f116ddee9f6b43ac78ba3',
);
export type Spender = { address: Address; name: string; source: string };
const source =
  'https://developers.uniswap.org/docs/protocols/v3/deployments/v3-ethereum-deployments';
export const spenders: Record<ReadChainId, readonly Spender[]> = {
  1: [
    { address: PERMIT2_ADDRESS, name: 'Uniswap Permit2', source },
    {
      address: getAddress('0x68b3465833fb72a70ecdf485e0e4c7bd8665fc45'),
      name: 'Uniswap SwapRouter02',
      source,
    },
    {
      address: getAddress('0x66a9893cc07d91d95644aedd05d03f95e1dba8af'),
      name: 'Uniswap Universal Router',
      source,
    },
  ],
  11155111: [
    { address: PERMIT2_ADDRESS, name: 'Uniswap Permit2', source },
    {
      address: getAddress('0x3bfa4769fb09eefc5a80d6e87c3b9c650f7ae48e'),
      name: 'Uniswap SwapRouter02',
      source,
    },
    {
      address: getAddress('0x3a9d48ab9751398bbfa63ad67599bb04e4bdf98b'),
      name: 'Uniswap Universal Router',
      source,
    },
  ],
};
export function classifySpender(chainId: ReadChainId, address: Address) {
  const known = spenders[chainId].find(
    (item) => item.address.toLowerCase() === address.toLowerCase(),
  );
  return {
    known: Boolean(known),
    name: known?.name ?? 'Unknown spender',
    explanation: known
      ? 'Address appears in the documented local registry. This is not a safety guarantee.'
      : 'Not in the local registry. Unknown does not mean malicious.',
  };
}
