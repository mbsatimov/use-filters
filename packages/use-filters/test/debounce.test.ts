import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { debounceAsync } from '../src/debounce';

describe('debounceAsync', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('collapses calls within the window into one real call, using the last args', async () => {
    const fn = vi.fn(async (search: string) => `result:${search}`);
    const debounced = debounceAsync(fn, 300);

    const p1 = debounced('a');
    vi.advanceTimersByTime(100);
    const p2 = debounced('ac');
    vi.advanceTimersByTime(100);
    const p3 = debounced('acm');

    expect(fn).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(300);

    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith('acm');
    // Every caller in the window resolves together, to the one real call's result.
    await expect(p1).resolves.toBe('result:acm');
    await expect(p2).resolves.toBe('result:acm');
    await expect(p3).resolves.toBe('result:acm');
  });

  it('calls again after the window elapses between calls', async () => {
    const fn = vi.fn(async (search: string) => search);
    const debounced = debounceAsync(fn, 300);

    debounced('a');
    await vi.advanceTimersByTimeAsync(300);
    debounced('b');
    await vi.advanceTimersByTimeAsync(300);

    expect(fn).toHaveBeenCalledTimes(2);
    expect(fn).toHaveBeenNthCalledWith(1, 'a');
    expect(fn).toHaveBeenNthCalledWith(2, 'b');
  });

  it('rejects every waiting caller when the underlying call rejects', async () => {
    const fn = vi.fn(async () => {
      throw new Error('network down');
    });
    const debounced = debounceAsync(fn, 300);

    // Attach the rejection assertions synchronously, before advancing timers,
    // so each promise is never briefly "unhandled" (Node/Vitest would flag
    // that even though it's handled moments later).
    const assertion1 = expect(debounced()).rejects.toThrow('network down');
    const assertion2 = expect(debounced()).rejects.toThrow('network down');
    await vi.advanceTimersByTimeAsync(300);

    await assertion1;
    await assertion2;
  });
});
