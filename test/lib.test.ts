import { describe, expect, it } from 'vitest';

import { f } from '../src/builders';
import {
  buildParser,
  coerceInt,
  coerceRawValue,
  fromDateValue,
  hasFilterValue,
  toDateValue,
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
    const parser = buildParser(
      f.select({ label: 'Late', options: [], defaultValue: 7 })
    );
    // numeric default => integer parsing
    expect(parser.parse('9')).toBe(9);
    expect(typeof parser.parse('9')).toBe('number');
  });
});

describe('date round-trip', () => {
  it('round-trips the default yyyy-MM-dd format', () => {
    const iso = toDateValue(new Date(2026, 6, 9));
    expect(iso).toBe('2026-07-09');
    const back = fromDateValue('2026-07-09');
    expect(back?.getFullYear()).toBe(2026);
    expect(back?.getMonth()).toBe(6);
    expect(back?.getDate()).toBe(9);
  });

  it('returns undefined for empty/invalid input', () => {
    expect(fromDateValue('')).toBeUndefined();
    expect(fromDateValue(null)).toBeUndefined();
    expect(fromDateValue('not-a-date')).toBeUndefined();
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
