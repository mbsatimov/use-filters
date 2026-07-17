import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { f } from '../src/builders';
import {
  buildParser,
  coerceInt,
  coerceRawValue,
  debounceAsync,
  hasFilterValue,
  isLabelKey,
  labelKeyOf,
  resolvePaginationOverride,
  valuesEqual
} from '../src/lib';

describe('buildParser — number precision', () => {
  it('keeps decimals by default (float)', () => {
    const parser = buildParser(f.number({ label: 'Amount' }));
    expect(parser.parse('1.5')).toBe(1.5);
    expect(parser.serialize(1.5)).toBe('1.5');
  });

  it('truncates to integers with precision: "int"', () => {
    const parser = buildParser(f.number({ label: 'Count', precision: 'int' }));
    expect(parser.parse('1.5')).toBe(1);
  });
});

describe('buildParser — numeric choice detection', () => {
  it('parses numeric select options as numbers', () => {
    const parser = buildParser(
      f.select({ label: 'Customer', options: [{ label: 'A', value: 1 }] })
    );
    expect(parser.parse('5')).toBe(5);
    expect(typeof parser.parse('5')).toBe('number');
  });

  it('parses string select options as strings', () => {
    const parser = buildParser(
      f.select({ label: 'Status', options: [{ label: 'Open', value: 'open' }] })
    );
    expect(parser.parse('open')).toBe('open');
  });

  it('falls back to defaultValue when options are empty', () => {
    const parser = buildParser(f.select({ label: 'Late', options: [], defaultValue: 7 }));
    // numeric default => integer parsing
    expect(parser.parse('9')).toBe(9);
    expect(typeof parser.parse('9')).toBe('number');
  });
});

describe('buildParser — numberRange', () => {
  it('round-trips a [min, max] float pair', () => {
    const parser = buildParser(f.numberRange({ label: 'Price' }));
    expect(parser.parse('1.5,3.5')).toEqual([1.5, 3.5]);
    expect(parser.serialize([1.5, 3.5] as never)).toBe('1.5,3.5');
  });

  it('parses integers only with precision: "int"', () => {
    const parser = buildParser(f.numberRange({ label: 'Age', precision: 'int' }));
    expect(parser.parse('1.9,3.9')).toEqual([1, 3]);
  });
});

describe('buildParser — tags', () => {
  it('round-trips a freeform string array', () => {
    const parser = buildParser(f.tags({ label: 'Tags' }));
    expect(parser.parse('alpha,beta')).toEqual(['alpha', 'beta']);
    expect(parser.serialize(['alpha', 'beta'] as never)).toBe('alpha,beta');
  });
});

describe('buildParser — time & timeRange', () => {
  it('stores a time-of-day string as-is', () => {
    const parser = buildParser(f.time({ label: 'Opens at' }));
    expect(parser.parse('09:30')).toBe('09:30');
    expect(parser.serialize('09:30' as never)).toBe('09:30');
  });

  it('round-trips a [from, to] time pair', () => {
    const parser = buildParser(f.timeRange({ label: 'Hours' }));
    expect(parser.parse('09:00,17:00')).toEqual(['09:00', '17:00']);
    expect(parser.serialize(['09:00', '17:00'] as never)).toBe('09:00,17:00');
  });
});

describe('valuesEqual', () => {
  it('compares primitives', () => {
    expect(valuesEqual(1, 1)).toBe(true);
    expect(valuesEqual('a', 'a')).toBe(true);
    expect(valuesEqual(1, 2)).toBe(false);
    expect(valuesEqual(null, undefined)).toBe(false);
  });

  it('compares arrays of primitives element-wise', () => {
    expect(valuesEqual([1, 2], [1, 2])).toBe(true);
    expect(valuesEqual(['a', 'b'], ['a', 'b'])).toBe(true);
    expect(valuesEqual([1, 2], [2, 1])).toBe(false);
    expect(valuesEqual([1], [1, 2])).toBe(false);
  });
});

describe('hasFilterValue', () => {
  it('treats null/undefined/empty as inactive', () => {
    expect(hasFilterValue(null)).toBe(false);
    expect(hasFilterValue(undefined)).toBe(false);
    expect(hasFilterValue('')).toBe(false);
    expect(hasFilterValue([])).toBe(false);
    expect(hasFilterValue([null])).toBe(false);
  });

  it('treats set values as active', () => {
    expect(hasFilterValue(0)).toBe(true);
    expect(hasFilterValue('x')).toBe(true);
    expect(hasFilterValue([1])).toBe(true);
    expect(hasFilterValue(false)).toBe(true);
  });
});

describe('coerceInt', () => {
  it('coerces strings and passes through numbers', () => {
    expect(coerceInt('5')).toBe(5);
    expect(coerceInt(5)).toBe(5);
  });

  it('returns undefined for empty/non-numeric', () => {
    expect(coerceInt('')).toBeUndefined();
    expect(coerceInt('x')).toBeUndefined();
    expect(coerceInt(undefined)).toBeUndefined();
    expect(coerceInt(Number.NaN)).toBeUndefined();
  });
});

describe('labelKeyOf / isLabelKey', () => {
  it('round-trips: a key built by labelKeyOf is detected by isLabelKey', () => {
    expect(labelKeyOf('customer_id')).toBe('customer_id_label');
    expect(isLabelKey(labelKeyOf('customer_id'))).toBe(true);
    expect(isLabelKey('customer_id')).toBe(false);
  });
});

describe('resolvePaginationOverride', () => {
  const defaults = { defaultPerPage: 10, resetPageOnFilterChange: true };

  it('true / omitted keeps the factory defaults, enabled', () => {
    expect(resolvePaginationOverride(true, defaults)).toEqual({
      enabled: true,
      defaultPerPage: 10,
      resetPageOnFilterChange: true
    });
  });

  it('false disables and still reports the factory defaults', () => {
    expect(resolvePaginationOverride(false, defaults)).toEqual({
      enabled: false,
      defaultPerPage: 10,
      resetPageOnFilterChange: true
    });
  });

  it('an object overrides only the fields it sets', () => {
    expect(resolvePaginationOverride({ defaultPerPage: 50 }, defaults)).toEqual({
      enabled: true,
      defaultPerPage: 50,
      resetPageOnFilterChange: true
    });
    expect(resolvePaginationOverride({ resetPageOnFilterChange: false }, defaults)).toEqual({
      enabled: true,
      defaultPerPage: 10,
      resetPageOnFilterChange: false
    });
  });
});

describe('coerceRawValue', () => {
  const config = f.select({ label: 'Customer', options: [{ label: 'A', value: 1 }] });

  it('parses a raw URL string to the parser type', () => {
    expect(coerceRawValue(config, '5')).toBe(5);
  });

  it('passes through an already-typed value', () => {
    expect(coerceRawValue(config, 5)).toBe(5);
  });

  it('falls back to defaultValue then null when absent', () => {
    expect(coerceRawValue(config, undefined)).toBeNull();
    const withDefault = f.select({
      label: 'Customer',
      options: [{ label: 'A', value: 1 }],
      defaultValue: 1
    });
    expect(coerceRawValue(withDefault, undefined)).toBe(1);
  });
});

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
