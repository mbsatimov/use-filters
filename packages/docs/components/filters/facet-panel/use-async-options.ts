'use client';

import type { FilterOption, FilterPrimitive } from '@mbsatimov/use-filters';

import { useEffect, useState } from 'react';

/**
 * Debounced, abortable server-side option search for async filters.
 *
 * Fetches only while `enabled` (the picker is visible), keeps the previous
 * options during a refetch so the list never flashes, and aborts superseded
 * requests so a slow response can never overwrite a newer one.
 *
 * If your app uses TanStack Query, swap the internals for `useQuery` keyed on
 * `[filterKey, search]` — the return shape stays the same.
 */
export function useAsyncOptions<V extends FilterPrimitive>(
  filterKey: string,
  loadOptions: (search: string, signal: AbortSignal) => Promise<FilterOption<V>[]>,
  search: string,
  enabled: boolean,
  debounceMs = 300
) {
  const debouncedSearch = useDebouncedValue(search, debounceMs);
  const [options, setOptions] = useState<FilterOption<V>[]>([]);
  const [isPending, setIsPending] = useState(true);

  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    setIsPending(true);
    loadOptions(debouncedSearch, controller.signal)
      .then((result) => {
        setOptions(result);
        setIsPending(false);
      })
      .catch(() => {
        // An abort means a newer search replaced this one; a real failure
        // still has to drop the spinner so the empty state can show.
        if (!controller.signal.aborted) setIsPending(false);
      });
    return () => controller.abort();
    // `loadOptions` comes from the filter config; identity is per-render, so
    // keying the effect on it would refetch on every render.
    // eslint-disable-next-line react/exhaustive-deps
  }, [filterKey, debouncedSearch, enabled]);

  return { options, isPending };
}

/** `value`, trailing-debounced by `delayMs`. */
function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(setDebounced, delayMs, value);
    return () => clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}
