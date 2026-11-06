import { abortable } from '../../lib/abortable';

export const DEMO_READ_TIMEOUT_MS = 240_000;

// This bounds one UI attempt without closing a shared anonymous worker.
// Even an SDK operation that ignores abort cannot leave this loader waiting.
export async function boundedDemoRead<T>(
  operation: (signal: AbortSignal) => Promise<T>,
  caller: AbortSignal,
): Promise<T> {
  const deadline = new AbortController();
  const signal = AbortSignal.any([caller, deadline.signal]);
  const timer = setTimeout(
    () =>
      deadline.abort(
        new DOMException('Demo read deadline exceeded', 'TimeoutError'),
      ),
    DEMO_READ_TIMEOUT_MS,
  );
  try {
    return await abortable(() => operation(signal), signal);
  } finally {
    clearTimeout(timer);
  }
}
