import { vi } from 'vitest';
import { AnonRpcManager } from '../features/anon-rpc/AnonRpcManager';
export type RpcCall = { id: number; method: string; params: unknown[] };
export function mockRpc(
  respond: (call: RpcCall) => unknown | Promise<unknown>,
  transport: 'nym' | 'nox' = 'nym',
) {
  const calls: RpcCall[] = [];
  const direct = vi.fn();
  const manager = new AnonRpcManager(
    () => ({
      ready: Promise.resolve(),
      close: vi.fn(),
      fetch: async (_url, init) => {
        const call = JSON.parse(String(init?.body)) as RpcCall;
        calls.push(call);
        const result = await respond(call);
        return new Response(
          JSON.stringify({ jsonrpc: '2.0', id: call.id, result }),
        );
      },
    }),
    direct,
    1000,
    1000,
    transport,
  );
  return { manager, calls, direct };
}
