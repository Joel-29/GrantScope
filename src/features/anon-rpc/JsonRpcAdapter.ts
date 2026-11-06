import { custom, type EIP1193RequestFn } from 'viem';

export class JsonRpcError extends Error {
  constructor(
    message: string,
    public readonly code: number,
  ) {
    super(message);
    this.name = 'JsonRpcError';
  }
}

export async function decodeRpc(
  response: Response,
  id: number,
): Promise<unknown> {
  if (!response.ok) throw new Error(`RPC HTTP ${response.status}`);
  const value: unknown = await response.json();
  if (
    !value ||
    typeof value !== 'object' ||
    !('jsonrpc' in value) ||
    value.jsonrpc !== '2.0' ||
    !('id' in value) ||
    value.id !== id
  )
    throw new Error('Invalid JSON-RPC response envelope');
  if ('error' in value) {
    const error = value.error;
    if (
      !error ||
      typeof error !== 'object' ||
      !('code' in error) ||
      typeof error.code !== 'number'
    )
      throw new Error('Invalid RPC error');
    // Providers may echo sensitive query parameters in error messages. Do not retain them.
    throw new JsonRpcError(
      `RPC request rejected (code ${error.code})`,
      error.code,
    );
  }
  if (!('result' in value)) throw new Error('RPC response has no result');
  return value.result;
}

export function rpcQuantity(value: unknown): bigint {
  if (typeof value !== 'string' || !/^0x(?:0|[1-9a-f][0-9a-f]*)$/i.test(value))
    throw new Error('Invalid RPC quantity');
  return BigInt(value);
}

export function anonymousViemTransport(
  request: (method: string, params?: readonly unknown[]) => Promise<unknown>,
) {
  // viem performs no implicit retries or fallback transport; all calls enter the same manager.
  return custom(
    {
      request: (async (args: { method: string; params?: readonly unknown[] }) =>
        request(args.method, args.params)) as EIP1193RequestFn,
    },
    { retryCount: 0 },
  );
}
