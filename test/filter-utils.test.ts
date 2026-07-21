import { describe, expect, it } from 'vitest';

import { hasFilterValue, isLabelKey, labelKeyOf, valuesEqual } from '../src/filter-utils';

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

describe('labelKeyOf / isLabelKey', () => {
  it('round-trips: a key built by labelKeyOf is detected by isLabelKey', () => {
    expect(labelKeyOf('customer_id')).toBe('customer_id_label');
    expect(isLabelKey(labelKeyOf('customer_id'))).toBe(true);
    expect(isLabelKey('customer_id')).toBe(false);
  });
});
