/**
 * The plumbing every fake endpoint shares: latency, aborts, and pagination.
 *
 * Each dataset module (`orders.ts`, `users.ts`) builds its endpoint on top of
 * these so the examples exercise the real shape of the problem — a `params`
 * object goes out, a paginated page comes back, and slow responses can be
 * cancelled. Swap the endpoint for your own `fetch` and the components don't
 * change.
 */

/** A page of rows, in the envelope a paginated list endpoint usually returns. */
export interface Paginated<T> {
  count: number;
  page: number;
  per_page: number;
  results: T[];
}

/** Simulated round-trip time, in milliseconds. */
export const LATENCY_MS = 260;

/** Resolve after `ms`, rejecting immediately if the caller aborts. */
export function delay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('Aborted', 'AbortError'));
      return;
    }
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    function onAbort() {
      clearTimeout(timer);
      reject(new DOMException('Aborted', 'AbortError'));
    }
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

/** `true` when `value` is unset, so an absent filter never narrows the result set. */
export const isUnset = (value: unknown): boolean =>
  value === null || value === undefined || value === '' || (Array.isArray(value) && !value.length);

/**
 * Slice `rows` into the requested page. The page is clamped so deep-linking
 * past the last page returns the last one instead of an empty table.
 */
export function paginate<T>(rows: T[], page: number, perPage: number): Paginated<T> {
  const per_page = Math.max(1, perPage);
  const lastPage = Math.max(1, Math.ceil(rows.length / per_page));
  const clamped = Math.min(Math.max(1, page), lastPage);
  const start = (clamped - 1) * per_page;

  return {
    results: rows.slice(start, start + per_page),
    count: rows.length,
    page: clamped,
    per_page
  };
}
