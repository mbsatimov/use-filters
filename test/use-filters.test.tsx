import { act, renderHook } from '@testing-library/react';
import { withNuqsTestingAdapter } from 'nuqs/adapters/testing';
import { describe, expect, it } from 'vitest';

import type { FiltersFor } from '../src/types';
import type { UseFiltersOptions } from '../src/use-filters';

import { createFilters } from '../src/create-filters';
import { toDateTimeValue } from '../src/lib';

const { useFilters, f } = createFilters();

/** In-memory nuqs adapter that persists updates across renders. */
const wrapper = withNuqsTestingAdapter({ hasMemory: true });

/**
 * Render `useFilters` while preserving per-config inference — `const T` keeps
 * the exact config shape so `filterMap` / `params` stay strongly typed
 * (a `Parameters<typeof useFilters>` helper collapses `T` to `{}`).
 */
function renderFilters<const T extends FiltersFor<never>>(configs: T, options?: UseFiltersOptions) {
  return renderHook(() => useFilters<never, T>(configs, options), { wrapper });
}

describe('useFilters — params', () => {
  it('starts with null filter values and default pagination', () => {
    const { result } = renderFilters({
      search: f.text({ label: 'Search' }),
      status: f.select({ label: 'Status', options: [{ label: 'Open', value: 'open' }] })
    });
    expect(result.current.params).toMatchObject({
      search: null,
      status: null,
      page: 1,
      per_page: 10
    });
    expect(result.current.isFiltered).toBe(false);
  });

  it('reflects a filter change and marks the set active', () => {
    const { result } = renderFilters({ search: f.text({ label: 'Search' }) });

    act(() => {
      result.current.filterMap.search.onChange('acme');
    });

    expect(result.current.params.search).toBe('acme');
    expect(result.current.isFiltered).toBe(true);
  });
});

describe('useFilters — pagination', () => {
  it('resets to the first page on filter change', () => {
    const { result } = renderFilters({
      status: f.select({ label: 'S', options: [{ label: 'A', value: 'a' }] })
    });

    act(() => {
      result.current.setFilter('status', 'a');
    });
    expect(result.current.params.page).toBe(1);
  });

  it('exposes params under the configured keys (renamed perPageKey)', () => {
    const renamed = createFilters({ pagination: { perPageKey: 'page_size', defaultPerPage: 25 } });
    const { result } = renderHook(
      () => renamed.useFilters({ search: renamed.f.text({ label: 'Search' }) }),
      { wrapper: withNuqsTestingAdapter({ hasMemory: true }) }
    );
    expect(result.current.params).toMatchObject({ page: 1, page_size: 25 });
    expect(result.current.params).not.toHaveProperty('per_page');
  });

  it('starts the first page at 0 for a 0-indexed API (firstPage)', () => {
    const zeroBased = createFilters({ pagination: { firstPage: 0 } });
    const { result } = renderHook(
      () => zeroBased.useFilters({ search: zeroBased.f.text({ label: 'Search' }) }),
      { wrapper: withNuqsTestingAdapter({ hasMemory: true }) }
    );
    expect(result.current.params.page).toBe(0);
  });

  it('per-call `pagination: { defaultPerPage }` overrides the factory default', () => {
    // Factory default is 10; this call overrides to 50.
    const { result } = renderFilters(
      { search: f.text({ label: 'Search' }) },
      { pagination: { defaultPerPage: 50 } }
    );
    expect(result.current.params.per_page).toBe(50);
  });

  it('`pagination: false` drops pagination from params for this call', () => {
    const { result } = renderFilters(
      { search: f.text({ label: 'Search' }) },
      { pagination: false }
    );
    expect(result.current.params).not.toHaveProperty('page');
    expect(result.current.params).not.toHaveProperty('per_page');
  });
});

describe('useFilters — reset & defaults', () => {
  it('reset returns every filter to its default (or null)', () => {
    const { result } = renderFilters({
      status: f.select({
        label: 'Status',
        options: [
          { label: 'Open', value: 'open' },
          { label: 'Closed', value: 'closed' }
        ],
        defaultValue: 'open'
      }),
      search: f.text({ label: 'Search' })
    });

    act(() => {
      result.current.filterMap.status.onChange('closed');
      result.current.filterMap.search.onChange('x');
    });
    expect(result.current.isFiltered).toBe(true);

    act(() => {
      result.current.reset();
    });
    expect(result.current.params.status).toBe('open');
    expect(result.current.params.search).toBeNull();
    expect(result.current.isFiltered).toBe(false);
  });
});

describe('useFilters — async label sidecar', () => {
  it('asyncSelect writes value and label together', () => {
    const { result } = renderFilters({
      customer_id: f.asyncSelect({
        label: 'Customer',
        loadOptions: async () => []
      })
    });

    act(() => {
      const filter = result.current.filterMap.customer_id;
      filter.onSelectOption({ value: 42, label: 'Acme Corp' });
    });

    expect(result.current.params.customer_id).toBe(42);
    expect(result.current.filterMap.customer_id.selectedOption).toEqual({
      value: 42,
      label: 'Acme Corp'
    });
  });

  it('asyncMultiSelect toggles keep value/label arrays paired', () => {
    const { result } = renderFilters({
      tags: f.asyncMultiSelect({
        label: 'Tags',
        valueType: 'string',
        loadOptions: async () => []
      })
    });

    act(() => {
      result.current.filterMap.tags.onToggleOption({ value: 'a', label: 'Alpha' });
    });
    act(() => {
      result.current.filterMap.tags.onToggleOption({ value: 'b', label: 'Beta' });
    });

    expect(result.current.params.tags).toEqual(['a', 'b']);
    expect(result.current.filterMap.tags.selectedOptions).toEqual([
      { value: 'a', label: 'Alpha' },
      { value: 'b', label: 'Beta' }
    ]);

    act(() => {
      result.current.filterMap.tags.onToggleOption({ value: 'a', label: 'Alpha' });
    });
    expect(result.current.params.tags).toEqual(['b']);
  });
});

describe('useFilters — static select resolves the full option', () => {
  it('exposes the selected option object', () => {
    const option = { label: 'Open', value: 'open' };
    const { result } = renderFilters({
      status: f.select({ label: 'Status', options: [option] })
    });

    act(() => {
      result.current.filterMap.status.onChange('open');
    });

    expect(result.current.filterMap.status.selectedOption).toEqual(option);
  });
});

describe('useFilters — datetime filters', () => {
  it('carries the precision hint through the resolved filter', () => {
    const { result } = renderFilters({
      starts_at: f.date({ label: 'Starts at', precision: 'datetime' })
    });
    expect(result.current.filterMap.starts_at.precision).toBe('datetime');
  });

  it('stores a datetime string like any other date filter', () => {
    const { result } = renderFilters({
      starts_at: f.date({ label: 'Starts at', precision: 'datetime' })
    });

    const value = toDateTimeValue(new Date(2026, 0, 2, 9, 0, 0));
    act(() => {
      result.current.filterMap.starts_at.onChange(value);
    });

    expect(result.current.params.starts_at).toBe(value);
    expect(result.current.isFiltered).toBe(true);
  });

  it('supports a datetime range', () => {
    const { result } = renderFilters({
      window: f.dateRange({ label: 'Window', precision: 'datetime' })
    });

    const from = toDateTimeValue(new Date(2026, 0, 1, 0, 0, 0));
    const to = toDateTimeValue(new Date(2026, 0, 31, 23, 59, 59));
    act(() => {
      result.current.filterMap.window.onChange([from, to]);
    });

    expect(result.current.params.window).toEqual([from, to]);
  });
});

describe('useFilters — numberRange & tags filters', () => {
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

describe('useFilters — time & timeRange filters', () => {
  it('stores a time-of-day value', () => {
    const { result } = renderFilters({ opens_at: f.time({ label: 'Opens at' }) });

    act(() => {
      result.current.filterMap.opens_at.onChange('09:30');
    });

    expect(result.current.params.opens_at).toBe('09:30');
    expect(result.current.isFiltered).toBe(true);
  });

  it('stores a time range that wraps midnight', () => {
    const { result } = renderFilters({ shift: f.timeRange({ label: 'Shift' }) });

    act(() => {
      result.current.filterMap.shift.onChange(['22:00', '02:00']);
    });

    expect(result.current.params.shift).toEqual(['22:00', '02:00']);
    expect(result.current.isFiltered).toBe(true);
  });
});
