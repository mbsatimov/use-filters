import { act, renderHook } from '@testing-library/react';
import { withNuqsTestingAdapter } from 'nuqs/adapters/testing';
import { describe, expect, expectTypeOf, it } from 'vitest';

import { createFilters } from '../src/create-filters';

describe('defineFilters — arraySeparator parity', () => {
  const { defineFilters, f } = createFilters();
  const loanFilters = defineFilters({ tags: f.tags({ label: 'Tags' }) }, { arraySeparator: '|' });

  it("useFilters and resolveFilterParams parse the same URL to the same value — can't drift", () => {
    const { result } = renderHook(() => loanFilters.useFilters(), {
      wrapper: withNuqsTestingAdapter({ hasMemory: true, searchParams: '?tags=a|b|c' })
    });
    expect(result.current.params.tags).toEqual(['a', 'b', 'c']);

    const loaderParams = loanFilters.resolveFilterParams('?tags=a|b|c');
    expect(loaderParams.tags).toEqual(['a', 'b', 'c']);

    // Same object shape from both — the actual guarantee this exists for.
    expect(result.current.params).toMatchObject(loaderParams);
  });

  it('actually writes the bound separator into the URL, not the default comma', async () => {
    let currentSearch = '';
    const { result } = renderHook(() => loanFilters.useFilters(), {
      wrapper: withNuqsTestingAdapter({
        hasMemory: true,
        onUrlUpdate: (event) => {
          currentSearch = event.queryString;
        }
      })
    });

    await act(async () => {
      result.current.filterMap.tags.onChange(['x', 'y']);
      await new Promise((r) => setTimeout(r, 0));
    });

    expect(currentSearch).toBe('?tags=x|y');
  });
});

describe('defineFilters — pagination parity', () => {
  const { defineFilters, f } = createFilters();
  const filters = defineFilters(
    { q: f.text({ label: 'Q' }) },
    { pagination: { resetPageOnFilterChange: false } }
  );

  it('the hook honors the bound pagination override', () => {
    const { result } = renderHook(() => filters.useFilters(), {
      wrapper: withNuqsTestingAdapter({ hasMemory: true, searchParams: '?page=3' })
    });

    act(() => {
      result.current.filterMap.q.onChange('acme');
    });
    expect(result.current.params.page).toBe(3);
  });

  it('resolveFilterParams honors the same bound pagination override', () => {
    const params = filters.resolveFilterParams('?page=3');
    expect(params.page).toBe(3);
  });
});

describe('defineFilters — hook-only options stay per-call', () => {
  const { defineFilters, f } = createFilters();
  const filters = defineFilters({
    status: f.select({ label: 'Status', options: [{ label: 'A', value: 'a' }], commit: 'manual' })
  });

  it('useFilters still accepts defaultCommit without affecting resolveFilterParams', () => {
    const { result } = renderHook(() => filters.useFilters({ defaultCommit: 'manual' }), {
      wrapper: withNuqsTestingAdapter({ hasMemory: true })
    });
    expect(result.current.isDirty).toBe(false);

    // resolveFilterParams has no defaultCommit concept — same params regardless.
    const params = filters.resolveFilterParams('');
    expect(params.status).toBeNull();
  });
});

describe('defineFilters — type inference', () => {
  const { defineFilters, f } = createFilters();

  it('useFilters and resolveFilterParams infer the same params shape', () => {
    const filters = defineFilters({
      search: f.text({ label: 'Search' }),
      status: f.select({
        label: 'Status',
        options: [
          { label: 'Open', value: 'open' },
          { label: 'Closed', value: 'closed' }
        ] as const
      })
    });

    const { result } = renderHook(() => filters.useFilters(), {
      wrapper: withNuqsTestingAdapter({ hasMemory: true })
    });
    expectTypeOf(result.current.params.status).toEqualTypeOf<'closed' | 'open' | null>();

    const loaderParams = filters.resolveFilterParams('');
    expectTypeOf(loaderParams.status).toEqualTypeOf<'closed' | 'open' | null>();
    expectTypeOf(loaderParams.search).toEqualTypeOf<string | null>();
  });
});
