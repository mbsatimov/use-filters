import { describe, expect, it } from 'vitest';

import { coerceInt, resolvePaginationOverride } from '../src/pagination';

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
