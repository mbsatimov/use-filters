import { act, renderHook } from '@testing-library/react';
import { withNuqsTestingAdapter } from 'nuqs/adapters/testing';
import { describe, expect, it } from 'vitest';

import type { FiltersFor } from '../src/types';
import type { UseFiltersOptions } from '../src/use-filters';

import { createFilters } from '../src/create-filters';

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

describe('useFilters — params & pagination', () => {
  it('starts with null filter values and default pagination', () => {
    const { result } = renderFilters({
      search: f.text({ label: 'Search' }),
      status: f.select({ label: 'Status', options: [{ label: 'Open', value: 'open' }] })
    });
    expect(result.current.params).toMatchObject({
      search: null,
      status: null,
      limit: 10,
      offset: 0
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

  it('resets to the first page on filter change', () => {
    const { result } = renderFilters({ status: f.select({ label: 'S', options: [{ label: 'A', value: 'a' }] }) });

    act(() => {
      result.current.setFilter('status', 'a');
    });
    expect(result.current.params.offset).toBe(0);
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
