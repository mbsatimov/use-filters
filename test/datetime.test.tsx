import { act, renderHook } from '@testing-library/react';
import { withNuqsTestingAdapter } from 'nuqs/adapters/testing';
import { describe, expect, it } from 'vitest';

import type { FiltersFor } from '../src/types';
import type { UseFiltersOptions } from '../src/use-filters';

import { createFilters } from '../src/create-filters';
import { fromDateTimeValue, toDateTimeValue } from '../src/lib';

describe('datetime converters', () => {
  it('round-trip the default datetime format', () => {
    const stored = toDateTimeValue(new Date(2026, 6, 9, 14, 30, 15));
    expect(stored).toBe('2026-07-09T14:30:15');
    const back = fromDateTimeValue(stored);
    expect(back?.getHours()).toBe(14);
    expect(back?.getMinutes()).toBe(30);
    expect(back?.getSeconds()).toBe(15);
  });

  it('returns undefined for empty/invalid input', () => {
    expect(fromDateTimeValue('')).toBeUndefined();
    expect(fromDateTimeValue(null)).toBeUndefined();
    expect(fromDateTimeValue('nope')).toBeUndefined();
  });
});

describe('createFilters datetime helpers use serializeDateTime / parseDateTime overrides', () => {
  const pad = (n: number) => String(n).padStart(2, '0');
  const { toDateTimeValue: toDT, fromDateTimeValue: fromDT } = createFilters({
    serializeDateTime: (d) =>
      `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`,
    parseDateTime: (value) => {
      const m = /^(\d{2})\.(\d{2})\.(\d{4}) (\d{2}):(\d{2})$/.exec(value);
      return m ? new Date(+m[3], +m[2] - 1, +m[1], +m[4], +m[5]) : undefined;
    }
  });

  it('serialize and parse are exact inverses', () => {
    const stored = toDT(new Date(2026, 6, 9, 8, 5));
    expect(stored).toBe('09.07.2026 08:05');
    const back = fromDT(stored);
    expect(back?.getMonth()).toBe(6);
    expect(back?.getDate()).toBe(9);
    expect(back?.getHours()).toBe(8);
    expect(back?.getMinutes()).toBe(5);
  });
});

describe('useFilters with precision: "datetime"', () => {
  const { useFilters, f } = createFilters();
  const wrapper = withNuqsTestingAdapter({ hasMemory: true });

  function renderFilters<const T extends FiltersFor<never>>(
    configs: T,
    options?: UseFiltersOptions
  ) {
    return renderHook(() => useFilters<never, T>(configs, options), { wrapper });
  }

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
