import { useQuery } from '@tanstack/react-query';
import { anonRpc, useAnonRpc } from '../anon-rpc/runtime';
import { useInspectionSession } from './session';
import { inspectAccount } from './inspection';

export function useInspection() {
  const { target, revision } = useInspectionSession();
  const transport = useAnonRpc();
  const manager = anonRpc.current();
  return useQuery({
    queryKey: [
      'account',
      target?.chainId,
      target?.address,
      transport.transport,
      manager.sessionId,
      revision,
    ],
    enabled: target !== null,
    queryFn: ({ signal }) => {
      if (!target) throw new Error('No account selected');
      return inspectAccount(manager, target.address, target.chainId, signal);
    },
    retry: false,
    refetchOnMount: false,
    staleTime: 20_000,
  });
}
