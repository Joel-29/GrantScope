import { create } from 'zustand';
import type { Hex } from 'viem';
import type { ReadChainId } from '../anon-rpc/transportRegistry';
import type { RevocationPhase } from './engine';
import type { Permission } from '../exposure/analysis';
export type Activity = {
  id: string;
  recordId: string;
  chainId: ReadChainId;
  phase: RevocationPhase | 'failed' | 'rejected' | 'unverified' | 'reverted';
  hash?: Hex;
  verifiedBlock?: bigint;
  verifiedAt?: number;
  message?: string;
};
// Verification is historical evidence, not a permanent assertion about an allowance.
export function supersedingVerification(
  record: Permission,
  activity: readonly Activity[],
  includeDependency = false,
) {
  return activity.find(
    (entry) =>
      entry.chainId === record.chainId &&
      (entry.recordId === record.id ||
        (includeDependency &&
          record.kind === 'permit2' &&
          entry.recordId === record.underlying.id)) &&
      entry.phase === 'verified-zero' &&
      entry.verifiedBlock !== undefined &&
      entry.verifiedAt !== undefined &&
      entry.verifiedAt >= record.readAt,
  );
}
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
