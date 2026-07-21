import { act, renderHook } from '@testing-library/react';
import { parseAsInteger, useQueryState } from 'nuqs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { f, renderFilters, useFilters, wrapper } from './helpers';

const statusOptions = [
  { label: 'Open', value: 'open' },
  { label: 'Closed', value: 'closed' }
] as const;

describe('listeners — onParamsChange', () => {
  it('does not fire on mount', () => {
    const onParamsChange = vi.fn();
    renderFilters({ search: f.text({ label: 'Search' }) }, { listeners: { onParamsChange } });
    expect(onParamsChange).not.toHaveBeenCalled();
  });

  it('fires on a committed change with params, prev, cause and api', () => {
    const onParamsChange = vi.fn();
    const { result } = renderFilters(
      { search: f.text({ label: 'Search' }) },
      { listeners: { onParamsChange } }
    );

    act(() => result.current.filterMap.search.onChange('acme'));

    expect(onParamsChange).toHaveBeenCalledTimes(1);
    const ctx = onParamsChange.mock.calls[0][0];
    expect(ctx.cause).toBe('change');
    expect(ctx.params).toMatchObject({ search: 'acme' });
    expect(ctx.prev).toMatchObject({ search: null });
    // `api` is the live hook return — read state and call methods from it.
    expect(ctx.api.isFiltered).toBe(true);
    expect(typeof ctx.api.setFilter).toBe('function');
  });

  it('reports cause "change" for value changes and "reset" for resets', () => {
    const onParamsChange = vi.fn();
    const { result } = renderFilters(
      { status: f.select({ label: 'Status', valueType: 'string', options: statusOptions }) },
      { listeners: { onParamsChange } }
    );

    // A value change — whether via setFilter or onChange — is 'change'.
    act(() => result.current.setFilter('status', 'open'));
    expect(onParamsChange.mock.calls.at(-1)?.[0].cause).toBe('change');

    // reset() and instantReset() both mean "cleared to defaults" — 'reset'.
    act(() => result.current.filterMap.status.reset());
    expect(onParamsChange.mock.calls.at(-1)?.[0].cause).toBe('reset');

    act(() => result.current.setFilter('status', 'closed'));
    act(() => result.current.instantReset());
    expect(onParamsChange.mock.calls.at(-1)?.[0].cause).toBe('reset');
  });

  it('does not fire on a draft change; fires with cause "change" on apply()', () => {
    const onParamsChange = vi.fn();
    const { result } = renderFilters(
      { search: f.text({ label: 'Search', commit: 'manual' }) },
      { listeners: { onParamsChange } }
    );

    // Draft edit — nothing committed yet, so no event.
    act(() => result.current.filterMap.search.onChange('acme'));
    expect(onParamsChange).not.toHaveBeenCalled();

    act(() => result.current.apply());
    expect(onParamsChange).toHaveBeenCalledTimes(1);
    expect(onParamsChange.mock.calls[0][0].cause).toBe('change');
    expect(onParamsChange.mock.calls[0][0].params).toMatchObject({ search: 'acme' });
  });

  it('does not fire when a change resolves to the same committed value', () => {
    const onParamsChange = vi.fn();
    const { result } = renderFilters(
      { search: f.text({ label: 'Search' }) },
      { listeners: { onParamsChange } }
    );

    act(() => result.current.filterMap.search.onChange('acme'));
    onParamsChange.mockClear();
    // Re-setting the same value doesn't change params → no event.
    act(() => result.current.filterMap.search.onChange('acme'));
    expect(onParamsChange).not.toHaveBeenCalled();
  });
});

describe('listeners — pagination', () => {
  it('fires with cause "external" when the page changes via a URL write it does not own', () => {
    const onParamsChange = vi.fn();
    // The hook mirrors `page`/`per_page` into params but doesn't own a setter —
    // you page via your own URL state. Such a write is external to the hook.
    const { result } = renderHook(
      () => {
        const filters = useFilters(
          { search: f.text({ label: 'Search' }) },
          {
            listeners: { onParamsChange }
          }
        );
        const [, setPage] = useQueryState('page', parseAsInteger.withDefault(1));
        return { filters, setPage };
      },
      { wrapper }
    );

    act(() => void result.current.setPage(2));

    expect(onParamsChange).toHaveBeenCalledTimes(1);
    const ctx = onParamsChange.mock.calls[0][0];
    expect(ctx.cause).toBe('external');
    expect(ctx.params.page).toBe(2);
    expect(ctx.prev.page).toBe(1);
  });
});

describe('listeners — debounced commit reports cause "change"', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('fires once the debounce timer elapses, not on the draft edit', () => {
    const onParamsChange = vi.fn();
    const { result } = renderFilters(
      { search: f.text({ label: 'Search', commit: { debounce: 300 } }) },
      { listeners: { onParamsChange } }
    );

    act(() => result.current.filterMap.search.onChange('acme'));
    expect(onParamsChange).not.toHaveBeenCalled();

    act(() => vi.advanceTimersByTime(300));
    expect(onParamsChange).toHaveBeenCalledTimes(1);
    expect(onParamsChange.mock.calls[0][0].cause).toBe('change');
  });
});
