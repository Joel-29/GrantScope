import { useMemo, useSyncExternalStore } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useInspectionSession } from '../wallet/session';
import { anonRpc, useAnonRpc } from '../anon-rpc/runtime';
import type { AllowanceScan, Erc20Permission } from '../erc20/types';
import type { Permit2Grant } from '../permit2/engine';
import type { Permission } from './analysis';

export function usePermissionData() {
  const client = useQueryClient(),
    { target, revision } = useInspectionSession(),
    transport = useAnonRpc(),
    manager = anonRpc.current();
  const cache = client.getQueryCache();
  const store = useMemo(() => {
    let version = 0;
    return {
      get: () => version,
      subscribe: (listener: () => void) =>
        cache.subscribe((event) => {
          if (event.type === 'updated') {
            version++;
            listener();
          }
        }),
    };
  }, [cache]);
  useSyncExternalStore(store.subscribe, store.get, store.get);
  const records = new Map<string, Permission>();
  let failures = 0,
    scans = 0;
  const coverages: string[] = [];
  function put(row: Permission) {
    const previous = records.get(row.id);
    if (
      !previous ||
      row.blockNumber > previous.blockNumber ||
      (row.blockNumber === previous.blockNumber && row.readAt > previous.readAt)
    )
      records.set(row.id, row);
  }
  for (const query of cache.getAll()) {
    const key = query.queryKey;
    if (
      !target ||
      !['allowances', 'discovery', 'permit2'].includes(String(key[0])) ||
      key[1] !== target.chainId ||
      key[2] !== target.address ||
      key[3] !== transport.transport ||
      key[4] !== manager.sessionId ||
      key[5] !== revision ||
      query.state.data === undefined
    )
      continue;
    // Only this application's typed query functions write these cache namespaces.
    scans++;
    if (key[0] === 'permit2') {
      const data = query.state.data as {
        verification: {
          rows: Permit2Grant[];
          failures: unknown[];
          coverage: string;
        };
      };
      data.verification.rows.forEach((row) => {
        put(row);
        put(row.underlying);
      });
      failures += data.verification.failures.length;
      coverages.push(data.verification.coverage);
    } else {
      const data =
        key[0] === 'allowances'
          ? (query.state.data as AllowanceScan)
          : (query.state.data as { verification: AllowanceScan }).verification;
      data.rows.forEach((row: Erc20Permission) => put(row));
      failures += data.failures.length;
      coverages.push(data.coverage);
    }
  }
  return { records: [...records.values()], failures, scans, coverages, target };
}
