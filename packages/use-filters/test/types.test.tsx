import { renderHook } from '@testing-library/react';
import { describe, expect, expectTypeOf, it } from 'vitest';

import type {
  AnyUseFiltersReturn,
  FilterOption,
  ResolvedFilter,
  ResolvedFilterBase
} from '../src/types';

import { createFilters } from '../src/create-filters';
import { f, resolveFilterParams, statusOptions, useFilters, wrapper } from './helpers';

/*
 * Type-level tests. `expectTypeOf` assertions are checked by `tsc` (via
 * `npm run typecheck`, which includes `test/`) and are no-ops at runtime —
 * they lock in the inference behavior that is this package's main contract:
 * config maps produce correctly-typed `params` with no annotations, and an
 * explicit `<P>` argument validates configs against an API's params type.
 */

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
    // paramsStr is the deterministic string form of params.
    expectTypeOf(result.current.paramsStr).toEqualTypeOf<string>();
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
  // The `<P>` contract mirrors the type's own shape (see `FiltersFor`):
  // nullable params (`| null`) may be declared without a default — `null`
  // in `params` is representable — and optional keys may omit the filter.
  interface LoanListParams {
    customer_id?: number | null;
    page: number;
    per_page: number;
    search?: string | null;
    status?: 'closed' | 'open' | null;
  }

  it('shapes params exactly like the API type (pagination owned by the hook)', () => {
    const { result } = renderHook(
      () =>
        useFilters<LoanListParams>({
          search: f.text({ label: 'Search' }),
          status: f.select({ label: 'Status', valueType: 'string', options: statusOptions })
        }),
      { wrapper }
    );

    const { params } = result.current;
    expectTypeOf(params.search).toEqualTypeOf<string | null | undefined>();
    expectTypeOf(params.status).toEqualTypeOf<'closed' | 'open' | null | undefined>();
    expectTypeOf(params.page).toEqualTypeOf<number>();
    expectTypeOf(params.per_page).toEqualTypeOf<number>();
    // `params` is assignable to the API type — soundly (unset filters are
    // `null`, which the nullable param types admit).
    const forApi: LoanListParams = params;
    void forApi;
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

describe('type checking — the `<P>` contract (required keys, required defaults)', () => {
  interface ContractParams {
    brand_id?: number | null; //  optional + nullable  -> filter optional, default optional
    page: number;
    per_page: number;
    search?: string; //           optional + non-null  -> filter optional; default required if declared
    sort: 'date' | 'price'; //    required + non-null  -> filter AND default required
    status: 'closed' | 'open' | null; // required + nullable -> filter required, default optional
  }

  it('accepts a config satisfying the contract; params mirror P exactly', () => {
    const { result } = renderHook(
      () =>
        useFilters<ContractParams>({
          status: f.select({ label: 'Status', valueType: 'string', options: statusOptions }),
          sort: f.select({
            label: 'Sort',
            valueType: 'string',
            options: [
              { label: 'Date', value: 'date' },
              { label: 'Price', value: 'price' }
            ],
            defaultValue: 'date'
          }),
          search: f.text({ label: 'Search', defaultValue: '' })
          // brand_id omitted — optional key, no filter required
        }),
      { wrapper }
    );

    const { params } = result.current;
    // required + nullable: always present, null representable
    expectTypeOf(params.status).toEqualTypeOf<'closed' | 'open' | null>();
    // required + non-null: always present, never null (default guarantees it)
    expectTypeOf(params.sort).toEqualTypeOf<'date' | 'price'>();
    // optional + non-null (declared with default): V when present
    expectTypeOf(params.search).toEqualTypeOf<string | undefined>();
    // optional + nullable (undeclared): absent-or-nullable
    expectTypeOf(params.brand_id).toEqualTypeOf<number | null | undefined>();

    // Runtime: required non-null params start at their defaults, never null.
    expect(params.sort).toBe('date');
    expect(params.search).toBe('');
    expect(params.status).toBe(null);
  });

  it('rejects a config missing a filter for a required key', () => {
    const useMissingRequired = () =>
      // @ts-expect-error — `sort` (and `status`) are required in ContractParams
      useFilters<ContractParams>({
        status: f.select({ label: 'Status', valueType: 'string', options: statusOptions })
      });
    expectTypeOf(useMissingRequired).toBeFunction();
  });

  it('rejects a non-null param declared without a defaultValue', () => {
    const useMissingDefault = () =>
      useFilters<ContractParams>({
        status: f.select({ label: 'Status', valueType: 'string', options: statusOptions }),
        // @ts-expect-error — `sort` is non-null, so its filter must set a defaultValue
        sort: f.select({
          label: 'Sort',
          valueType: 'string',
          options: [
            { label: 'Date', value: 'date' },
            { label: 'Price', value: 'price' }
          ]
        })
      });

    const useOptionalNonNullNoDefault = () =>
      useFilters<ContractParams>({
        status: f.select({ label: 'Status', valueType: 'string', options: statusOptions }),
        sort: f.select({
          label: 'Sort',
          valueType: 'string',
          options: [{ label: 'Date', value: 'date' }],
          defaultValue: 'date'
        }),
        // @ts-expect-error — `search?: string` excludes null, so a declared filter needs a default
        search: f.text({ label: 'Search' })
      });

    expectTypeOf(useMissingDefault).toBeFunction();
    expectTypeOf(useOptionalNonNullNoDefault).toBeFunction();
  });

  it('applies the same contract to resolveFilterParams<P> and defineFilters<P>', () => {
    const contractConfigs = {
      status: f.select({ label: 'Status', valueType: 'string', options: statusOptions }),
      sort: f.select({
        label: 'Sort',
        valueType: 'string',
        options: [{ label: 'Date', value: 'date' }],
        defaultValue: 'date'
      })
    };

    // resolveFilterParams<P>: params typed exactly like P, contract enforced.
    const loaderParams = resolveFilterParams<ContractParams>(contractConfigs, {});
    expectTypeOf(loaderParams.status).toEqualTypeOf<'closed' | 'open' | null>();
    expectTypeOf(loaderParams.sort).toEqualTypeOf<'date' | 'price'>();
    expectTypeOf(loaderParams.page).toEqualTypeOf<number>();
    // Runtime parity: non-null param resolves to its default.
    expect(loaderParams.sort).toBe('date');
    expect(loaderParams.status).toBe(null);

    const rejectsMissingDefault = () =>
      resolveFilterParams<ContractParams>(
        // @ts-expect-error — `sort` is required in ContractParams and missing here
        { status: f.select({ label: 'Status', valueType: 'string', options: statusOptions }) },
        {}
      );

    // defineFilters<P>: both the bound loader and hook return P-shaped params.
    const { defineFilters } = createFilters();
    const bound = defineFilters<ContractParams>(contractConfigs);
    const boundLoaderParams = bound.resolveFilterParams({});
    expectTypeOf(boundLoaderParams.status).toEqualTypeOf<'closed' | 'open' | null>();
    expectTypeOf(boundLoaderParams.sort).toEqualTypeOf<'date' | 'price'>();
    const useBound = () => {
      const { params } = bound.useFilters();
      expectTypeOf(params.status).toEqualTypeOf<'closed' | 'open' | null>();
      expectTypeOf(params.sort).toEqualTypeOf<'date' | 'price'>();
    };

    const rejectsBadDefine = () =>
      // @ts-expect-error — `sort` is required in ContractParams and missing here
      defineFilters<ContractParams>({
        status: f.select({ label: 'Status', valueType: 'string', options: statusOptions })
      });

    expectTypeOf(rejectsMissingDefault).toBeFunction();
    expectTypeOf(useBound).toBeFunction();
    expectTypeOf(rejectsBadDefine).toBeFunction();
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

describe('type inference — non-null params when a defaultValue is set', () => {
  it('drops `| null` for filters with a default, keeps it otherwise', () => {
    const { result } = renderHook(
      () =>
        useFilters({
          // no default -> nullable
          search: f.text({ label: 'Search' }),
          amount: f.number({ label: 'Amount' }),
          status: f.select({ label: 'Status', valueType: 'string', options: statusOptions }),
          // default set -> non-null
          q: f.text({ label: 'Q', defaultValue: '' }),
          page_size: f.number({ label: 'Size', defaultValue: 25 }),
          active: f.boolean({ label: 'Active', defaultValue: false }),
          sort: f.select({
            label: 'Sort',
            valueType: 'string',
            options: statusOptions,
            defaultValue: 'open'
          }),
          ids: f.multiSelect({ label: 'Ids', valueType: 'number', options: [], defaultValue: [] }),
          range: f.numberRange({ label: 'Range', defaultValue: [0, 10] })
        }),
      { wrapper }
    );
    const { params } = result.current;
    // nullable — no default
    expectTypeOf(params.search).toEqualTypeOf<string | null>();
    expectTypeOf(params.amount).toEqualTypeOf<number | null>();
    expectTypeOf(params.status).toEqualTypeOf<'closed' | 'open' | null>();
    // non-null — default provided
    expectTypeOf(params.q).toEqualTypeOf<string>();
    expectTypeOf(params.page_size).toEqualTypeOf<number>();
    expectTypeOf(params.active).toEqualTypeOf<boolean>();
    expectTypeOf(params.sort).toEqualTypeOf<'closed' | 'open'>();
    expectTypeOf(params.ids).toEqualTypeOf<number[]>();
    expectTypeOf(params.range).toEqualTypeOf<[number, number]>();

    // Runtime: a defaulted filter is never null — it starts at its default.
    expect(params.page_size).toBe(25);
    expect(params.active).toBe(false);
    expect(params.sort).toBe('open');
  });

  it('a defaulted filter is still clearable — onChange accepts null', () => {
    const { result } = renderHook(
      () =>
        useFilters({
          sort: f.select({
            label: 'Sort',
            valueType: 'string',
            options: statusOptions,
            defaultValue: 'open'
          })
        }),
      { wrapper }
    );
    const sort = result.current.filterMap.sort;
    // value/committedValue are non-null (never null with a default)…
    expectTypeOf(sort.value).toEqualTypeOf<'closed' | 'open'>();
    expectTypeOf(sort.committedValue).toEqualTypeOf<'closed' | 'open'>();
    // …but onChange still takes null, to reset back to the default.
    expectTypeOf(sort.onChange).parameter(0).toEqualTypeOf<'closed' | 'open' | null>();
  });
});

describe('ResolvedFilter ↔ ResolvedFilterBase tie', () => {
  it('every resolved variant carries the kind-independent base fields', () => {
    // Locks `ResolvedFilter` to the internal `ResolvedFilterBase` contract so a
    // dropped handler/flag can't slip through. Scoped to the kind-independent
    // fields; `value`/`committedValue`/`onChange` narrow per variant (pinned above).
    type UniformFields = Omit<ResolvedFilterBase, 'committedValue' | 'onChange' | 'value'>;
    type EveryVariantCarriesUniform = ResolvedFilter extends UniformFields ? true : false;
    expectTypeOf<EveryVariantCarriesUniform>().toEqualTypeOf<true>();
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
      q?: string | null;
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
      // paramsStr flows through from UseFiltersReturn (config-independent).
      expectTypeOf(r.paramsStr).toEqualTypeOf<string>();
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

describe('type checking — listeners (onParamsChange context)', () => {
  it('types params, prev, cause, and api from the config', () => {
    const useConfigured = () =>
      useFilters(
        {
          search: f.text({ label: 'Search' }),
          status: f.select({ label: 'Status', valueType: 'string', options: statusOptions })
        },
        {
          listeners: {
            onParamsChange: (ctx) => {
              // params/prev typed per config (+ pagination).
              expectTypeOf(ctx.params.search).toEqualTypeOf<string | null>();
              expectTypeOf(ctx.params.status).toEqualTypeOf<'closed' | 'open' | null>();
              expectTypeOf(ctx.prev.page).toEqualTypeOf<number>();
              // cause is the closed union.
              expectTypeOf(ctx.cause).toEqualTypeOf<'change' | 'external' | 'reset'>();
              // api is the live, fully-typed return — setFilter is callable here.
              expectTypeOf(ctx.api.paramsStr).toEqualTypeOf<string>();
              ctx.api.setFilter('status', 'open');
            }
          }
        }
      );
    expectTypeOf(useConfigured).toBeFunction();
  });
});
