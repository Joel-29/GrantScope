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
  signal?: AbortSignal,
): Promise<unknown> {
  if (signal?.aborted) {
    void response.body?.cancel().catch(() => {});
    signal.throwIfAborted();
  }
  if (!response.ok) throw new Error(`RPC HTTP ${response.status}`);
  const reader = response.body?.getReader();
  if (!reader) throw new Error('Missing RPC response body');
  const abort = () => {
    void reader.cancel().catch(() => {});
  };
  signal?.addEventListener('abort', abort, { once: true });
  let body = '',
    bytes = 0;
  const decoder = new TextDecoder();
  try {
    while (true) {
      signal?.throwIfAborted();
      const part = await reader.read();
      if (part.done) break;
      bytes += part.value.byteLength;
      if (bytes > 8 * 1024 * 1024) {
        await reader.cancel();
        throw new Error('RPC response exceeds 8 MiB safety limit');
      }
      body += decoder.decode(part.value, { stream: true });
    }
    body += decoder.decode();
    signal?.throwIfAborted();
  } finally {
    signal?.removeEventListener('abort', abort);
    reader.releaseLock();
  }
  let value: unknown;
  try {
    value = JSON.parse(body);
  } catch {
    throw new Error('Malformed JSON-RPC JSON');
  }
  if (
    !value ||
    typeof value !== 'object' ||
    !('jsonrpc' in value) ||
    value.jsonrpc !== '2.0' ||
    !('id' in value) ||
    value.id !== id
  )
    throw new Error('Invalid JSON-RPC response envelope');
  if ('error' in value && 'result' in value)
    throw new Error('Ambiguous JSON-RPC response');
  if ('error' in value) {
    const error = value.error;
    if (
      !error ||
      typeof error !== 'object' ||
      !('code' in error) ||
      typeof error.code !== 'number' ||
      !Number.isInteger(error.code)
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
  if (
    typeof value !== 'string' ||
    value.length > 66 ||
    !/^0x(?:0|[1-9a-f][0-9a-f]*)$/i.test(value)
  )
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
