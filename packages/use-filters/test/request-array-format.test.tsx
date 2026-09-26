import { act, renderHook } from '@testing-library/react';
import { describe, expect, expectTypeOf, it } from 'vitest';

import { createFilters } from '../src/create-filters';
import { wrapper } from './helpers';

/** A config map exercising every array-shaped filter kind. */
const arrayConfigs = (f: ReturnType<typeof createFilters>['f']) => ({
  tags: f.tags({ label: 'Tags' }),
  ids: f.multiSelect({
    label: 'Ids',
    valueType: 'number',
    options: [
      { label: 'One', value: 1 },
      { label: 'Two', value: 2 }
    ]
  }),
  price: f.numberRange({ label: 'Price' }),
  period: f.dateRange({ label: 'Period' })
});

describe('request.arrayFormat — default is `array`', () => {
  it('leaves array-shaped params as JS arrays', () => {
    const { useFilters, f } = createFilters();
    const { result } = renderHook(() => useFilters(arrayConfigs(f)), { wrapper });

    act(() => {
      result.current.filterMap.tags.onChange(['a', 'b']);
      result.current.filterMap.ids.onChange([1, 2]);
      result.current.filterMap.price.onChange([10, 20]);
    });

    expect(result.current.params.tags).toEqual(['a', 'b']);
    expect(result.current.params.ids).toEqual([1, 2]);
    expect(result.current.params.price).toEqual([10, 20]);
  });
});

describe("request.arrayFormat: 'string' — createFilters auto-serializes params", () => {
  it('joins every array-shaped param with the comma separator', () => {
    const { useFilters, f } = createFilters({ request: { arrayFormat: 'string' } });
    const { result } = renderHook(() => useFilters(arrayConfigs(f)), { wrapper });

    act(() => {
      result.current.filterMap.tags.onChange(['a', 'b']);
      result.current.filterMap.ids.onChange([1, 2]);
      result.current.filterMap.price.onChange([10, 20]);
      result.current.filterMap.period.onChange(['2024-01-01', '2024-12-31']);
    });

    expect(result.current.params.tags).toBe('a,b');
    expect(result.current.params.ids).toBe('1,2');
    expect(result.current.params.price).toBe('10,20');
    expect(result.current.params.period).toBe('2024-01-01,2024-12-31');
  });

  it('joins with the factory arraySeparator', () => {
    const { useFilters, f } = createFilters({
      arraySeparator: '|',
      request: { arrayFormat: 'string' }
    });
    const { result } = renderHook(() => useFilters({ tags: f.tags({ label: 'Tags' }) }), {
      wrapper
    });

    act(() => {
      result.current.filterMap.tags.onChange(['a', 'b', 'c']);
    });

    expect(result.current.params.tags).toBe('a|b|c');
  });

  it('leaves an unset array param as null (not an empty string)', () => {
    const { useFilters, f } = createFilters({ request: { arrayFormat: 'string' } });
    const { result } = renderHook(() => useFilters({ tags: f.tags({ label: 'Tags' }) }), {
      wrapper
    });

    expect(result.current.params.tags).toBeNull();
  });

  it('does not touch scalar params or pagination keys', () => {
    const { useFilters, f } = createFilters({ request: { arrayFormat: 'string' } });
    const { result } = renderHook(
      () =>
        useFilters({
          search: f.text({ label: 'Search' }),
          amount: f.number({ label: 'Amount' })
        }),
      { wrapper }
    );

    act(() => {
      result.current.filterMap.search.onChange('hello');
      result.current.filterMap.amount.onChange(5);
    });

    expect(result.current.params.search).toBe('hello');
    expect(result.current.params.amount).toBe(5);
    expect(result.current.params.page).toBe(1);
    expect(result.current.params.per_page).toBe(10);
  });

  it('serializes an async multiSelect value while its label sidecar stays out of params', () => {
    const { useFilters, f } = createFilters({ request: { arrayFormat: 'string' } });
    const { result } = renderHook(
      () =>
        useFilters({
          owners: f.asyncMultiSelect({
            label: 'Owners',
            valueType: 'string',
            loadOptions: async () => ({ options: [] })
          })
        }),
      { wrapper }
    );

    act(() => {
      result.current.filterMap.owners.onSetOptions([
        { label: 'Ann', value: 'ann' },
        { label: 'Bo', value: 'bo' }
      ]);
    });

    expect(result.current.params.owners).toBe('ann,bo');
    expect(result.current.params).not.toHaveProperty('owners_label');
  });

  it('still exposes real arrays on filters/filterMap (the UI is unaffected)', () => {
    const { useFilters, f } = createFilters({ request: { arrayFormat: 'string' } });
    const { result } = renderHook(() => useFilters({ tags: f.tags({ label: 'Tags' }) }), {
      wrapper
    });

    act(() => {
      result.current.filterMap.tags.onChange(['a', 'b']);
    });

    expect(result.current.filterMap.tags.value).toEqual(['a', 'b']);
  });

  it('keeps paramsStr identical to the `array` form (arrayFormat never re-keys)', () => {
    const asArray = renderHook(
      () => createFilters().useFilters({ tags: createFilters().f.tags({ label: 'Tags' }) }),
      { wrapper }
    );
    const asString = renderHook(
      () =>
        createFilters({ request: { arrayFormat: 'string' } }).useFilters({
          tags: createFilters().f.tags({ label: 'Tags' })
        }),
      { wrapper }
    );

    act(() => {
      asArray.result.current.filterMap.tags.onChange(['a', 'b']);
      asString.result.current.filterMap.tags.onChange(['a', 'b']);
    });

    expect(asString.result.current.paramsStr).toBe(asArray.result.current.paramsStr);
  });
});

describe("request.arrayFormat: 'string' — resolveFilterParams matches the hook", () => {
  it('joins arrays parsed from a raw query string', () => {
    const { resolveFilterParams, f } = createFilters({ request: { arrayFormat: 'string' } });
    const configs = { tags: f.tags({ label: 'Tags' }), price: f.numberRange({ label: 'Price' }) };

    const params = resolveFilterParams(configs, { tags: 'a,b,c', price: '10,20' });

    expect(params.tags).toBe('a,b,c');
    expect(params.price).toBe('10,20');
  });
});

/*
 * Type-level tests — checked by `tsc` (`npm run typecheck` includes `test/`),
 * no-ops at runtime. They lock in that `request.arrayFormat: 'string'` re-types
 * every array-shaped param as `string`, in both inference modes.
 */
describe('request.arrayFormat — type inference', () => {
  it('re-types array-shaped params as `string` (inferred mode)', () => {
    const { useFilters, f } = createFilters({ request: { arrayFormat: 'string' } });
    const { result } = renderHook(() => useFilters(arrayConfigs(f)), { wrapper });

    const { params } = result.current;
    expectTypeOf(params.tags).toEqualTypeOf<string | null>();
    expectTypeOf(params.ids).toEqualTypeOf<string | null>();
    expectTypeOf(params.price).toEqualTypeOf<string | null>();
    expectTypeOf(params.period).toEqualTypeOf<string | null>();
    // Scalars keep their types; filterMap still exposes the real array.
    expectTypeOf(params.page).toEqualTypeOf<number>();
    expectTypeOf(result.current.filterMap.tags.value).toEqualTypeOf<string[] | null>();
  });

  it('keeps arrays under the default `array`', () => {
    const { useFilters, f } = createFilters();
    const { result } = renderHook(() => useFilters({ tags: f.tags({ label: 'Tags' }) }), {
      wrapper
    });

    expectTypeOf(result.current.params.tags).toEqualTypeOf<string[] | null>();
  });

  it('lets a serialized array satisfy a `string` param in explicit `<P>` mode', () => {
    interface ListParams {
      page: number;
      per_page: number;
      // Backend takes the multiSelect as a comma-joined string.
      tags?: string | null;
    }

    const { useFilters, f } = createFilters({ request: { arrayFormat: 'string' } });
    const { result } = renderHook(
      () =>
        useFilters<ListParams>({
          tags: f.multiSelect({
            label: 'Tags',
            valueType: 'string',
            options: [
              { label: 'A', value: 'a' },
              { label: 'B', value: 'b' }
            ]
          })
        }),
      { wrapper }
    );

    expectTypeOf(result.current.params.tags).toEqualTypeOf<string | null | undefined>();
    const forApi: ListParams = result.current.params;
    void forApi;
  });
});
