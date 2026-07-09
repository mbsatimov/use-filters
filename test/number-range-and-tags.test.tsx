import { act, renderHook } from '@testing-library/react';
import { withNuqsTestingAdapter } from 'nuqs/adapters/testing';
import { describe, expect, it } from 'vitest';

import type { FiltersFor } from '../src/types';
import type { UseFiltersOptions } from '../src/use-filters';

import { f as fBuilder } from '../src/builders';
import { createFilters } from '../src/create-filters';
import { buildParser } from '../src/lib';

describe('numberRange parser', () => {
  it('round-trips a [min, max] float pair', () => {
    const parser = buildParser(fBuilder.numberRange({ label: 'Price' }));
    expect(parser.parse('1.5,3.5')).toEqual([1.5, 3.5]);
    expect(parser.serialize([1.5, 3.5] as never)).toBe('1.5,3.5');
  });

  it('parses integers only with precision: "int"', () => {
    const parser = buildParser(fBuilder.numberRange({ label: 'Age', precision: 'int' }));
    expect(parser.parse('1.9,3.9')).toEqual([1, 3]);
  });
});

describe('tags parser', () => {
  it('round-trips a freeform string array', () => {
    const parser = buildParser(fBuilder.tags({ label: 'Tags' }));
    expect(parser.parse('alpha,beta')).toEqual(['alpha', 'beta']);
    expect(parser.serialize(['alpha', 'beta'] as never)).toBe('alpha,beta');
  });
});

describe('resolveFilterParams coerces the new kinds', () => {
  const { f, resolveFilterParams } = createFilters();
  const configs = {
    price: f.numberRange({ label: 'Price' }),
    tags: f.tags({ label: 'Tags' })
  };

  it('turns raw URL strings into typed values', () => {
    const params = resolveFilterParams(configs, { price: '10,20', tags: 'a,b' });
    expect(params.price).toEqual([10, 20]);
    expect(params.tags).toEqual(['a', 'b']);
  });
});

describe('useFilters with numberRange and tags', () => {
  const { useFilters, f } = createFilters();
  const wrapper = withNuqsTestingAdapter({ hasMemory: true });

  function renderFilters<const T extends FiltersFor<never>>(
    configs: T,
    options?: UseFiltersOptions
  ) {
    return renderHook(() => useFilters<never, T>(configs, options), { wrapper });
  }

  it('stores and reflects a numeric range', () => {
    const { result } = renderFilters({ price: f.numberRange({ label: 'Price' }) });

    act(() => {
      result.current.filterMap.price.onChange([10.5, 99.5]);
    });

    expect(result.current.params.price).toEqual([10.5, 99.5]);
    expect(result.current.isFiltered).toBe(true);
  });

  it('stores and reflects a tag list', () => {
    const { result } = renderFilters({ tags: f.tags({ label: 'Tags' }) });

    act(() => {
      result.current.filterMap.tags.onChange(['red', 'blue']);
    });

    expect(result.current.params.tags).toEqual(['red', 'blue']);
    expect(result.current.isFiltered).toBe(true);
  });
});
