import { act } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { f, renderFilters } from './helpers';

describe('per-filter mode flags', () => {
  it('instant: isInstant true, the others false, debounceMs null', () => {
    const { result } = renderFilters({ search: f.text({ label: 'Search' }) });
    const filter = result.current.filterMap.search;

    expect(filter.commit).toBe('instant');
    expect(filter.isInstant).toBe(true);
    expect(filter.isManual).toBe(false);
    expect(filter.isDebounced).toBe(false);
    expect(filter.debounceMs).toBeNull();
  });

  it('debounce: isDebounced true and debounceMs echoes the configured delay', () => {
    const { result } = renderFilters({
      search: f.text({ label: 'Search', commit: { debounce: 250 } })
    });
    const filter = result.current.filterMap.search;

    expect(filter.commit).toEqual({ debounce: 250 });
    expect(filter.isInstant).toBe(false);
    expect(filter.isManual).toBe(false);
    expect(filter.isDebounced).toBe(true);
    expect(filter.debounceMs).toBe(250);
  });

  it('manual: isManual true, debounceMs null', () => {
    const { result } = renderFilters({
      search: f.text({ label: 'Search', commit: 'manual' })
    });
    const filter = result.current.filterMap.search;

    expect(filter.commit).toBe('manual');
    expect(filter.isInstant).toBe(false);
    expect(filter.isManual).toBe(true);
    expect(filter.isDebounced).toBe(false);
    expect(filter.debounceMs).toBeNull();
  });
});

describe('per-filter committedValue vs value', () => {
  it('instant: committedValue tracks value on every change (never lags)', () => {
    const { result } = renderFilters({ search: f.text({ label: 'Search' }) });

    act(() => {
      result.current.filterMap.search.onChange('acme');
    });

    expect(result.current.filterMap.search.value).toBe('acme');
    expect(result.current.filterMap.search.committedValue).toBe('acme');
    expect(result.current.filterMap.search.isDirty).toBe(false);
  });

  it('manual: committedValue lags value until apply(), then catches up', () => {
    const { result } = renderFilters({
      search: f.text({ label: 'Search', commit: 'manual' })
    });

    act(() => {
      result.current.filterMap.search.onChange('acme');
    });

    let filter = result.current.filterMap.search;
    expect(filter.value).toBe('acme');
    expect(filter.committedValue).toBeNull();
    expect(filter.isDirty).toBe(true);

    act(() => {
      result.current.apply();
    });

    filter = result.current.filterMap.search;
    expect(filter.value).toBe('acme');
    expect(filter.committedValue).toBe('acme');
    expect(filter.isDirty).toBe(false);
  });

  it('manual: cancel() reverts value back to committedValue', () => {
    const { result } = renderFilters({
      search: f.text({ label: 'Search', commit: 'manual' })
    });

    act(() => {
      result.current.filterMap.search.onChange('acme');
    });
    act(() => {
      result.current.cancel();
    });

    const filter = result.current.filterMap.search;
    expect(filter.value).toBeNull();
    expect(filter.committedValue).toBeNull();
    expect(filter.isDirty).toBe(false);
  });

  it('debounce: committedValue lags value until the timer elapses', () => {
    vi.useFakeTimers();
    const { result } = renderFilters({
      search: f.text({ label: 'Search', commit: { debounce: 300 } })
    });

    act(() => {
      result.current.filterMap.search.onChange('acme');
    });

    let filter = result.current.filterMap.search;
    expect(filter.value).toBe('acme');
    expect(filter.committedValue).toBeNull();
    expect(filter.isDirty).toBe(true);

    act(() => {
      vi.advanceTimersByTime(300);
    });

    filter = result.current.filterMap.search;
    expect(filter.committedValue).toBe('acme');
    expect(filter.isDirty).toBe(false);
    vi.useRealTimers();
  });
});

describe('per-filter isFiltered', () => {
  it('reflects the committed value against defaultValue, not the draft', () => {
    const { result } = renderFilters({
      status: f.select({
        label: 'Status',
        valueType: 'string',
        commit: 'manual',
        defaultValue: 'open',
        options: [
          { label: 'Open', value: 'open' },
          { label: 'Closed', value: 'closed' }
        ]
      })
    });

    expect(result.current.filterMap.status.isFiltered).toBe(false); // sitting at default

    act(() => {
      result.current.filterMap.status.onChange('closed');
    });
    // Draft changed, but nothing is committed yet — still not "filtered".
    expect(result.current.filterMap.status.isDirty).toBe(true);
    expect(result.current.filterMap.status.isFiltered).toBe(false);

    act(() => {
      result.current.apply();
    });
    expect(result.current.filterMap.status.isFiltered).toBe(true);
  });

  it('with no defaultValue, any non-empty committed value counts as filtered', () => {
    const { result } = renderFilters({ search: f.text({ label: 'Search' }) });

    expect(result.current.filterMap.search.isFiltered).toBe(false);
    act(() => {
      result.current.filterMap.search.onChange('acme');
    });
    expect(result.current.filterMap.search.isFiltered).toBe(true);
  });

  it("doesn't exclude hidden filters (unlike the hook-wide isFiltered)", () => {
    const { result } = renderFilters({
      search: f.text({ label: 'Search', hidden: true })
    });

    act(() => {
      result.current.filterMap.search.onChange('acme');
    });

    // Hook-wide isFiltered skips hidden filters…
    expect(result.current.isFiltered).toBe(false);
    // …but the filter's own isFiltered still reports its real state.
    expect(result.current.filterMap.search.isFiltered).toBe(true);
  });
});

describe('per-filter isFilteredDraft (reacts to the draft, not the commit)', () => {
  it('manual: clearing hides isFilteredDraft immediately, before apply() commits it', () => {
    const { result } = renderFilters({
      status: f.select({
        label: 'Status',
        valueType: 'string',
        commit: 'manual',
        options: [
          { label: 'Open', value: 'open' },
          { label: 'Closed', value: 'closed' }
        ]
      })
    });

    // Select and apply, so the filter starts genuinely active.
    act(() => {
      result.current.filterMap.status.onChange('open');
    });
    act(() => {
      result.current.apply();
    });
    expect(result.current.filterMap.status.isFiltered).toBe(true);
    expect(result.current.filterMap.status.isFilteredDraft).toBe(true);

    // Clicking "Clear" updates the draft instantly — a UI gating a Clear
    // button on isFilteredDraft can hide it right away, unlike isFiltered
    // (which still reflects the committed 'open' until apply()).
    act(() => {
      result.current.filterMap.status.reset();
    });
    expect(result.current.filterMap.status.isFiltered).toBe(true); // still committed
    expect(result.current.filterMap.status.isFilteredDraft).toBe(false); // draft is clear

    act(() => {
      result.current.apply();
    });
    expect(result.current.filterMap.status.isFiltered).toBe(false);
    expect(result.current.filterMap.status.isFilteredDraft).toBe(false);
  });

  it('debounce: matches isFiltered once instant (no pending change)', () => {
    const { result } = renderFilters({
      search: f.text({ label: 'Search', commit: { debounce: 300 } })
    });

    expect(result.current.filterMap.search.isFiltered).toBe(false);
    expect(result.current.filterMap.search.isFilteredDraft).toBe(false);
  });
});

describe('per-filter isDirty and the hook-wide isDirty', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('only the changed filter reports isDirty, but the hook-wide flag covers the whole set', () => {
    const { result } = renderFilters({
      search: f.text({ label: 'Search', commit: 'manual' }),
      status: f.select({
        label: 'Status',
        valueType: 'string',
        commit: 'manual',
        options: [{ label: 'Open', value: 'open' }]
      })
    });

    act(() => {
      result.current.filterMap.search.onChange('acme');
    });

    expect(result.current.filterMap.search.isDirty).toBe(true);
    expect(result.current.filterMap.status.isDirty).toBe(false);
    expect(result.current.isDirty).toBe(true);
  });
});

describe('per-filter reset', () => {
  it('reset respects the commit mode — a manual filter stays a draft until apply()', () => {
    const { result } = renderFilters({
      status: f.select({
        label: 'Status',
        valueType: 'string',
        commit: 'manual',
        defaultValue: 'open',
        options: [
          { label: 'Open', value: 'open' },
          { label: 'Closed', value: 'closed' }
        ]
      })
    });

    act(() => {
      result.current.filterMap.status.onChange('closed');
    });
    act(() => {
      result.current.apply();
    });
    expect(result.current.params.status).toBe('closed');

    act(() => {
      result.current.filterMap.status.reset();
    });
    // Draft reverts to the default instantly…
    expect(result.current.filterMap.status.value).toBe('open');
    // …but nothing is committed until apply() — same as any manual change.
    expect(result.current.params.status).toBe('closed');
    expect(result.current.filterMap.status.isDirty).toBe(true);

    act(() => {
      result.current.apply();
    });
    expect(result.current.params.status).toBe('open');
  });
});

describe('per-filter instantReset (bypasses commit mode)', () => {
  it('commits the default immediately on a manual filter, no apply() needed', () => {
    const { result } = renderFilters({
      status: f.select({
        label: 'Status',
        valueType: 'string',
        commit: 'manual',
        defaultValue: 'open',
        options: [
          { label: 'Open', value: 'open' },
          { label: 'Closed', value: 'closed' }
        ]
      })
    });

    act(() => {
      result.current.filterMap.status.onChange('closed');
    });
    act(() => {
      result.current.apply();
    });
    expect(result.current.params.status).toBe('closed');

    act(() => {
      result.current.filterMap.status.instantReset();
    });

    // Unlike reset(), this commits straight away — no apply() needed.
    expect(result.current.filterMap.status.value).toBe('open');
    expect(result.current.params.status).toBe('open');
    expect(result.current.filterMap.status.isDirty).toBe(false);
  });

  it('cancels a pending debounce timer instead of letting it fire later', () => {
    vi.useFakeTimers();
    const { result } = renderFilters({
      search: f.text({ label: 'Search', commit: { debounce: 5000 } })
    });

    act(() => {
      result.current.filterMap.search.onChange('acme');
    });
    expect(result.current.filterMap.search.isDirty).toBe(true);

    act(() => {
      result.current.filterMap.search.instantReset();
    });
    expect(result.current.params.search).toBeNull();
    expect(result.current.filterMap.search.isDirty).toBe(false);

    act(() => {
      vi.advanceTimersByTime(5000);
    });
    // The cancelled timer must not fire a stale "acme" commit afterwards.
    expect(result.current.params.search).toBeNull();
    vi.useRealTimers();
  });

  it("doesn't affect other filters' pending changes", () => {
    const { result } = renderFilters({
      search: f.text({ label: 'Search', commit: 'manual' }),
      status: f.select({
        label: 'Status',
        valueType: 'string',
        commit: 'manual',
        options: [{ label: 'Open', value: 'open' }]
      })
    });

    act(() => {
      result.current.filterMap.search.onChange('acme');
      result.current.filterMap.status.onChange('open');
    });

    act(() => {
      result.current.filterMap.search.instantReset();
    });

    expect(result.current.params.search).toBeNull();
    expect(result.current.filterMap.search.isDirty).toBe(false);
    // status is untouched — still pending.
    expect(result.current.filterMap.status.value).toBe('open');
    expect(result.current.filterMap.status.isDirty).toBe(true);
  });
});

describe('per-filter apply/cancel', () => {
  it('apply() on one filter commits only that filter, leaving others pending', () => {
    const { result } = renderFilters({
      search: f.text({ label: 'Search', commit: 'manual' }),
      status: f.select({
        label: 'Status',
        valueType: 'string',
        commit: 'manual',
        options: [{ label: 'Open', value: 'open' }]
      })
    });

    act(() => {
      result.current.filterMap.search.onChange('acme');
      result.current.filterMap.status.onChange('open');
    });
    expect(result.current.isDirty).toBe(true);

    act(() => {
      result.current.filterMap.search.apply();
    });

    expect(result.current.params.search).toBe('acme');
    expect(result.current.filterMap.search.isDirty).toBe(false);
    // The other filter is untouched — still pending.
    expect(result.current.params.status).toBeNull();
    expect(result.current.filterMap.status.isDirty).toBe(true);
    expect(result.current.isDirty).toBe(true); // hook-wide still dirty because of status
  });

  it('cancel() on one filter discards only that filter', () => {
    const { result } = renderFilters({
      search: f.text({ label: 'Search', commit: 'manual' }),
      status: f.select({
        label: 'Status',
        valueType: 'string',
        commit: 'manual',
        options: [{ label: 'Open', value: 'open' }]
      })
    });

    act(() => {
      result.current.filterMap.search.onChange('acme');
      result.current.filterMap.status.onChange('open');
    });

    act(() => {
      result.current.filterMap.search.cancel();
    });

    expect(result.current.filterMap.search.value).toBeNull();
    expect(result.current.filterMap.search.isDirty).toBe(false);
    // status is still pending — untouched by search's cancel().
    expect(result.current.filterMap.status.value).toBe('open');
    expect(result.current.filterMap.status.isDirty).toBe(true);
  });

  it('apply()/cancel() are no-ops when the filter has nothing pending', () => {
    const { result } = renderFilters({
      search: f.text({ label: 'Search', commit: 'manual' })
    });

    act(() => {
      result.current.filterMap.search.apply();
      result.current.filterMap.search.cancel();
    });

    expect(result.current.params.search).toBeNull();
    expect(result.current.isDirty).toBe(false);
  });

  it('apply() on a debounced filter flushes it immediately and cancels the timer', () => {
    vi.useFakeTimers();
    const { result } = renderFilters({
      search: f.text({ label: 'Search', commit: { debounce: 5000 } })
    });

    act(() => {
      result.current.filterMap.search.onChange('acme');
    });
    act(() => {
      result.current.filterMap.search.apply();
    });
    expect(result.current.params.search).toBe('acme');

    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(result.current.params.search).toBe('acme'); // no stale second commit
    vi.useRealTimers();
  });
});

describe('whole-set reset() — respects commit modes', () => {
  it('clears instant filters immediately and stages manual ones until apply()', () => {
    const { result } = renderFilters({
      search: f.text({ label: 'Search' }), // instant
      status: f.select({
        label: 'Status',
        valueType: 'string',
        commit: 'manual',
        options: [{ label: 'Open', value: 'open' }]
      })
    });

    act(() => {
      result.current.filterMap.search.onChange('acme');
    });
    act(() => {
      result.current.filterMap.status.onChange('open');
    });
    act(() => {
      result.current.apply();
    });
    expect(result.current.params).toMatchObject({ search: 'acme', status: 'open' });

    act(() => {
      result.current.reset();
    });
    // The instant filter cleared straight through; the manual one is a staged
    // draft — its control shows empty, but the committed value awaits apply().
    expect(result.current.params.search).toBeNull();
    expect(result.current.params.status).toBe('open');
    expect(result.current.filterMap.status.value).toBeNull();
    expect(result.current.filterMap.status.isDirty).toBe(true);

    act(() => {
      result.current.apply();
    });
    expect(result.current.params.status).toBeNull();
  });

  it('drops a pending draft instead of going dirty when already at the default', () => {
    const { result } = renderFilters({
      status: f.select({
        label: 'Status',
        valueType: 'string',
        commit: 'manual',
        options: [{ label: 'Open', value: 'open' }]
      })
    });

    // Stage a draft, then reset() — the draft is discarded (committed value is
    // already the default), so nothing stays dirty and nothing needs apply().
    act(() => {
      result.current.filterMap.status.onChange('open');
    });
    expect(result.current.isDirty).toBe(true);

    act(() => {
      result.current.reset();
    });
    expect(result.current.isDirty).toBe(false);
    expect(result.current.params.status).toBeNull();
  });
});

describe('whole-set instantReset() — bypasses commit modes', () => {
  it('clears a manual filter straight to the URL, no apply() needed', () => {
    const { result } = renderFilters({
      status: f.select({
        label: 'Status',
        valueType: 'string',
        commit: 'manual',
        options: [{ label: 'Open', value: 'open' }]
      })
    });

    act(() => {
      result.current.filterMap.status.onChange('open');
    });
    act(() => {
      result.current.apply();
    });
    expect(result.current.params.status).toBe('open');

    act(() => {
      result.current.instantReset();
    });
    expect(result.current.params.status).toBeNull();
    expect(result.current.isDirty).toBe(false);
  });

  it('cancels pending debounce timers so no stale commit fires later', () => {
    vi.useFakeTimers();
    const { result } = renderFilters({
      search: f.text({ label: 'Search', commit: { debounce: 5000 } })
    });

    act(() => {
      result.current.filterMap.search.onChange('acme');
    });
    expect(result.current.isDirty).toBe(true);

    act(() => {
      result.current.instantReset();
    });
    expect(result.current.isDirty).toBe(false);

    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(result.current.params.search).toBeNull();
    vi.useRealTimers();
  });
});
