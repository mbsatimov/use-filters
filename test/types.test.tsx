import { renderHook } from '@testing-library/react';
import { withNuqsTestingAdapter } from 'nuqs/adapters/testing';
import { describe, expect, expectTypeOf, it } from 'vitest';

import type { FilterOption } from '../src/types';

import { createFilters } from '../src/create-filters';

/*
 * Type-level tests. `expectTypeOf` assertions are checked by `tsc` (via
 * `npm run typecheck`, which includes `test/`) and are no-ops at runtime —
 * they lock in the inference behavior that is this package's main contract:
 * config maps produce correctly-typed `params` with no annotations, and an
 * explicit `<P>` argument validates configs against an API's params type.
 */

const { useFilters, f, resolveFilterParams } = createFilters();
const wrapper = withNuqsTestingAdapter({ hasMemory: true });

const statusOptions = [
  { label: 'Open', value: 'open' },
  { label: 'Closed', value: 'closed' }
] as const;

describe('type inference — per-config `params` (no type argument)', () => {
  it('maps every filter kind to its value type', () => {
    const { result } = renderHook(
      () =>
        useFilters({
          search: f.text({ label: 'Search' }),
          amount: f.number({ label: 'Amount' }),
          active: f.boolean({ label: 'Active' }),
          status: f.select({ label: 'Status', options: statusOptions }),
          ids: f.multiSelect({
            label: 'Ids',
            options: [
              { label: 'One', value: 1 },
              { label: 'Two', value: 2 }
            ]
          }),
          price: f.numberRange({ label: 'Price' }),
          period: f.dateRange({ label: 'Period' }),
          opens_at: f.time({ label: 'Opens at' }),
          tags: f.tags({ label: 'Tags' }),
          customer_id: f.asyncSelect({
            label: 'Customer',
            loadOptions: async () => [{ label: 'Acme', value: 42 }]
          })
        }),
      { wrapper }
    );

    const { params } = result.current;
    expectTypeOf(params.search).toEqualTypeOf<string | null>();
    expectTypeOf(params.amount).toEqualTypeOf<number | null>();
    expectTypeOf(params.active).toEqualTypeOf<boolean | null>();
    expectTypeOf(params.status).toEqualTypeOf<'closed' | 'open' | null>();
    expectTypeOf(params.ids).toEqualTypeOf<(1 | 2)[] | null>();
    expectTypeOf(params.price).toEqualTypeOf<[number, number] | null>();
    expectTypeOf(params.period).toEqualTypeOf<[string, string] | null>();
    expectTypeOf(params.opens_at).toEqualTypeOf<string | null>();
    expectTypeOf(params.tags).toEqualTypeOf<string[] | null>();
    expectTypeOf(params.customer_id).toEqualTypeOf<number | null>();
    // Pagination keys are mirrored into params, always present.
    expectTypeOf(params.page).toEqualTypeOf<number>();
    expectTypeOf(params.per_page).toEqualTypeOf<number>();
  });

  it('narrows a resolved filter to its own config (filterMap)', () => {
    const { result } = renderHook(
      () => useFilters({ status: f.select({ label: 'Status', options: statusOptions }) }),
      { wrapper }
    );

    const status = result.current.filterMap.status;
    // `onChange` takes this filter's value type, not the union's `null` floor.
    expectTypeOf(status.onChange).parameter(0).toEqualTypeOf<'closed' | 'open' | null>();
    // Static selects resolve the full selected option object.
    expectTypeOf(status.selectedOption).toEqualTypeOf<FilterOption<'closed' | 'open'> | null>();
    expectTypeOf(status.isDirty).toEqualTypeOf<boolean>();
    expectTypeOf(status.committedValue).toEqualTypeOf<'closed' | 'open' | null>();
  });
});

describe('type checking — explicit `<P>` (API params type)', () => {
  interface LoanListParams {
    customer_id?: number;
    page: number;
    per_page: number;
    search?: string;
    status?: 'closed' | 'open';
  }

  it('shapes params like the API type (pagination owned by the hook)', () => {
    const { result } = renderHook(
      () =>
        useFilters<LoanListParams>({
          search: f.text({ label: 'Search' }),
          status: f.select({ label: 'Status', options: statusOptions })
        }),
      { wrapper }
    );

    const { params } = result.current;
    expectTypeOf(params.search).toEqualTypeOf<string | undefined>();
    expectTypeOf(params.status).toEqualTypeOf<'closed' | 'open' | undefined>();
    expectTypeOf(params.page).toEqualTypeOf<number>();
    expectTypeOf(params.per_page).toEqualTypeOf<number>();
  });

  it('rejects keys and value types that do not fit the API type', () => {
    // Never executed — these exist purely for the compile-time assertions.
    // (Named use* so the rules-of-hooks lint treats them as custom hooks.)
    const useRejectsUnknownKey = () =>
      useFilters<LoanListParams>({
        // @ts-expect-error — `nope` is not a key of LoanListParams
        nope: f.text({ label: 'Nope' })
      });

    const useRejectsWrongValueType = () =>
      useFilters<LoanListParams>({
        // @ts-expect-error — a boolean filter cannot produce `status`'s union
        status: f.boolean({ label: 'Status' })
      });

    const rejectsPaginationKeyOnSetFilter = () => {
      const { setFilter } = renderHook(
        () => useFilters<LoanListParams>({ search: f.text({ label: 'Search' }) }),
        { wrapper }
      ).result.current;
      // @ts-expect-error — pagination keys are owned by the hook, not settable
      setFilter('page', 2);
    };

    expectTypeOf(useRejectsUnknownKey).toBeFunction();
    expectTypeOf(useRejectsWrongValueType).toBeFunction();
    expectTypeOf(rejectsPaginationKeyOnSetFilter).toBeFunction();
  });
});

describe('type inference — createFilters pagination keys', () => {
  it('types params from renamed literal keys', () => {
    const custom = createFilters({ pagination: { pageKey: 'p', perPageKey: 'size' } });
    const { result } = renderHook(() => custom.useFilters({ q: custom.f.text({ label: 'Q' }) }), {
      wrapper
    });

    expectTypeOf(result.current.params.p).toEqualTypeOf<number>();
    expectTypeOf(result.current.params.size).toEqualTypeOf<number>();
    expect(result.current.params).toMatchObject({ p: 1, size: 10 });
  });
});

describe('type checking — choice valueType', () => {
  it('is optional when options are static (value type inferred)', () => {
    const { result } = renderHook(
      () => useFilters({ status: f.select({ label: 'Status', options: statusOptions }) }),
      { wrapper }
    );
    expectTypeOf(result.current.params.status).toEqualTypeOf<'closed' | 'open' | null>();
  });

  it('accepts a valueType that matches the option value family', () => {
    // Never executed — compile-time only.
    const useNumeric = () =>
      useFilters({
        id: f.select({ label: 'Id', valueType: 'number', options: [{ label: 'One', value: 1 }] })
      });
    const useDynamicEither = () =>
      // Untyped/dynamic options accept either token.
      useFilters({ id: f.select({ label: 'Id', valueType: 'string', options: [] }) });
    expectTypeOf(useNumeric).toBeFunction();
    expectTypeOf(useDynamicEither).toBeFunction();
  });

  it('rejects a valueType that contradicts the option values', () => {
    f.select({
      label: 'Id',
      // @ts-expect-error — numeric options require valueType 'number', not 'string'
      valueType: 'string',
      options: [{ label: 'One', value: 1 }]
    });
    f.multiSelect({
      label: 'Tags',
      // @ts-expect-error — string options require valueType 'string', not 'number'
      valueType: 'number',
      options: [{ label: 'A', value: 'a' }]
    });
    expect(true).toBe(true);
  });
});

describe('type inference — resolveFilterParams', () => {
  it('produces the same value types as the hook', () => {
    const params = resolveFilterParams(
      {
        search: f.text({ label: 'Search' }),
        customer_id: f.select({ label: 'Customer', options: [{ label: 'A', value: 1 }] })
      },
      '?search=acme&customer_id=1&page=3'
    );

    expectTypeOf(params.search).toEqualTypeOf<string | null>();
    expectTypeOf(params.customer_id).toEqualTypeOf<1 | null>();
    expectTypeOf(params.page).toEqualTypeOf<number>();
    expect(params).toEqual({ search: 'acme', customer_id: 1, page: 3, per_page: 10 });
  });
});
