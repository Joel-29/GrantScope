import type { Address } from 'viem';
import type { ReadChainId } from '../anon-rpc/transportRegistry';
import type { allowanceSize } from './amounts';

export type AllowanceStage =
  | 'initializing'
  | 'checking-network'
  | 'pinning-block'
  | 'reading-token'
  | 'checking-snapshot';

export type TokenSpenderPair = {
  token: Address;
  spender: Address;
  source: 'known-pair' | 'manual' | 'event';
  observedAt?: bigint;
};
export type Erc20Permission = {
  id: string;
  kind: 'erc20';
  chainId: ReadChainId;
  owner: Address;
  token: Address;
  spender: Address;
  symbol: string;
  name: string;
  decimals: number;
  balance: bigint;
  amount: bigint;
  size: ReturnType<typeof allowanceSize>;
  blockNumber: bigint;
  readAt: number;
  knownSpender: boolean;
  spenderName: string;
  source: TokenSpenderPair['source'];
  warnings: string[];
  observedAt?: bigint;
};
export type ReadFailure = { pair: TokenSpenderPair; reason: string };
export type AllowanceScan = {
  rows: Erc20Permission[];
  failures: ReadFailure[];
  blockNumber: bigint;
  chainId: ReadChainId;
  owner: Address;
  attempted: number;
  readAt: number;
  coverage: string;
};
