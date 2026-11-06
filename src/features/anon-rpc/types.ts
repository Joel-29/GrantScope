import type {
  AnonFetch,
  LogEntry,
  WorkerInit,
} from '@anon-rpc/browser-harness';
import type { AnonymousTransport } from './transportRegistry';

export type WorkerHandle = {
  ready: Promise<void>;
  fetch: AnonFetch;
  close(): void;
  acceptLog?(options?: { signal?: AbortSignal }): Promise<LogEntry>;
};
export type WorkerFactory = (init: WorkerInit) => WorkerHandle;
export type WorkerPhase =
  'idle' | 'initializing' | 'ready' | 'failed' | 'closed' | 'unavailable';
export type RequestMetric = {
  id: number;
  timestamp: string;
  method: string;
  chainId: number;
  category: 'read' | 'bootstrap' | 'wallet';
  requestedTransport: AnonymousTransport | 'wallet';
  actualTransport:
    AnonymousTransport | 'direct-bootstrap' | 'wallet-provider' | 'none';
  outcome: 'successful' | 'failed' | 'cancelled';
  durationMs: number;
  anonymized: boolean;
  directException: boolean;
  reason: string | null;
};
export type TransportSnapshot = {
  transport: AnonymousTransport;
  bootstrapStatus?: string;
  phase: WorkerPhase;
  verifiedHash: string | null;
  error: string | null;
  metrics: readonly RequestMetric[];
  successfulWorkerReads: number;
  readState?: 'unproven' | 'successful' | 'failed';
};
