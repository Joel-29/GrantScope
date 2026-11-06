import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useInspectionSession } from '../wallet/session';
import { anonRpc, useAnonRpc } from '../anon-rpc/runtime';
import { knownPairs, scanAllowances } from './engine';
import { usePairStore } from './pairStore';

export function useAllowanceScan() {
  const { target, revision } = useInspectionSession();
  const transport = useAnonRpc();
  const manager = anonRpc.current();
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const extra = usePairStore((state) => state.extra);
  const pairs = target
    ? [...knownPairs(target.chainId), ...(extra[target.chainId] ?? [])]
    : [];
  const query = useQuery({
    queryKey: [
      'allowances',
      target?.chainId,
      target?.address,
      transport.transport,
      manager.sessionId,
      revision,
      pairs,
    ],
    enabled: false,
    queryFn: ({ signal }) => {
      if (!target) throw new Error('Inspect an address first');
      return scanAllowances(manager, target.address, target.chainId, pairs, {
        signal,
        onProgress: (done, total) => setProgress({ done, total }),
      });
    },
    retry: false,
    staleTime: 20_000,
  });
  return { ...query, progress, target };
}
