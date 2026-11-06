import { create } from 'zustand';
import type { Hex } from 'viem';
import type { ReadChainId } from '../anon-rpc/transportRegistry';
import type { RevocationPhase } from './engine';
export type Activity = {
  id: string;
  recordId: string;
  chainId: ReadChainId;
  phase: RevocationPhase | 'failed' | 'rejected' | 'unverified';
  hash?: Hex;
  verifiedBlock?: bigint;
  message?: string;
};
export const useTransactions = create<{
  busy: boolean;
  activity: Activity[];
  start: (entry: Activity) => boolean;
  update: (id: string, patch: Partial<Activity>) => void;
  finish: () => void;
}>((set, get) => ({
  busy: false,
  activity: [],
  start: (entry) => {
    if (get().busy) return false;
    set((state) => ({
      busy: true,
      activity: [entry, ...state.activity].slice(0, 30),
    }));
    return true;
  },
  update: (id, patch) =>
    set((state) => ({
      activity: state.activity.map((entry) =>
        entry.id === id ? { ...entry, ...patch } : entry,
      ),
    })),
  finish: () => set({ busy: false }),
}));
