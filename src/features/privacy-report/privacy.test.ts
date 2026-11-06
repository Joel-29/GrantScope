import { describe, expect, it, vi } from 'vitest';
import { TrafficLedger, routingPercentage, retainedMedian } from './ledger';
import { sanitizedReport } from './export';
import type { RequestMetric } from '../anon-rpc/types';
import { AnonRpcManager } from '../anon-rpc/AnonRpcManager';
import { walletRequest } from '../wallet/requests';
import { anonRpc } from '../anon-rpc/runtime';

function metric(patch: Partial<RequestMetric> = {}): RequestMetric {
  return {
    id: 1,
    timestamp: '2026-11-06T00:00:00.000Z',
    method: 'eth_blockNumber',
    chainId: 11155111,
    category: 'read',
    requestedTransport: 'nym',
    actualTransport: 'nym',
    outcome: 'successful',
    durationMs: 10,
    anonymized: true,
    directException: false,
    reason: null,
    ...patch,
  };
}
describe('measured privacy accounting', () => {
  it('keeps failed and cancelled reads in the denominator and excludes bootstrap/wallet calls', () => {
    const ledger = new TrafficLedger();
    ledger.record(metric());
    ledger.record(metric({ outcome: 'failed', anonymized: false }));
    ledger.record(
      metric({
        outcome: 'cancelled',
        actualTransport: 'none',
        anonymized: false,
      }),
    );
    ledger.record(
      metric({
        category: 'bootstrap',
        actualTransport: 'direct-bootstrap',
        anonymized: false,
        directException: true,
      }),
    );
    ledger.record(
      metric({
        category: 'wallet',
        method: 'eth_sendTransaction',
        actualTransport: 'wallet-provider',
        requestedTransport: 'wallet',
        anonymized: false,
      }),
    );
    expect(routingPercentage(ledger.totals)).toBe('33.3%');
    expect(ledger.totals.read.completed).toBe(3);
    expect(ledger.totals.walletSubmissions).toBe(1);
    expect(ledger.totals.bootstrap.completed).toBe(1);
  });
  it('retains full-session counters beyond the bounded ledger window and computes median only for successful reads', () => {
    const ledger = new TrafficLedger();
    for (let i = 0; i < 1100; i++)
      ledger.record(metric({ id: i, durationMs: i }));
    expect(ledger.rows).toHaveLength(1000);
    expect(ledger.totals.read.completed).toBe(1100);
    expect(routingPercentage(ledger.totals)).toBe('100.0%');
    expect(
      retainedMedian([
        metric({ durationMs: 2 }),
        metric({ durationMs: 4 }),
        metric({ durationMs: 99, outcome: 'failed', anonymized: false }),
      ]),
    ).toBe(3);
    expect(routingPercentage(new TrafficLedger().totals)).toBeNull();
  });
  it('exports explicit fields without request payloads credentials raw errors or accidental added fields', () => {
    const ledger = new TrafficLedger();
    const secret = 'PRIVATE_QUERY_SENTINEL';
    const row = { ...metric(), params: [secret], error: secret };
    ledger.record(row);
    const totals = {
      ...ledger.totals,
      secret,
      read: { ...ledger.totals.read, secret },
    };
    const report = sanitizedReport({
      transport: 'nym',
      phase: 'failed',
      verifiedHash: secret,
      error: secret,
      metrics: ledger.rows,
      successfulWorkerReads: 0,
      totals,
    });
    expect(JSON.stringify(report)).not.toContain(secret);
    expect(report.worker.harnessReady).toBe(false);
    expect(report.requests[0]?.actualTransport).toBe('nym');
  });
  it('records failed-worker reads without inventing an anonymous success or direct fallback', async () => {
    const ledger = new TrafficLedger(),
      direct = vi.fn();
    const manager = new AnonRpcManager(
      () => ({
        ready: Promise.reject(new Error('unavailable')),
        close: vi.fn(),
        fetch: vi.fn(),
      }),
      direct,
      100,
      100,
      'nym',
      undefined,
      (row) => ledger.record(row),
    );
    await expect(manager.initialize()).rejects.toThrow();
    await expect(
      manager.request(11155111, 'eth_blockNumber'),
    ).rejects.toThrow();
    expect(ledger.totals.read.failed).toBe(1);
    expect(ledger.totals.read.anonymized).toBe(0);
    expect(ledger.rows[0]?.actualTransport).toBe('none');
    expect(direct).not.toHaveBeenCalled();
    manager.close();
  });
  it('instrumented wallet calls cannot become an ordinary-RPC read fallback and user rejection stays separate', async () => {
    const request = vi.fn().mockRejectedValue({ code: 4001 });
    await expect(
      walletRequest({ request }, { method: 'eth_requestAccounts' }),
    ).rejects.toMatchObject({ code: 4001 });
    const row = anonRpc.getSnapshot().metrics.at(-1);
    expect(row).toMatchObject({
      category: 'wallet',
      outcome: 'cancelled',
      anonymized: false,
      actualTransport: 'wallet-provider',
    });
    await expect(
      walletRequest(
        { request },
        { method: 'eth_getBalance' as 'eth_accounts' },
      ),
    ).rejects.toThrow('refuses');
    expect(request).toHaveBeenCalledTimes(1);
  });
});
