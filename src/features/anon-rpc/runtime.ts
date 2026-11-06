import { useSyncExternalStore } from 'react';
import { AnonRpcWorker } from '@anon-rpc/browser-harness';
import { AnonRpcManager } from './AnonRpcManager';
import { validKpsGateway, type AnonymousTransport } from './transportRegistry';
import type { RequestMetric } from './types';

const factory = (init: ConstructorParameters<typeof AnonRpcWorker>[0]) =>
  new AnonRpcWorker(init);
const listeners = new Set<() => void>();
let ledger: RequestMetric[] = [];
const record = (metric: RequestMetric) => {
  ledger = [...ledger.slice(-999), metric];
  notify();
};
const createManager = (
  transport: AnonymousTransport = 'nym',
  gateway?: string,
) =>
  new AnonRpcManager(
    factory,
    undefined,
    120_000,
    60_000,
    transport,
    gateway,
    record,
  );
let active = createManager();
let snapshot = active.getSnapshot();
const notify = () => {
  snapshot = { ...active.getSnapshot(), metrics: ledger };
  listeners.forEach((listener) => listener());
};
let unsubscribe = active.subscribe(notify);
export const anonRpc = {
  current: () => active,
  getSnapshot: () => snapshot,
  subscribe: (listener: () => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  initialize: () => active.initialize(),
  request: (...args: Parameters<AnonRpcManager['request']>) =>
    active.request(...args),
  close: () => active.close(),
  selectTransport(transport: AnonymousTransport, gateway?: string) {
    if (transport === 'tor-js' && gateway && !validKpsGateway(gateway))
      throw new Error('Invalid authenticated KPS address');
    active.close();
    unsubscribe();
    active = createManager(transport, gateway);
    unsubscribe = active.subscribe(notify);
    notify();
  },
};
export function useAnonRpc() {
  return useSyncExternalStore(
    anonRpc.subscribe,
    anonRpc.getSnapshot,
    anonRpc.getSnapshot,
  );
}
