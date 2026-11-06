import type { QueryClient } from '@tanstack/react-query';
import { useInspectionSession } from './session';
import { usePairStore } from '../erc20/pairStore';
import { anonRpc } from '../anon-rpc/runtime';
import { clearPermissionRoutes } from '../exposure/permissionRoutes';
const namespaces = new Set([
  'account',
  'allowances',
  'discovery',
  'permit2',
  'local-demo',
]);
export function clearInspection(client: QueryClient) {
  clearPermissionRoutes();
  useInspectionSession.getState().clear();
  const predicate = (query: { queryKey: readonly unknown[] }) =>
    namespaces.has(String(query.queryKey[0]));
  void client.cancelQueries({ predicate }).catch(() => {});
  client.removeQueries({ predicate });
  usePairStore.setState({ extra: {} });
  anonRpc.close();
}
