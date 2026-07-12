import { act, renderHook } from '@testing-library/react';
import { withNuqsTestingAdapter } from 'nuqs/adapters/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { FiltersFor } from '../src/types';

import { createFilters } from '../src/create-filters';

const { useFilters, f } = createFilters();

const wrapper = withNuqsTestingAdapter({ hasMemory: true });

/** See `renderFilters` in `use-filters.test.tsx` for why `const T` is preserved. */
function renderCommit<const T extends FiltersFor<never>>(configs: T) {
  return renderHook(() => useFilters<never, T>(configs), { wrapper });
}

describe('commit: instant (default)', () => {
  it('writes to params immediately and never goes dirty', () => {
    const { result } = renderCommit({ search: f.text({ label: 'Search' }) });

    act(() => {
      result.current.filterMap.search.onChange('acme');
    });

    expect(result.current.params.search).toBe('acme');
    expect(result.current.isDirty).toBe(false);
  });
});

describe('commit: debounce', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('shows the value instantly but delays params until the debounce elapses', () => {
    const { result } = renderCommit({
      search: f.text({ label: 'Search', commit: { debounce: 300 } })
    });

    act(() => {
      result.current.filterMap.search.onChange('acme');
    });

    // Control reflects the change right away; params/URL do not yet.
    expect(result.current.filterMap.search.value).toBe('acme');
    expect(result.current.params.search).toBeNull();
    expect(result.current.isDirty).toBe(true);

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(result.current.params.search).toBe('acme');
    expect(result.current.isDirty).toBe(false);
  });

  it('resets the timer on every keystroke', () => {
    const { result } = renderCommit({
      search: f.text({ label: 'Search', commit: { debounce: 300 } })
    });

    act(() => {
      result.current.filterMap.search.onChange('a');
    });
    act(() => {
      vi.advanceTimersByTime(200);
    });
    act(() => {
      result.current.filterMap.search.onChange('ac');
    });
    act(() => {
      vi.advanceTimersByTime(200);
    });
    // 400ms total elapsed, but only 200ms since the last change — not committed.
    expect(result.current.params.search).toBeNull();

    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(result.current.params.search).toBe('ac');
  });
});

describe('commit: manual (apply / cancel)', () => {
  it('holds every change until apply()', () => {
    const { result } = renderCommit({
      search: f.text({ label: 'Search', commit: 'manual' }),
      status: f.select({
        label: 'Status',
        commit: 'manual',
        options: [
          { label: 'Open', value: 'open' },
          { label: 'Closed', value: 'closed' }
        ]
      })
    });

    act(() => {
      result.current.filterMap.search.onChange('acme');
      result.current.filterMap.status.onChange('open');
    });

    expect(result.current.filterMap.search.value).toBe('acme');
    expect(result.current.filterMap.status.value).toBe('open');
    expect(result.current.filterMap.status.selectedOption).toEqual({
      label: 'Open',
      value: 'open'
    });
    expect(result.current.params.search).toBeNull();
    expect(result.current.params.status).toBeNull();
    expect(result.current.isDirty).toBe(true);

    act(() => {
      result.current.apply();
    });

    expect(result.current.params.search).toBe('acme');
    expect(result.current.params.status).toBe('open');
    expect(result.current.isDirty).toBe(false);
  });

  it('cancel() discards pending changes and reverts the displayed value', () => {
    const { result } = renderCommit({
      search: f.text({ label: 'Search', commit: 'manual' })
    });

    act(() => {
      result.current.filterMap.search.onChange('acme');
    });
    expect(result.current.filterMap.search.value).toBe('acme');

    act(() => {
      result.current.cancel();
    });

    expect(result.current.filterMap.search.value).toBeNull();
    expect(result.current.params.search).toBeNull();
    expect(result.current.isDirty).toBe(false);
  });

  it('apply() flushes a pending debounce and stops its timer firing twice', () => {
    vi.useFakeTimers();
    const { result } = renderCommit({
      search: f.text({ label: 'Search', commit: { debounce: 5000 } })
    });

    act(() => {
      result.current.filterMap.search.onChange('acme');
    });
    expect(result.current.params.search).toBeNull();

    act(() => {
      result.current.apply();
    });
    expect(result.current.params.search).toBe('acme');

    // The original 5s timer must not fire a stale second commit.
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(result.current.params.search).toBe('acme');
    vi.useRealTimers();
  });
});

describe('commit: manual + async multiSelect', () => {
  it('accumulates toggles against the draft, committing on apply()', () => {
    const { result } = renderCommit({
      tags: f.asyncMultiSelect({
        label: 'Tags',
        commit: 'manual',
        valueType: 'string',
        loadOptions: async () => []
      })
    });

    act(() => {
      result.current.filterMap.tags.onToggleOption({ label: 'A', value: 'a' });
    });
    act(() => {
      result.current.filterMap.tags.onToggleOption({ label: 'B', value: 'b' });
    });

    expect(result.current.filterMap.tags.value).toEqual(['a', 'b']);
    expect(result.current.params.tags).toBeNull();

    act(() => {
      result.current.apply();
    });
    expect(result.current.params.tags).toEqual(['a', 'b']);
  });
});

describe('setFilter bypasses the draft layer', () => {
  it('commits immediately even for a manual-commit filter', () => {
    const { result } = renderCommit({
      search: f.text({ label: 'Search', commit: 'manual' })
    });

    act(() => {
      result.current.setFilter('search', 'acme');
    });

    expect(result.current.params.search).toBe('acme');
    expect(result.current.isDirty).toBe(false);
  });
});

describe('default commit mode precedence', () => {
  it('createFilters({ defaultCommit }) sets the default for every filter', () => {
    const cf = createFilters({ defaultCommit: 'manual' });
    const { result } = renderHook(() => cf.useFilters({ search: cf.f.text({ label: 'Search' }) }), {
      wrapper
    });

    // No per-filter commit, but the factory default is manual → held.
    expect(result.current.filterMap.search.commit).toBe('manual');
    act(() => {
      result.current.filterMap.search.onChange('acme');
    });
    expect(result.current.filterMap.search.value).toBe('acme');
    expect(result.current.params.search).toBeNull();
    expect(result.current.isDirty).toBe(true);

    act(() => {
      result.current.apply();
    });
    expect(result.current.params.search).toBe('acme');
  });

  it('useFilters `defaultCommit` option overrides the factory default', () => {
    const cf = createFilters({ defaultCommit: 'manual' });
    const { result } = renderHook(
      () => cf.useFilters({ search: cf.f.text({ label: 'Search' }) }, { defaultCommit: 'instant' }),
      { wrapper }
    );

    expect(result.current.filterMap.search.commit).toBe('instant');
    act(() => {
      result.current.filterMap.search.onChange('acme');
    });
    // Instant wins → committed immediately, nothing pending.
    expect(result.current.params.search).toBe('acme');
    expect(result.current.isDirty).toBe(false);
  });

  it('a per-filter `commit` overrides the useFilters option', () => {
    const cf = createFilters();
    const { result } = renderHook(
      () =>
        cf.useFilters(
          {
            held: cf.f.text({ label: 'Held' }),
            live: cf.f.text({ label: 'Live', commit: 'instant' })
          },
          { defaultCommit: 'manual' }
        ),
      { wrapper }
    );

    // `held` inherits the call's manual default; `live` overrides back to instant.
    expect(result.current.filterMap.held.commit).toBe('manual');
    expect(result.current.filterMap.live.commit).toBe('instant');

    act(() => {
      result.current.filterMap.held.onChange('x');
      result.current.filterMap.live.onChange('y');
    });

    expect(result.current.params.held).toBeNull(); // manual — waiting for apply()
    expect(result.current.params.live).toBe('y'); // instant — already committed
    expect(result.current.isDirty).toBe(true);
  });
});
