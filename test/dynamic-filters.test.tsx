import { act, renderHook } from '@testing-library/react';
import { withNuqsTestingAdapter } from 'nuqs/adapters/testing';
import { describe, expect, it } from 'vitest';

import type { FilterConfig } from '../src/types';

import { createFilters } from '../src/create-filters';

const { useFilters, f } = createFilters();
const wrapper = withNuqsTestingAdapter({ hasMemory: true });

/** Simulates a backend describing which filters exist (e.g. e-commerce facets). */
interface Facet {
  key: string;
  label: string;
  type: 'checkbox' | 'range' | 'toggle';
  values?: { label: string; value: string; count: number }[];
}

function facetsToConfigs(facets: Facet[]): Record<string, FilterConfig> {
  return Object.fromEntries(
    facets.map((facet) => {
      switch (facet.type) {
        case 'checkbox':
          return [
            facet.key,
            f.multiSelect({
              label: facet.label,
              options: (facet.values ?? []).map((v) => ({
                label: v.label,
                value: v.value,
                count: v.count
              }))
            })
          ];
        case 'range':
          return [facet.key, f.numberRange({ label: facet.label })];
        default:
          return [facet.key, f.boolean({ label: facet.label })];
      }
    })
  );
}

describe('dynamic / backend-driven filters', () => {
  it('builds a config map at runtime and drives it through the hook', () => {
    const configs = facetsToConfigs([
      {
        key: 'brand',
        label: 'Brand',
        type: 'checkbox',
        values: [
          { label: 'Nike', value: 'nike', count: 42 },
          { label: 'Adidas', value: 'adidas', count: 18 }
        ]
      },
      { key: 'price', label: 'Price', type: 'range' },
      { key: 'in_stock', label: 'In stock', type: 'toggle' }
    ]);

    const { result } = renderHook(() => useFilters(configs), { wrapper });

    // Facet counts survive onto the resolved options.
    const brand = result.current.filterMap.brand;
    expect(brand.type).toBe('multiSelect');
    if (brand.type === 'multiSelect') {
      expect(brand.options[0]).toMatchObject({ value: 'nike', count: 42 });
    }

    // In the dynamic (untyped) path, narrow on `filter.type` before setting —
    // the loose `FilterConfig` union collapses `onChange` to `(value: null)`.
    act(() => {
      const b = result.current.filterMap.brand;
      if (b.type === 'multiSelect') b.onChange(['nike']);
      const p = result.current.filterMap.price;
      if (p.type === 'numberRange') p.onChange([10, 50]);
      const s = result.current.filterMap.in_stock;
      if (s.type === 'boolean') s.onChange(true);
    });

    expect(result.current.params).toMatchObject({
      brand: ['nike'],
      price: [10, 50],
      in_stock: true
    });
    expect(result.current.isFiltered).toBe(true);
  });

  it('re-keys the parser when numeric options arrive after mount (regression)', () => {
    // Backend-driven facets: the URL already holds `?brand_ids=1,2` on mount,
    // but the options haven't loaded yet — an empty `options` array resolves to
    // the *string* parser. When the numeric options arrive on a later render,
    // the parser must rebuild so the committed values re-parse as numbers
    // (matching what `resolveFilterParams` computes in a loader).
    const makeConfigs = (values: { label: string; value: number }[]) => ({
      brand_ids: f.multiSelect({ label: 'Brands', options: values })
    });

    const { result, rerender } = renderHook(
      ({ configs }: { configs: Record<string, FilterConfig> }) => useFilters(configs),
      {
        wrapper: withNuqsTestingAdapter({ hasMemory: true, searchParams: '?brand_ids=1,2' }),
        initialProps: { configs: makeConfigs([]) }
      }
    );

    // Pre-options: no way to know the value family, so strings are expected.
    expect(result.current.params).toMatchObject({ brand_ids: ['1', '2'] });

    rerender({
      configs: makeConfigs([
        { label: 'Nike', value: 1 },
        { label: 'Adidas', value: 2 }
      ])
    });

    // Post-options: the same URL now parses as numbers.
    expect(result.current.params).toMatchObject({ brand_ids: [1, 2] });
  });

  it('supports a changing set of filters without breaking hook rules', () => {
    const { result, rerender } = renderHook(
      ({ configs }: { configs: Record<string, FilterConfig> }) => useFilters(configs),
      {
        wrapper,
        initialProps: {
          configs: facetsToConfigs([{ key: 'in_stock', label: 'In stock', type: 'toggle' }])
        }
      }
    );

    expect(Object.keys(result.current.filterMap)).toEqual(['in_stock']);

    // Backend returns a different facet set on the next render.
    rerender({
      configs: facetsToConfigs([
        { key: 'price', label: 'Price', type: 'range' },
        { key: 'on_sale', label: 'On sale', type: 'toggle' }
      ])
    });

    expect(Object.keys(result.current.filterMap).sort()).toEqual(['on_sale', 'price']);
  });
});
