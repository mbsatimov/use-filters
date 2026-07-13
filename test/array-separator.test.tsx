import { act, renderHook } from '@testing-library/react';
import { withNuqsTestingAdapter } from 'nuqs/adapters/testing';
import { describe, expect, it } from 'vitest';

import { createFilters } from '../src/create-filters';

const wrapper = withNuqsTestingAdapter({ hasMemory: true });

describe('arraySeparator — default stays comma', () => {
  it('multiSelect joins/splits on "," when unset', () => {
    const { useFilters, f } = createFilters();
    const { result } = renderHook(
      () =>
        useFilters({
          tags: f.multiSelect({
            label: 'Tags',
            options: [
              { label: 'A', value: 'a' },
              { label: 'B', value: 'b' }
            ]
          })
        }),
      { wrapper }
    );

    act(() => {
      result.current.filterMap.tags.onChange(['a', 'b']);
    });

    expect(result.current.params.tags).toEqual(['a', 'b']);
  });
});

describe('arraySeparator — createFilters sets the factory default', () => {
  it('multiSelect, tags, and numberRange all split on the configured separator', () => {
    const { useFilters, f } = createFilters({ arraySeparator: '|' });
    const { result } = renderHook(
      () =>
        useFilters({
          tags: f.multiSelect({
            label: 'Tags',
            options: [
              { label: 'A', value: 'a' },
              { label: 'B', value: 'b' }
            ]
          }),
          keywords: f.tags({ label: 'Keywords' }),
          price: f.numberRange({ label: 'Price' })
        }),
      { wrapper }
    );

    act(() => {
      result.current.filterMap.tags.onChange(['a', 'b']);
      result.current.filterMap.keywords.onChange(['x', 'y']);
      result.current.filterMap.price.onChange([10, 20]);
    });

    expect(result.current.params.tags).toEqual(['a', 'b']);
    expect(result.current.params.keywords).toEqual(['x', 'y']);
    expect(result.current.params.price).toEqual([10, 20]);
  });

  it('actually writes the pipe into the URL, not a comma', async () => {
    const { useFilters, f } = createFilters({ arraySeparator: '|' });
    let currentSearch = '';
    const { result } = renderHook(
      () =>
        useFilters({
          tags: f.tags({ label: 'Tags' })
        }),
      {
        wrapper: withNuqsTestingAdapter({
          hasMemory: true,
          onUrlUpdate: (event) => {
            currentSearch = event.queryString;
          }
        })
      }
    );

    await act(async () => {
      result.current.filterMap.tags.onChange(['a', 'b', 'c']);
      // nuqs flushes the actual URL write on the next tick even for
      // `commit: 'instant'` filters (its own internal rate-limit queue).
      await new Promise((r) => setTimeout(r, 0));
    });

    expect(currentSearch).toBe('?tags=a|b|c');
    expect(currentSearch).not.toContain('a,b'); // not the default comma
  });
});

describe('arraySeparator — useFilters call overrides the factory default', () => {
  it("a call with its own arraySeparator ignores the factory's", () => {
    const { useFilters, f } = createFilters({ arraySeparator: '|' });
    const { result } = renderHook(
      () => useFilters({ tags: f.tags({ label: 'Tags' }) }, { arraySeparator: ';' }),
      { wrapper }
    );

    act(() => {
      result.current.filterMap.tags.onChange(['a', 'b']);
    });

    expect(result.current.params.tags).toEqual(['a', 'b']);
  });
});

describe('arraySeparator — async multiSelect label sidecar matches the value separator', () => {
  it('toggling options round-trips through a custom separator', () => {
    const { useFilters, f } = createFilters({ arraySeparator: '|' });
    const { result } = renderHook(
      () =>
        useFilters({
          owners: f.asyncMultiSelect({
            label: 'Owners',
            valueType: 'string',
            loadOptions: async () => []
          })
        }),
      { wrapper }
    );

    // Two separate `act()` calls, so a re-render happens between them — each
    // `onToggleOption` reads `selectedOptions` from the current render, so
    // batching both into one `act()` would have the second call toggle
    // against the same stale (empty) selection as the first.
    act(() => {
      result.current.filterMap.owners.onToggleOption({ label: 'Ann', value: 'ann' });
    });
    act(() => {
      result.current.filterMap.owners.onToggleOption({ label: 'Bo', value: 'bo' });
    });

    expect(result.current.params.owners).toEqual(['ann', 'bo']);
    expect(result.current.filterMap.owners.selectedOptions).toEqual([
      { label: 'Ann', value: 'ann' },
      { label: 'Bo', value: 'bo' }
    ]);
  });
});

describe('arraySeparator — resolveFilterParams matches the hook (query-key parity)', () => {
  it('parses a raw string with the factory arraySeparator', () => {
    const { resolveFilterParams, f } = createFilters({ arraySeparator: '|' });
    const configs = { tags: f.tags({ label: 'Tags' }), price: f.numberRange({ label: 'Price' }) };

    const params = resolveFilterParams(configs, { tags: 'a|b|c', price: '10|20' });

    expect(params.tags).toEqual(['a', 'b', 'c']);
    expect(params.price).toEqual([10, 20]);
  });

  it('a call-level arraySeparator overrides the factory default, same as useFilters', () => {
    const { resolveFilterParams, f } = createFilters({ arraySeparator: '|' });
    const configs = { tags: f.tags({ label: 'Tags' }) };

    const params = resolveFilterParams(configs, { tags: 'a;b' }, { arraySeparator: ';' });

    expect(params.tags).toEqual(['a', 'b']);
  });
});
