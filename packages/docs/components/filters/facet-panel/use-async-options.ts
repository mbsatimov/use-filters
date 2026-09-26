'use client';

import type {
  FilterOption,
  FilterPrimitive,
  LoadOptions,
  OptionsCursor
} from '@mbsatimov/use-filters';

import { useCallback, useEffect, useRef, useState } from 'react';

/** The slice of an async filter this hook reads. */
interface AsyncOptionsSource<V extends FilterPrimitive> {
  key: string;
  loadOptions: LoadOptions<V>;
  searchDebounceMs?: number;
}

/**
 * Debounced, abortable, paginated server-side option search for async filters.
 *
 * A new search (or reopening the picker) fetches the first page and replaces
 * the list; `loadMore()` fetches the page at the last `nextCursor` and appends
 * it. Fetches only while `enabled` (the picker is visible), keeps the previous
 * options during a refetch so the list never flashes, and aborts superseded
 * requests so a slow response can never overwrite a newer one.
 *
 * If your app uses TanStack Query, swap the internals for `useInfiniteQuery`
 * keyed on `[filter.key, search]` with `initialPageParam: null` and
 * `getNextPageParam: (page) => page.nextCursor ?? undefined` — the return
 * shape stays the same.
 */
export function useAsyncOptions<V extends FilterPrimitive>(
  filter: AsyncOptionsSource<V>,
  search: string,
  enabled: boolean
) {
  const { key, loadOptions, searchDebounceMs = 300 } = filter;
  const debouncedSearch = useDebouncedValue(search, searchDebounceMs);
  const [options, setOptions] = useState<FilterOption<V>[]>([]);
  const [nextCursor, setNextCursor] = useState<OptionsCursor | null>(null);
  const [isPending, setIsPending] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  // The in-flight "load more" request — also the guard against overlapping ones.
  const moreRef = useRef<AbortController | null>(null);
  // Always call the latest loader, but never refetch because its identity
  // changed: an inline config hands us a new function on every parent render,
  // and restarting would throw away the pages loaded so far.
  const loadOptionsRef = useRef(loadOptions);
  loadOptionsRef.current = loadOptions;

  // First page: replaces the list whenever the search changes.
  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    // A page for the previous search must never land in this one's list.
    moreRef.current?.abort();
    moreRef.current = null;
    setIsLoadingMore(false);
    setIsPending(true);
    loadOptionsRef
      .current({ search: debouncedSearch, signal: controller.signal, cursor: null })
      .then((page) => {
        if (controller.signal.aborted) return;
        setOptions(page.options);
        setNextCursor(page.nextCursor ?? null);
        setIsPending(false);
      })
      .catch(() => {
        // An abort means a newer search replaced this one; a real failure
        // still has to drop the spinner so the empty state can show.
        if (!controller.signal.aborted) setIsPending(false);
      });
    return () => controller.abort();
  }, [key, debouncedSearch, enabled]);

  // Abort a pending "load more" on unmount.
  useEffect(() => () => moreRef.current?.abort(), []);

  // Next page: appends to the list, one request at a time.
  const loadMore = useCallback(() => {
    if (nextCursor === null || isPending || moreRef.current) return;
    const controller = new AbortController();
    moreRef.current = controller;
    setIsLoadingMore(true);
    loadOptionsRef
      .current({ search: debouncedSearch, signal: controller.signal, cursor: nextCursor })
      .then((page) => {
        if (controller.signal.aborted) return;
        setOptions((prev) => [...prev, ...page.options]);
        setNextCursor(page.nextCursor ?? null);
      })
      .catch(() => {})
      .finally(() => {
        if (moreRef.current !== controller) return;
        moreRef.current = null;
        setIsLoadingMore(false);
      });
  }, [debouncedSearch, nextCursor, isPending]);

  return { options, isPending, isLoadingMore, hasMore: nextCursor !== null, loadMore };
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
