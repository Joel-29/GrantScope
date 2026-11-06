import { useSyncExternalStore } from 'react';
import { AnonRpcWorker } from '@anon-rpc/browser-harness';
import { AnonRpcManager } from './AnonRpcManager';
import { validKpsGateway, type AnonymousTransport } from './transportRegistry';
import type { RequestMetric } from './types';
import { TrafficLedger } from '../privacy-report/ledger';

const factory = (init: ConstructorParameters<typeof AnonRpcWorker>[0]) =>
  new AnonRpcWorker(init);
const listeners = new Set<() => void>();
const ledger = new TrafficLedger();
const record = (metric: RequestMetric) => {
  ledger.record(metric);
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
let snapshot = {
  ...active.getSnapshot(),
  metrics: ledger.rows,
  totals: ledger.totals,
};
const notify = () => {
  snapshot = {
    ...active.getSnapshot(),
    metrics: ledger.rows,
    totals: ledger.totals,
  };
  listeners.forEach((listener) => listener());
};
let unsubscribe = active.subscribe(notify);
export const anonRpc = {
  recordWallet: record,
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
