import type { PaginationOverride } from './types';

/** Default URL key holding the page number. */
export const DEFAULT_PAGE_KEY = 'page';
/** Default URL key holding the per-page count. */
export const DEFAULT_PER_PAGE_KEY = 'per_page';
/** Default `firstPage` — the number the first page is counted from. */
export const DEFAULT_FIRST_PAGE = 1;
/** Default per-page count when the URL has none. */
export const DEFAULT_PER_PAGE = 10;

/** Coerce a raw page / per-page value (string or number) to an integer, or `undefined`. */
export const coerceInt = (raw: unknown): number | undefined => {
  if (typeof raw === 'number') return Number.isFinite(raw) ? raw : undefined;
  if (typeof raw === 'string' && raw !== '') {
    const parsed = Number.parseInt(raw, 10);
    return Number.isNaN(parsed) ? undefined : parsed;
  }
  return undefined;
};

/** A per-call `pagination` override resolved against the factory defaults. */
interface ResolvedPagination {
  /** Per-page count assumed when the URL has none. */
  defaultPerPage: number;
  /** Whether pagination is active this call (`false` when the override is `false`). */
  enabled: boolean;
  /** Whether a filter change resets the page (hook-only; the loader ignores it). */
  resetPageOnFilterChange: boolean;
}

/**
 * Resolve a per-call `PaginationOverride` against the factory config. Shared by
 * `useFilters` and `resolveFilterParams` so both derive the same effective
 * `defaultPerPage` — otherwise their query keys would split.
 */
export const resolvePaginationOverride = (
  pagination: PaginationOverride,
  defaults: { defaultPerPage: number; resetPageOnFilterChange: boolean }
): ResolvedPagination => {
  const override = typeof pagination === 'object' ? pagination : undefined;
  return {
    enabled: pagination !== false,
    defaultPerPage: override?.defaultPerPage ?? defaults.defaultPerPage,
    resetPageOnFilterChange: override?.resetPageOnFilterChange ?? defaults.resetPageOnFilterChange
  };
};
