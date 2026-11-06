import type { TransportSnapshot } from '../anon-rpc/types';
import { routingPercentage, type TrafficTotals, type Counters } from './ledger';

const counts = (value: Counters) => ({
  completed: value.completed,
  successful: value.successful,
  failed: value.failed,
  cancelled: value.cancelled,
  anonymized: value.anonymized,
  successfulDurationMs: value.successfulDurationMs,
});
function safeTotals(value: TrafficTotals) {
  const routes: Partial<TrafficTotals['routes']> = {};
  for (const route of [
    'nym',
    'nox',
    'tor-js',
    'none',
    'direct-bootstrap',
    'wallet-provider',
  ] as const) {
    const count = value.routes[route];
    if (count) routes[route] = counts(count);
  }
  return {
    read: counts(value.read),
    bootstrap: counts(value.bootstrap),
    wallet: counts(value.wallet),
    walletSubmissions: value.walletSubmissions,
    routes,
  };
}

export function sanitizedReport(
  snapshot: TransportSnapshot & { totals: TrafficTotals },
) {
  // Explicit field selection: never spread worker state, request objects or errors.
  return {
    schema: 'grantscope-traffic-v1',
    exportedAt: new Date().toISOString(),
    worker: {
      transport: snapshot.transport,
      state: snapshot.phase,
      harnessReady: snapshot.phase === 'ready',
      successfulResponses: snapshot.successfulWorkerReads,
    },
    accounting: {
      denominator:
        'Completed application read attempts; includes failed and cancelled reads. Bootstrap and wallet activity excluded.',
      anonymousReadShare: routingPercentage(snapshot.totals),
      totals: safeTotals(snapshot.totals),
      retainedRecords: snapshot.metrics.length,
      recordLimit: 1000,
    },
    requests: snapshot.metrics.map((row) => ({
      timestamp: row.timestamp,
      method: row.method,
      chainId: row.chainId,
      category: row.category,
      requestedTransport: row.requestedTransport,
      actualTransport: row.actualTransport,
      outcome: row.outcome,
      durationMs: row.durationMs,
      anonymized: row.anonymized,
      directException: row.directException,
    })),
    limitations: [
      'RPC providers still see query contents.',
      'Wallet-internal traffic and worker-internal network operations are not fully observable.',
      'Bootstrap specifier reads are direct exceptions.',
      'No wallet addresses, query parameters, gateway credentials, transaction hashes or raw error text are exported.',
    ],
  };
}
export function downloadReport(
  snapshot: Parameters<typeof sanitizedReport>[0],
) {
  const blob = new Blob([JSON.stringify(sanitizedReport(snapshot), null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'grantscope-traffic.json';
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
