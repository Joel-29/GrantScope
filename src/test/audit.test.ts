import { afterEach, describe, expect, it, vi } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import { abortable } from '../lib/abortable';
import { AnonRpcManager } from '../features/anon-rpc/AnonRpcManager';
import { decodeRpc } from '../features/anon-rpc/JsonRpcAdapter';
import { useWallet } from '../features/wallet/provider';
import { useInspectionSession } from '../features/wallet/session';
import { usePairStore } from '../features/erc20/pairStore';
import { clearInspection } from '../features/wallet/clearInspection';

const first = '0x0000000000000000000000000000000000000001',
  second = '0x0000000000000000000000000000000000000002';
afterEach(() => {
  useWallet.getState().disconnect();
  Reflect.deleteProperty(window, 'ethereum');
});
describe('Module 11 adversarial audit regressions', () => {
  it('does not dispatch an operation cancelled before its microtask starts', async () => {
    const c = new AbortController(),
      operation = vi.fn(async () => 1);
    const promise = abortable(operation, c.signal);
    c.abort();
    await expect(promise).rejects.toMatchObject({ name: 'AbortError' });
    expect(operation).not.toHaveBeenCalled();
  });
  it('enforces deadlines even if an SDK fetch never honors abort', async () => {
    const direct = vi.fn();
    const manager = new AnonRpcManager(
      () => ({
        ready: Promise.resolve(),
        close: vi.fn(),
        fetch: () => new Promise(() => {}),
      }),
      direct,
      100,
      10,
    );
    await manager.initialize();
    await expect(
      manager.request(11155111, 'eth_blockNumber'),
    ).rejects.toMatchObject({ name: 'TimeoutError' });
    expect(manager.getSnapshot().metrics[0]).toMatchObject({
      outcome: 'failed',
      anonymized: false,
    });
    expect(direct).not.toHaveBeenCalled();
    manager.close();
  });
  it('rejects ambiguous fractional-error and oversized RPC bodies without echoing payloads', async () => {
    await expect(
      decodeRpc(
        new Response(
          JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            result: '0x1',
            error: { code: -1 },
          }),
        ),
        1,
      ),
    ).rejects.toThrow('Ambiguous');
    await expect(
      decodeRpc(
        new Response(
          JSON.stringify({ jsonrpc: '2.0', id: 1, error: { code: 1.5 } }),
        ),
        1,
      ),
    ).rejects.toThrow('Invalid RPC error');
    await expect(
      decodeRpc(new Response(' '.repeat(8 * 1024 * 1024 + 1)), 1),
    ).rejects.toThrow('8 MiB');
  });
  it('attaches wallet listeners before authorization and re-reads a context changed during connection', async () => {
    const events = new Map<string, (...args: unknown[]) => void>();
    let account = first as string,
      changed = false;
    const request = vi.fn(async ({ method }: { method: string }) => {
      expect(events.has('accountsChanged')).toBe(true);
      if (method === 'eth_requestAccounts' || method === 'eth_accounts')
        return [account];
      if (!changed) {
        changed = true;
        account = second;
        events.get('accountsChanged')?.([second]);
      }
      return '0xaa36a7';
    });
    Object.defineProperty(window, 'ethereum', {
      configurable: true,
      value: {
        request,
        on: (event: string, fn: (...args: unknown[]) => void) =>
          events.set(event, fn),
        removeListener: (event: string) => events.delete(event),
      },
    });
    await useWallet.getState().connect();
    expect(useWallet.getState().address).toBe(second);
    expect(
      request.mock.calls.filter((call) => call[0].method === 'eth_accounts'),
    ).toHaveLength(2);
    useWallet.getState().disconnect();
    expect(events.size).toBe(0);
  });
  it('cleans up partially registered wallet listeners without starting authorization', async () => {
    const remove = vi.fn(),
      request = vi.fn();
    Object.defineProperty(window, 'ethereum', {
      configurable: true,
      value: {
        request,
        on: (name: string) => {
          if (name === 'chainChanged') throw new Error('registration failure');
        },
        removeListener: remove,
      },
    });
    await useWallet.getState().connect();
    expect(request).not.toHaveBeenCalled();
    expect(remove).toHaveBeenCalledTimes(2);
    expect(useWallet.getState().address).toBeNull();
  });
  it('clears and cancels all account permission discovery and local demo caches', async () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    useInspectionSession.getState().inspect(first, 11155111);
    usePairStore
      .getState()
      .add(11155111, [{ token: first, spender: second, source: 'manual' }]);
    for (const key of ['account', 'discovery', 'permit2', 'local-demo'])
      client.setQueryData([key], { privateTarget: first });
    let cancelled = false;
    const pending = client
      .fetchQuery({
        queryKey: ['allowances'],
        queryFn: ({ signal }) =>
          new Promise((_, reject) =>
            signal.addEventListener('abort', () => {
              cancelled = true;
              reject(new Error('cancelled'));
            }),
          ),
      })
      .catch(() => {});
    clearInspection(client);
    await pending;
    expect(cancelled).toBe(true);
    expect(client.getQueryCache().getAll()).toEqual([]);
    expect(useInspectionSession.getState().target).toBeNull();
    expect(usePairStore.getState().extra).toEqual({});
  });
  it('rejects unsupported chains before initializing a worker or persisting a target', async () => {
    const factory = vi.fn();
    const manager = new AnonRpcManager(factory);
    await expect(manager.request(10 as 1, 'eth_blockNumber')).rejects.toThrow(
      'Unsupported read chain',
    );
    expect(factory).not.toHaveBeenCalled();
    expect(() =>
      useInspectionSession.getState().inspect(first, 10 as 1),
    ).toThrow('Unsupported');
    manager.close();
  });
});
