export async function abortable<T>(
  operation: () => Promise<T>,
  signal: AbortSignal,
): Promise<T> {
  signal.throwIfAborted();
  let listener: (() => void) | undefined;
  try {
    return await Promise.race([
      Promise.resolve().then(() => {
        signal.throwIfAborted();
        return operation();
      }),
      new Promise<never>((_, reject) => {
        listener = () =>
          reject(signal.reason ?? new DOMException('Aborted', 'AbortError'));
        signal.addEventListener('abort', listener, { once: true });
      }),
    ]);
  } finally {
    if (listener) signal.removeEventListener('abort', listener);
  }
}
