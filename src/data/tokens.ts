import { getAddress, type Address } from 'viem';
import type { ReadChainId } from '../features/anon-rpc/transportRegistry';

export type TokenMetadata = {
  address: Address;
  symbol: string;
  name: string;
  decimals: number;
  source: string;
};
const circle =
  'https://developers.circle.com/stablecoins/usdc-contract-addresses';
const uniswap =
  'https://developers.uniswap.org/docs/protocols/v3/deployments/v3-ethereum-deployments';
export const tokens: Record<ReadChainId, readonly TokenMetadata[]> = {
  1: [
    {
      address: getAddress('0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'),
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
      source: circle,
    },
    {
      address: getAddress('0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'),
      symbol: 'WETH',
      name: 'Wrapped Ether',
      decimals: 18,
      source: uniswap,
    },
  ],
  11155111: [
    {
      address: getAddress('0x1c7d4b196cb0c7b01d743fbc6116a902379c7238'),
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
      source: circle,
    },
    {
      address: getAddress('0xfff9976782d46cc05630d1f6ebab18b2324d6b14'),
      symbol: 'WETH',
      name: 'Wrapped Ether',
      decimals: 18,
      source: uniswap,
    },
  ],
};
