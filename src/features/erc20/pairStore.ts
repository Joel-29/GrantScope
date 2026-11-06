import { create } from 'zustand';
import type { ReadChainId } from '../anon-rpc/transportRegistry';
import type { TokenSpenderPair } from './types';

export const usePairStore = create<{
  extra: Partial<Record<ReadChainId, TokenSpenderPair[]>>;
  add: (chain: ReadChainId, pairs: TokenSpenderPair[]) => void;
}>((set) => ({
  extra: {},
  add: (chain, pairs) =>
    set((state) => ({
      extra: {
        ...state.extra,
        [chain]: [
          ...new Map(
            [...(state.extra[chain] ?? []), ...pairs].map((pair) => [
              `${pair.token}:${pair.spender}`,
              pair,
            ]),
          ).values(),
        ].slice(-500),
      },
    })),
}));
