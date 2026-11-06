import { describe, expect, it, vi } from 'vitest';
import { createPublicClient, toFunctionSelector } from 'viem';
import { sepolia } from 'viem/chains';
import { AnonRpcManager } from './AnonRpcManager';
import {
  anonymousViemTransport,
  decodeRpc,
  rpcQuantity,
} from './JsonRpcAdapter';
import type { WorkerFactory, WorkerHandle } from './types';

function worker() {
  return {
    ready: Promise.resolve(),
    close: vi.fn(),
    fetch: vi.fn(async (_url, init) => {
      const body = JSON.parse(String(init?.body)) as {
        id: number;
        method: string;
      };
      return new Response(
        JSON.stringify({
          jsonrpc: '2.0',
          id: body.id,
          result: body.method === 'eth_chainId' ? '0xaa36a7' : '0x2a',
        }),
      );
    }),
  } satisfies WorkerHandle;
}

describe('anonymous transport (mock responses are not live evidence)', () => {
  it('times out initialization without attempting a direct query', async () => {
    vi.useFakeTimers();
    try {
      const handle = worker();
      handle.ready = new Promise(() => {});
      const direct = vi.fn();
      const manager = new AnonRpcManager(() => handle, direct, 10);
      const result = manager.initialize().catch((error) => error);
      await vi.advanceTimersByTimeAsync(11);
      expect(await result).toBeInstanceOf(Error);
      expect(manager.getSnapshot().phase).toBe('failed');
      expect(handle.close).toHaveBeenCalled();
      expect(direct).not.toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });
  it('keeps optional Tor unavailable without an authenticated gateway, including after close', async () => {
    const factory = vi.fn(() => worker());
    const direct = vi.fn();
    const manager = new AnonRpcManager(factory, direct, 100, 100, 'tor-js');
    expect(manager.getSnapshot().phase).toBe('unavailable');
    manager.close();
    await expect(manager.initialize()).rejects.toThrow('gateway');
    expect(factory).not.toHaveBeenCalled();
    expect(direct).not.toHaveBeenCalled();
  });
  it('cancels in-flight requests, preserves actual selected route, and never records payloads', async () => {
    const handle = worker();
    handle.fetch.mockImplementationOnce(
      async (_url, init) =>
        new Promise((_, reject) => {
          init?.signal?.addEventListener(
            'abort',
            () => reject(new DOMException('Aborted', 'AbortError')),
            { once: true },
          );
        }),
    );
    const manager = new AnonRpcManager(() => handle);
    await manager.initialize();
    const controller = new AbortController();
    const pending = manager
      .request(
        11155111,
        'eth_getBalance',
        ['never-retain-this', 'latest'],
        controller.signal,
      )
      .catch((error) => error);
    controller.abort();
    expect(await pending).toBeInstanceOf(DOMException);
    expect(manager.getSnapshot().metrics[0]).toMatchObject({
      actualTransport: 'nym',
      outcome: 'cancelled',
      anonymized: false,
    });
    expect(JSON.stringify(manager.getSnapshot().metrics)).not.toContain(
      'never-retain-this',
    );
    manager.close();
  });
  it('reuses a long-lived worker and supports viem without ordinary fetch', async () => {
    const handle = worker();
    const factory = vi.fn(() => handle);
    const direct = vi.fn();
    const manager = new AnonRpcManager(factory, direct);
    await Promise.all([manager.initialize(), manager.initialize()]);
    const client = createPublicClient({
      chain: sepolia,
      transport: anonymousViemTransport((method, params) =>
        manager.request(11155111, method, params),
      ),
    });
    expect(await client.getBlockNumber()).toBe(42n);
    expect(factory).toHaveBeenCalledTimes(1);
    expect(direct).not.toHaveBeenCalled();
    expect(manager.getSnapshot().metrics[0]).toMatchObject({
      actualTransport: 'nym',
      outcome: 'successful',
      anonymized: true,
    });
    manager.close();
    expect(handle.close).toHaveBeenCalled();
  });
  it('fails closed before initialization and after worker initialization failure', async () => {
    const handle = worker();
    handle.ready = Promise.reject(new Error('hash mismatch'));
    const direct = vi.fn();
    const manager = new AnonRpcManager(() => handle, direct);
    await expect(
      manager.request(11155111, 'eth_getBalance', [
        'private-address',
        'latest',
      ]),
    ).rejects.toThrow('not ready');
    await expect(manager.initialize()).rejects.toThrow('hash mismatch');
    await expect(manager.request(11155111, 'eth_blockNumber')).rejects.toThrow(
      'not ready',
    );
    expect(direct).not.toHaveBeenCalled();
    expect(handle.fetch).not.toHaveBeenCalled();
    expect(manager.getSnapshot().phase).toBe('failed');
    expect(JSON.stringify(manager.getSnapshot())).not.toContain(
      'private-address',
    );
  });
  it('refuses arbitrary bootstrap requests and records only the fixed specifier exception', async () => {
    const direct = vi.fn(async (_url, init) => {
      const { id } = JSON.parse(String(init?.body)) as { id: number };
      return new Response(
        JSON.stringify({ jsonrpc: '2.0', id, result: `0x${'11'.repeat(32)}` }),
      );
    });
    const factory: WorkerFactory = (init) => {
      const handle = worker();
      handle.ready = (async () => {
        const provider = init.preExisting!.rpcProvider!;
        await expect(
          provider.request({
            method: 'eth_getBalance',
            params: ['secret', 'latest'],
          }),
        ).rejects.toThrow('refuses');
        await provider.request({
          method: 'eth_call',
          params: [
            { to: init.address, data: toFunctionSelector('workerHash()') },
            'latest',
          ],
        });
      })();
      return handle;
    };
    const manager = new AnonRpcManager(factory, direct);
    await manager.initialize();
    expect(direct).toHaveBeenCalledTimes(1);
    expect(manager.getSnapshot().metrics).toHaveLength(1);
    expect(manager.getSnapshot().metrics[0]).toMatchObject({
      category: 'bootstrap',
      anonymized: false,
      directException: true,
    });
    manager.close();
  });
  it('does not revive or close a new session when a stale initialization settles', async () => {
    let settle!: () => void;
    const old = worker();
    old.ready = new Promise<void>((resolve) => {
      settle = resolve;
    });
    const fresh = worker();
    const factory = vi.fn().mockReturnValueOnce(old).mockReturnValueOnce(fresh);
    const manager = new AnonRpcManager(factory);
    const first = manager.initialize().catch(() => {});
    manager.close();
    const second = manager.initialize();
    settle();
    await Promise.all([first, second]);
    expect(manager.getSnapshot().phase).toBe('ready');
    expect(fresh.close).not.toHaveBeenCalled();
    manager.close();
  });
  it('records failed anonymous attempts without marking them anonymous or falling back', async () => {
    const handle = worker();
    handle.fetch.mockRejectedValueOnce(new Error('Tor exit refused'));
    const direct = vi.fn();
    const manager = new AnonRpcManager(() => handle, direct);
    await manager.initialize();
    await expect(
      manager.request(11155111, 'eth_blockNumber'),
    ).rejects.toThrow();
    expect(manager.getSnapshot().metrics[0]).toMatchObject({
      outcome: 'failed',
      actualTransport: 'nym',
      anonymized: false,
    });
    expect(direct).not.toHaveBeenCalled();
    manager.close();
  });
  it('rejects malformed envelopes, wrong IDs, provider errors, and noncanonical quantities', async () => {
    for (const body of [
      { result: '0x1' },
      { jsonrpc: '2.0', id: 99, result: '0x1' },
      { jsonrpc: '2.0', id: 1, error: { code: -32000, message: 'secret' } },
    ])
      await expect(
        decodeRpc(new Response(JSON.stringify(body)), 1),
      ).rejects.toThrow();
    expect(rpcQuantity('0x2a')).toBe(42n);
    expect(() => rpcQuantity('0x01')).toThrow();
    expect(() => rpcQuantity('42')).toThrow();
  });
});
