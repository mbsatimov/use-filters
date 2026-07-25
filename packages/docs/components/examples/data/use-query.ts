'use client';

import { useEffect, useRef, useState } from 'react';

export interface QueryResult<TData> {
  /** The last successful response. Kept while a new request is in flight, so the UI never blanks. */
  data: TData | null;
  error: Error | null;
  /** A request is in flight, including a background refetch over existing data. */
  isFetching: boolean;
  /** A request is in flight and there is nothing to show yet. */
  isLoading: boolean;
}

/**
 * A minimal keyed fetch — the same contract as React Query's
 * `useQuery({ queryKey, queryFn })`, boiled down for the examples.
 *
 * Key it on `paramsStr` from `useFilters`, not on the `params` object: the hook
 * returns a new object identity every render, while `paramsStr` only changes
 * when the committed values actually change. That makes it a correct effect
 * dependency — and the same property makes `params` a correct React Query / SWR
 * cache key in a real app.
 *
 * The previous response stays visible during a refetch, and superseded requests
 * are aborted so a slow response can never overwrite a newer one.
 */
export function useQuery<TData>(
  key: string,
  fetcher: (signal: AbortSignal) => Promise<TData>
): QueryResult<TData> {
  const [state, setState] = useState<{ data: TData | null; error: Error | null }>({
    data: null,
    error: null
  });
  const [isFetching, setIsFetching] = useState(true);

  // Read the fetcher through a ref so the effect depends only on `key`.
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  useEffect(() => {
    const controller = new AbortController();
    setIsFetching(true);

    fetcherRef
      .current(controller.signal)
      .then((data) => setState({ data, error: null }))
      .catch((error: Error) => {
        // An abort means a newer request replaced this one; not a failure.
        if (error.name === 'AbortError') return;
        setState((previous) => ({ data: previous.data, error }));
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsFetching(false);
      });

    return () => controller.abort();
  }, [key]);

  return {
    data: state.data,
    error: state.error,
    isFetching,
    isLoading: isFetching && state.data === null
  };
}
