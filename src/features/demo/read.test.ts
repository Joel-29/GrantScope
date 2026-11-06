import { describe, expect, it, vi } from 'vitest';
import {
  boundedDemoRead,
  DEMO_READ_TIMEOUT_MS,
  DemoDeadlineError,
} from './read';

describe('bounded anonymous demo attempts (mock operations)', () => {
  it('settles at the total deadline even when an operation ignores cancellation', async () => {
    vi.useFakeTimers();
    try {
      let settled = false;
      const result = boundedDemoRead(
        () => new Promise(() => {}),
        new AbortController().signal,
      ).catch((error) => error);
      void result.then(() => {
        settled = true;
      });
      await vi.advanceTimersByTimeAsync(DEMO_READ_TIMEOUT_MS - 1);
      expect(settled).toBe(false);
      await vi.advanceTimersByTimeAsync(1);
      expect(await result).toMatchObject({ name: 'TimeoutError' });
      expect(await result).toBeInstanceOf(DemoDeadlineError);
      expect(vi.getTimerCount()).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });
  it('cancels promptly and clears its deadline without claiming a result', async () => {
    vi.useFakeTimers();
    try {
      const controller = new AbortController();
      const result = boundedDemoRead(
        () => new Promise(() => {}),
        controller.signal,
      ).catch((error) => error);
      await vi.advanceTimersByTimeAsync(1);
      controller.abort();
      expect(await result).toMatchObject({ name: 'AbortError' });
      expect(vi.getTimerCount()).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });
  it('does not dispatch an already cancelled operation', async () => {
    const controller = new AbortController(),
      operation = vi.fn(async () => 1);
    controller.abort();
    await expect(
      boundedDemoRead(operation, controller.signal),
    ).rejects.toMatchObject({ name: 'AbortError' });
    expect(operation).not.toHaveBeenCalled();
  });
});
