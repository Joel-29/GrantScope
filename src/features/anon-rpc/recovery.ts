import { abortable } from '../../lib/abortable';
import type { TransportSnapshot } from './types';

export function transientFailure(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  if ('name' in error && error.name === 'TimeoutError') return true;
  return (
    'message' in error &&
    typeof error.message === 'string' &&
    /failed to fetch|network(?:error| request failed)|Tunnel(?:Open)?TimeoutError|RPC HTTP (?:429|5\d\d)/i.test(
      error.message,
    )
  );
}

// Only fixed public specifier reads use this retry. No arbitrary address is accepted.
export async function bootstrapRetry<T>(
  operation: () => Promise<T>,
  signal: AbortSignal,
  delayMs = 300,
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (signal.aborted || !transientFailure(error)) throw error;
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      await abortable(
        () =>
          new Promise<void>((resolve) => {
            timer = setTimeout(resolve, delayMs);
          }),
        signal,
      );
    } finally {
      if (timer) clearTimeout(timer);
    }
    signal.throwIfAborted();
    return operation();
  }
}

export function workerStatus(state: TransportSnapshot): string {
  if (state.phase !== 'ready') return state.phase;
  if (state.readState === 'failed') return 'Read failed';
  return state.successfulWorkerReads > 0 ? 'Responding' : 'Ready · Unproven';
}
