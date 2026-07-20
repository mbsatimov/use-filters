import { renderHook } from '@testing-library/react';
import { withNuqsTestingAdapter } from 'nuqs/adapters/testing';
import { describe, expect, expectTypeOf, it } from 'vitest';

import type { FilterOption, ResolvedFilter } from '../src/types';
import type { AnyUseFiltersReturn } from '../src/use-filters';

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
          status: f.select({ label: 'Status', valueType: 'string', options: statusOptions }),
          ids: f.multiSelect({
            label: 'Ids',
            valueType: 'number',
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
            valueType: 'number',
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
      () =>
        useFilters({
          status: f.select({ label: 'Status', valueType: 'string', options: statusOptions })
        }),
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
          status: f.select({ label: 'Status', valueType: 'string', options: statusOptions })
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
  it('is required — a select/multiSelect without it is a compile error', () => {
    // Never executed — compile-time only.
    const useMissingValueType = () =>
      useFilters({
        // @ts-expect-error — `valueType` is required on `f.select`
        status: f.select({ label: 'Status', options: statusOptions })
      });
    expectTypeOf(useMissingValueType).toBeFunction();
  });

  it('accepts a valueType that matches the option value family', () => {
    // Never executed — compile-time only.
    const useNumeric = () =>
      useFilters({
        id: f.select({ label: 'Id', valueType: 'number', options: [{ label: 'One', value: 1 }] })
      });
    expectTypeOf(useNumeric).toBeFunction();
  });

  it('drives the params type from the token when options are empty (dynamic)', () => {
    const { result } = renderHook(
      () =>
        useFilters({
          id: f.select({ label: 'Id', valueType: 'number', options: [] }),
          slug: f.select({ label: 'Slug', valueType: 'string', options: [] }),
          ids: f.multiSelect({ label: 'Ids', valueType: 'number', options: [] })
        }),
      { wrapper }
    );
    expectTypeOf(result.current.params.id).toEqualTypeOf<number | null>();
    expectTypeOf(result.current.params.slug).toEqualTypeOf<string | null>();
    expectTypeOf(result.current.params.ids).toEqualTypeOf<number[] | null>();
  });

  it('rejects an option that contradicts the declared valueType (error on the option)', () => {
    // `valueType` is the declaration; `options` are checked against it, so the
    // compile error lands on the mismatched option, not on the token.
    f.select({
      label: 'Id',
      valueType: 'string',
      // @ts-expect-error — declared 'string', so a numeric option value is rejected
      options: [{ label: 'One', value: 1 }]
    });
    f.multiSelect({
      label: 'Tags',
      valueType: 'number',
      // @ts-expect-error — declared 'number', so a string option value is rejected
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
        customer_id: f.select({
          label: 'Customer',
          valueType: 'number',
          options: [{ label: 'A', value: 1 }]
        })
      },
      '?search=acme&customer_id=1&page=3'
    );

    expectTypeOf(params.search).toEqualTypeOf<string | null>();
    expectTypeOf(params.customer_id).toEqualTypeOf<1 | null>();
    expectTypeOf(params.page).toEqualTypeOf<number>();
    expect(params).toEqual({ search: 'acme', customer_id: 1, page: 3, per_page: 10 });
  });
});

describe('AnyUseFiltersReturn — pass-through component prop', () => {
  // A pass-through component's prop position — plain assignment, the
  // strictest relation. If any concrete return stops being assignable
  // here, shared toolbar/panel components break, so lock it in.
  const takesAny = (r: AnyUseFiltersReturn) => r.isDirty;

  it('accepts an inferred-config return (typed onChange, async, multiSelect)', () => {
    const useConfigured = () =>
      useFilters({
        status: f.select({ label: 'Status', valueType: 'string', options: statusOptions }),
        ids: f.multiSelect({
          label: 'Ids',
          valueType: 'number',
          options: [{ label: 'One', value: 1 }]
        }),
        owner: f.asyncSelect({ label: 'Owner', valueType: 'number', loadOptions: async () => [] }),
        amount: f.number({ label: 'Amount' })
      });
    const check = (r: ReturnType<typeof useConfigured>) => takesAny(r);
    expectTypeOf(useConfigured).toBeFunction();
    expectTypeOf(check).toBeFunction();
  });

  it('accepts an explicit-<P> return', () => {
    interface ListParams {
      page: number;
      per_page: number;
      q?: string;
    }
    const useConfigured = () => useFilters<ListParams>({ q: f.text({ label: 'Q' }) });
    const check = (r: ReturnType<typeof useConfigured>) => takesAny(r);
    expectTypeOf(useConfigured).toBeFunction();
    expectTypeOf(check).toBeFunction();
  });

  it('accepts a return with renamed pagination keys', () => {
    const renamed = createFilters({ pagination: { pageKey: 'p', perPageKey: 'limit' } });
    const useConfigured = () => renamed.useFilters({ q: renamed.f.text({ label: 'Q' }) });
    const check = (r: ReturnType<typeof useConfigured>) => takesAny(r);
    expectTypeOf(useConfigured).toBeFunction();
    expectTypeOf(check).toBeFunction();
  });

  it('exposes opaque reads and keeps setFilter uncallable', () => {
    const inspect = (r: AnyUseFiltersReturn) => {
      expectTypeOf(r.filters).toEqualTypeOf<ResolvedFilter[]>();
      expectTypeOf(r.filterMap).toEqualTypeOf<Record<string, ResolvedFilter>>();
      expectTypeOf(r.params).toEqualTypeOf<Record<string, unknown>>();
      // Uncallable by design: a pass-through component doesn't know the keys.
      // @ts-expect-error — setFilter takes `never`, so no key is accepted
      r.setFilter('status', 'open');
    };
    expectTypeOf(inspect).toBeFunction();
  });

  it('still rejects the unsafe direction: a wide filter where a narrow one is expected', () => {
    // The narrow→wide widening above comes from bivariant (method-syntax)
    // handlers on `ResolvedFilter` — make sure that loosening didn't also
    // open the reverse door, which `value`'s covariance must keep shut.
    const useConfigured = () =>
      useFilters({
        status: f.select({ label: 'Status', valueType: 'string', options: statusOptions })
      });
    const assignWideToNarrow = (
      wide: ResolvedFilter,
      narrow: ReturnType<typeof useConfigured>['filterMap']
    ) => {
      // @ts-expect-error — a generic ResolvedFilter isn't a status filter
      narrow.status = wide;
    };
    expectTypeOf(useConfigured).toBeFunction();
    expectTypeOf(assignWideToNarrow).toBeFunction();
  });
});
