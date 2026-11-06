import type { RequestMetric } from '../anon-rpc/types';

export type Counters = {
  completed: number;
  successful: number;
  failed: number;
  cancelled: number;
  anonymized: number;
  successfulDurationMs: number;
};
export type TrafficTotals = {
  read: Counters;
  bootstrap: Counters;
  wallet: Counters;
  walletSubmissions: number;
  routes: Partial<Record<RequestMetric['actualTransport'], Counters>>;
};
const empty = (): Counters => ({
  completed: 0,
  successful: 0,
  failed: 0,
  cancelled: 0,
  anonymized: 0,
  successfulDurationMs: 0,
});
function add(count: Counters, metric: RequestMetric): Counters {
  return {
    ...count,
    completed: count.completed + 1,
    [metric.outcome]: count[metric.outcome] + 1,
    anonymized: count.anonymized + (metric.anonymized ? 1 : 0),
    successfulDurationMs:
      count.successfulDurationMs +
      (metric.outcome === 'successful' ? metric.durationMs : 0),
  };
}
export class TrafficLedger {
  rows: readonly RequestMetric[] = [];
  totals: TrafficTotals = {
    read: empty(),
    bootstrap: empty(),
    wallet: empty(),
    walletSubmissions: 0,
    routes: {},
  };
  record(metric: RequestMetric) {
    this.rows = [...this.rows.slice(-999), metric];
    this.totals = {
      ...this.totals,
      [metric.category]: add(this.totals[metric.category], metric),
      walletSubmissions:
        this.totals.walletSubmissions +
        (metric.category === 'wallet' && metric.method === 'eth_sendTransaction'
          ? 1
          : 0),
      routes: {
        ...this.totals.routes,
        [metric.actualTransport]: add(
          this.totals.routes[metric.actualTransport] ?? empty(),
          metric,
        ),
      },
    };
  }
}
export function routingPercentage(totals: TrafficTotals): string | null {
  return totals.read.completed
    ? `${((totals.read.anonymized / totals.read.completed) * 100).toFixed(1)}%`
    : null;
}
export function retainedMedian(rows: readonly RequestMetric[]): number | null {
  const values = rows
    .filter((row) => row.category === 'read' && row.outcome === 'successful')
    .map((row) => row.durationMs)
    .sort((a, b) => a - b);
  if (!values.length) return null;
  const middle = Math.floor(values.length / 2);
  return values.length % 2
    ? values[middle]!
    : ((values[middle - 1] ?? 0) + (values[middle] ?? 0)) / 2;
}
