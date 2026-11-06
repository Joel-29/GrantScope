import { toFunctionSelector } from 'viem';
import { decodeRpc } from './JsonRpcAdapter';
import { abortable } from '../../lib/abortable';
import {
  READ_NETWORKS,
  WORKERS,
  NOX_CONFIG,
  validKpsGateway,
  type AnonymousTransport,
  type ReadChainId,
} from './transportRegistry';
import type {
  RequestMetric,
  TransportSnapshot,
  WorkerFactory,
  WorkerHandle,
} from './types';

const selectors = new Set<string>([
  toFunctionSelector('workerHash()'),
  toFunctionSelector('workerResolvers()'),
]);
const readMethods = new Set([
  'eth_chainId',
  'eth_blockNumber',
  'eth_getBalance',
  'eth_getTransactionCount',
  'eth_getCode',
  'eth_call',
  'eth_getLogs',
  'eth_getBlockByNumber',
  'eth_getTransactionReceipt',
  'eth_getTransactionByHash',
  'eth_estimateGas',
  'eth_gasPrice',
  'eth_feeHistory',
  'eth_maxPriorityFeePerGas',
]);

export class AnonRpcManager {
  private static metricSequence = 0;
  private worker: WorkerHandle | undefined;
  private initialization: Promise<void> | undefined;
  private controller = new AbortController();
  private listeners = new Set<() => void>();
  private sequence = 0;
  private generation = 0;
  private readonly isolationKey = crypto.randomUUID();
  get sessionId() {
    return this.isolationKey;
  }
  private snapshot: TransportSnapshot = {
    transport: 'nym',
    phase: 'idle',
    verifiedHash: null,
    error: null,
    metrics: [],
    successfulWorkerReads: 0,
  };
  constructor(
    private readonly factory: WorkerFactory,
    private readonly bootstrapFetch: typeof fetch = (...args) =>
      globalThis.fetch(...args),
    private readonly initTimeoutMs = 120_000,
    private readonly requestTimeoutMs = 60_000,
    public readonly transport: AnonymousTransport = 'nym',
    private readonly gateway?: string,
    private readonly onMetric?: (metric: RequestMetric) => void,
  ) {
    this.snapshot = { ...this.snapshot, transport };
    if (transport === 'tor-js' && (!gateway || !validKpsGateway(gateway)))
      this.snapshot = {
        ...this.snapshot,
        phase: 'unavailable',
        error:
          'Tor requires an operational authenticated KPS gateway. The demonstration gateway is unavailable.',
      };
  }
  getSnapshot = () => this.snapshot;
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
  private update(patch: Partial<TransportSnapshot>) {
    this.snapshot = { ...this.snapshot, ...patch };
    this.listeners.forEach((listener) => listener());
  }
  private record(metric: RequestMetric) {
    this.update({ metrics: [...this.snapshot.metrics.slice(-999), metric] });
    this.onMetric?.(metric);
  }
  private async measured<T>(
    method: string,
    chainId: number,
    category: 'read' | 'bootstrap',
    operation: (
      dispatched: (route: RequestMetric['actualTransport']) => void,
    ) => Promise<T>,
  ): Promise<T> {
    const id = ++AnonRpcManager.metricSequence,
      start = performance.now(),
      timestamp = new Date().toISOString();
    let outcome: RequestMetric['outcome'] = 'failed';
    const route: { actualTransport: RequestMetric['actualTransport'] } = {
      actualTransport: 'none',
    };
    try {
      const result = await operation((actualTransport) => {
        route.actualTransport = actualTransport;
      });
      outcome = 'successful';
      return result;
    } catch (error) {
      if (
        error &&
        typeof error === 'object' &&
        'name' in error &&
        error.name === 'AbortError'
      )
        outcome = 'cancelled';
      throw error;
    } finally {
      this.record({
        id,
        timestamp,
        method,
        chainId,
        category,
        requestedTransport: this.transport,
        actualTransport: route.actualTransport,
        outcome,
        durationMs: Math.round(performance.now() - start),
        anonymized:
          category === 'read' &&
          route.actualTransport === this.transport &&
          outcome === 'successful',
        directException: category === 'bootstrap',
        reason:
          category === 'bootstrap'
            ? 'Official worker specifier bootstrap; no wallet query'
            : null,
      });
    }
  }
  private bootstrap = async (
    {
      method,
      params,
    }: {
      method: string;
      params?: unknown[];
    },
    signal: AbortSignal,
  ): Promise<unknown> => {
    signal.throwIfAborted();
    const call = params?.[0];
    if (
      method !== 'eth_call' ||
      !call ||
      typeof call !== 'object' ||
      !('to' in call) ||
      String(call.to).toLowerCase() !==
        WORKERS[this.transport].specifier.toLowerCase() ||
      !('data' in call) ||
      !selectors.has(String(call.data)) ||
      params?.length !== 2 ||
      params[1] !== 'latest' ||
      Object.keys(call).some((key) => !['to', 'data'].includes(key))
    )
      throw new Error('Bootstrap provider refuses non-specifier requests');
    return this.measured(
      method,
      WORKERS[this.transport].bootstrapChainId,
      'bootstrap',
      async (dispatched) => {
        const id = ++this.sequence;
        const body = JSON.stringify({ jsonrpc: '2.0', id, method, params });
        dispatched('direct-bootstrap');
        const response = await this.bootstrapFetch(
          READ_NETWORKS[WORKERS[this.transport].bootstrapChainId].rpc,
          {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body,
            signal: AbortSignal.any([signal, AbortSignal.timeout(20_000)]),
            credentials: 'omit',
            referrerPolicy: 'no-referrer',
          },
        );
        const result = await decodeRpc(response, id);
        signal.throwIfAborted();
        if (typeof result !== 'string' || !/^0x(?:[0-9a-f]{2})+$/i.test(result))
          throw new Error('Invalid worker specifier result');
        if (call.data === toFunctionSelector('workerHash()')) {
          if (!/^0x[0-9a-f]{64}$/i.test(result) || /^0x0+$/.test(result))
            throw new Error('Invalid worker hash');
          this.update({ verifiedHash: result }); // Bootstrap-reported identity; verified only once ready resolves.
        }
        return result;
      },
    );
  };
  initialize(): Promise<void> {
    if (
      this.transport === 'tor-js' &&
      (!this.gateway || !validKpsGateway(this.gateway))
    ) {
      this.update({
        phase: 'unavailable',
        error:
          'Tor requires an operational authenticated KPS gateway. No gateway is configured.',
      });
      return Promise.reject(
        new Error(this.snapshot.error ?? 'Transport unavailable'),
      );
    }
    if (this.snapshot.phase === 'ready') return Promise.resolve();
    if (this.initialization) return this.initialization;
    this.controller = new AbortController();
    const controller = this.controller;
    const generation = ++this.generation;
    this.update({
      phase: 'initializing',
      verifiedHash: null,
      error: null,
      successfulWorkerReads: 0,
      bootstrapStatus: '',
    });
    const task = (async () => {
      let timer: ReturnType<typeof setTimeout> | undefined;
      let attemptWorker: WorkerHandle | undefined;
      let onAbort: (() => void) | undefined;
      try {
        const worker = this.factory({
          address: WORKERS[this.transport].specifier,
          config:
            this.transport === 'tor-js'
              ? { gateways: [this.gateway!] }
              : this.transport === 'nox'
                ? NOX_CONFIG
                : undefined,
          preExisting: {
            rpcProvider: {
              request: (args) => {
                if (generation !== this.generation)
                  return Promise.reject(
                    new DOMException('Stale worker', 'AbortError'),
                  );
                return this.bootstrap(args, controller.signal);
              },
            },
          },
        });
        this.worker = worker;
        attemptWorker = worker;
        // Claim worker logs immediately; do not persist arbitrary log arguments or RPC payloads.
        if (worker.acceptLog)
          void (async () => {
            try {
              while (!controller.signal.aborted) {
                const entry = await worker.acceptLog!({
                  signal: controller.signal,
                });
                if (
                  generation === this.generation &&
                  this.snapshot.phase === 'initializing'
                ) {
                  const message = entry.args
                    .filter((value) => typeof value === 'string')
                    .join(' ');
                  if (
                    /bootstrap attempt|all gateways|KPS|Waiting for client|gateway.*failed|network-error|timed out|Client ready|Tor ready/i.test(
                      message,
                    )
                  )
                    this.update({
                      bootstrapStatus: message
                        .slice(0, 500)
                        .replace(/https?:\/\/[^\s;)]+/g, '[worker resource]')
                        .replace(/\b(?:\d{1,3}\.){3}\d{1,3}\b/g, '[relay]')
                        .replace(/0x[a-f0-9]{40,}/gi, '[contract/hash]'),
                    });
                }
              }
            } catch {
              if (
                !controller.signal.aborted &&
                generation === this.generation &&
                this.worker === worker
              ) {
                controller.abort();
                worker.close();
                this.worker = undefined;
                this.update({
                  phase: 'failed',
                  error:
                    'Anonymous worker stopped. Explicit reconnection is required; no direct fallback was used.',
                });
              }
            }
          })();
        await Promise.race([
          worker.ready,
          new Promise<never>((_, reject) => {
            timer = setTimeout(
              () =>
                reject(new Error('Anonymous worker initialization timed out')),
              this.initTimeoutMs,
            );
            onAbort = () =>
              reject(new DOMException('Worker closed', 'AbortError'));
            controller.signal.addEventListener('abort', onAbort, {
              once: true,
            });
          }),
        ]);
        if (generation !== this.generation || controller.signal.aborted) {
          worker.close();
          throw new DOMException('Worker closed', 'AbortError');
        }
        this.update({ phase: 'ready' });
      } catch (error) {
        attemptWorker?.close();
        controller.abort();
        if (generation === this.generation) {
          this.worker = undefined;
          this.update({
            phase: 'failed',
            error:
              error instanceof Error && error.message.includes('timed out')
                ? 'Anonymous worker initialization timed out. No direct fallback was used.'
                : `Anonymous worker initialization failed: ${
                    error instanceof Error
                      ? error.message
                          .slice(0, 600)
                          .replace(/https?:\/\/[^\s;)]+/g, '[worker resource]')
                          .replace(/0x[a-f0-9]{40,}/gi, '[contract/hash]')
                      : 'unknown worker error'
                  }. No direct fallback was used.`,
          });
        }
        throw error;
      } finally {
        if (timer) clearTimeout(timer);
        if (onAbort) controller.signal.removeEventListener('abort', onAbort);
      }
    })();
    this.initialization = task;
    void task
      .finally(() => {
        if (this.initialization === task) this.initialization = undefined;
      })
      .catch(() => {});
    return task;
  }
  request(
    chainId: ReadChainId,
    method: string,
    params: readonly unknown[] = [],
    signal?: AbortSignal,
  ): Promise<unknown> {
    if (!Object.hasOwn(READ_NETWORKS, chainId))
      return Promise.reject(new Error('Unsupported read chain'));
    if (this.transport === 'nox' && chainId !== 11155111)
      return Promise.reject(new Error('Nox is verified for Sepolia only'));
    if (!readMethods.has(method))
      return Promise.reject(new Error('Unsupported read-only RPC method'));
    return this.measured(method, chainId, 'read', async (dispatched) => {
      if (this.snapshot.phase !== 'ready' || !this.worker)
        throw new Error('Anonymous transport is not ready; no direct fallback');
      const worker = this.worker;
      const id = ++this.sequence;
      const requestSignal = AbortSignal.any([
        this.controller.signal,
        AbortSignal.timeout(this.requestTimeoutMs),
        ...(signal ? [signal] : []),
      ]);
      const result = await abortable(async () => {
        const body = JSON.stringify({ jsonrpc: '2.0', id, method, params });
        dispatched(this.transport);
        const response = await worker.fetch(READ_NETWORKS[chainId].rpc, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body,
          signal: requestSignal,
          ...(this.transport === 'tor-js'
            ? { anonOptions: { isolationKey: this.isolationKey } }
            : {}),
        });
        return decodeRpc(response, id, requestSignal);
      }, requestSignal);
      requestSignal.throwIfAborted();
      if (worker !== this.worker || this.snapshot.phase !== 'ready')
        throw new DOMException('Worker session changed', 'AbortError');
      this.update({
        successfulWorkerReads: this.snapshot.successfulWorkerReads + 1,
      });
      return result;
    });
  }
  close = () => {
    this.generation++;
    this.controller.abort();
    this.worker?.close();
    this.worker = undefined;
    this.initialization = undefined;
    this.update({ phase: 'closed', successfulWorkerReads: 0 });
  };
}
