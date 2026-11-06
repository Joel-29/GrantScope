import { describe, expect, it, vi } from 'vitest';
import { bootstrapRetry, workerStatus } from './recovery';
import { AnonRpcManager } from './AnonRpcManager';
import { anonRpc } from './runtime';
import { toFunctionSelector } from 'viem';
import type { WorkerFactory, WorkerHandle } from './types';

describe('bounded recovery and route accounting (mocked)', () => {
  it('retries a transient bootstrap failure only once and does not retry invalid data', async () => {
    const operation = vi
      .fn()
      .mockRejectedValue(new TypeError('Failed to fetch'));
    await expect(
      bootstrapRetry(operation, new AbortController().signal, 0),
    ).rejects.toThrow('Failed to fetch');
    expect(operation).toHaveBeenCalledTimes(2);
    const invalid = vi.fn().mockRejectedValue(new Error('Invalid worker hash'));
    await expect(
      bootstrapRetry(invalid, new AbortController().signal, 0),
    ).rejects.toThrow('Invalid worker hash');
    expect(invalid).toHaveBeenCalledOnce();
  });
  it('cancels bootstrap backoff before a second dispatch', async () => {
    vi.useFakeTimers();
    try {
      const controller = new AbortController();
      const operation = vi
        .fn()
        .mockRejectedValue(new TypeError('Failed to fetch'));
      const pending = bootstrapRetry(operation, controller.signal).catch(
        (error: unknown) => error,
      );
      await vi.advanceTimersByTimeAsync(0);
      controller.abort();
      expect(await pending).toMatchObject({ name: 'AbortError' });
      await vi.advanceTimersByTimeAsync(400);
      expect(operation).toHaveBeenCalledOnce();
    } finally {
      vi.useRealTimers();
    }
  });
  it('counts each bounded bootstrap attempt and never uses direct RPC to recover a failed worker read', async () => {
    const direct = vi.fn<typeof fetch>(async (_url, init) => {
      const { id } = JSON.parse(String(init?.body)) as { id: number };
      return new Response(
        JSON.stringify({ jsonrpc: '2.0', id, result: `0x${'11'.repeat(32)}` }),
      );
    });
    direct.mockRejectedValueOnce(new TypeError('Failed to fetch'));
    const handle: WorkerHandle = {
      ready: Promise.resolve(),
      close: vi.fn(),
      fetch: vi.fn(async (_url, init) => {
        const { id } = JSON.parse(String(init?.body)) as { id: number };
        return new Response(
          JSON.stringify({ jsonrpc: '2.0', id, result: '0x2a' }),
        );
      }),
    };
    const factory: WorkerFactory = (init) => {
      handle.ready = init
        .preExisting!.rpcProvider!.request({
          method: 'eth_call',
          params: [
            { to: init.address, data: toFunctionSelector('workerHash()') },
            'latest',
          ],
        })
        .then(() => undefined);
      return handle;
    };
    const manager = new AnonRpcManager(factory, direct, 1000, 1000, 'nox');
    await manager.initialize();
    await manager.request(11155111, 'eth_blockNumber');
    expect(direct.mock.calls[0]?.[0]).toBe(
      'https://ethereum-sepolia-rpc.publicnode.com',
    );
    expect(vi.mocked(handle.fetch).mock.calls[0]?.[0]).toBe(
      'https://ethereum-sepolia-rpc.publicnode.com',
    );
    expect(direct).toHaveBeenCalledTimes(2);
    expect(
      manager
        .getSnapshot()
        .metrics.filter((m) => m.category === 'bootstrap')
        .map((m) => m.outcome),
    ).toEqual(['failed', 'successful']);
    expect(manager.getSnapshot().readState).toBe('successful');
    vi.mocked(handle.fetch).mockRejectedValueOnce(
      new Error('TunnelTimeoutError'),
    );
    await expect(manager.request(11155111, 'eth_blockNumber')).rejects.toThrow(
      'TunnelTimeoutError',
    );
    expect(manager.getSnapshot().phase).toBe('ready');
    expect(manager.getSnapshot().successfulWorkerReads).toBe(1);
    expect(workerStatus(manager.getSnapshot())).toBe('Read failed');
    expect(direct).toHaveBeenCalledTimes(2);
    await manager.request(11155111, 'eth_blockNumber');
    expect(workerStatus(manager.getSnapshot())).toBe('Responding');
    manager.close();
    expect(manager.getSnapshot().readState).toBe('unproven');
  });
  it('isolates sessions on explicit transport changes without initializing a replacement automatically', () => {
    const before = anonRpc.current().sessionId;
    try {
      anonRpc.selectTransport('nox');
      expect(anonRpc.current().sessionId).not.toBe(before);
      expect(anonRpc.getSnapshot().phase).toBe('idle');
      expect(anonRpc.current().transport).toBe('nox');
    } finally {
      anonRpc.selectTransport('nym');
    }
  });
});
