import { create } from 'zustand';
import type { Address } from 'viem';
import type { ReadChainId } from '../anon-rpc/transportRegistry';
import { parseAddress } from './address';

export type InspectionTarget = { address: Address; chainId: ReadChainId };
type State = {
  target: InspectionTarget | null;
  revision: number;
  history: InspectionTarget[];
  inspect(input: string, chainId: ReadChainId): void;
  clear(): void;
};
export const useInspectionSession = create<State>((set) => ({
  target: null,
  revision: 0,
  history: [],
  inspect: (input, chainId) => {
    const address = parseAddress(input);
    set((state) => ({
      target: { address, chainId },
      revision: state.revision + 1,
      history: [
        { address, chainId },
        ...state.history.filter(
          (item) => item.chainId !== chainId || item.address !== address,
        ),
      ].slice(0, 8),
    }));
  },
  clear: () =>
    set((state) => ({
      target: null,
      history: [],
      revision: state.revision + 1,
    })),
}));
