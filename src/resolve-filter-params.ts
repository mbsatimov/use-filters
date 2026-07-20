import type { RawSearchParams } from './lib';
import type {
  FilterConfigMap,
  FilterParams,
  ResolvedFiltersConfig,
  SharedFilterCallOptions
} from './types';

import { coerceInt, coerceRawValue, normalizeRawSearch, resolvePaginationOverride } from './lib';

/**
 * Framework-agnostic mirror of `useFilters`'s `params` derivation, bound to the
 * same config. Given the config map and the raw search params, it produces the
 * identical shape `useFilters` computes on mount: every configured key falls
 * back to its `defaultValue` (or `null`), the `page` / `per_page` values are
 * mirrored into `params` under the configured keys, and extra keys on `raw` —
 * like an async filter's `_label` sidecar — are dropped.
 *
 * `raw` is accepted in whatever shape your router provides ({@link RawSearchParams}):
 * a parsed object (TanStack Router's `location.search`), a `URLSearchParams`
 * (React Router — `new URL(request.url).searchParams`), or the raw query
 * string itself (`location.search`).
 *
 * Use it in a route `loader` so its prefetch queryKey matches the `useQuery`
 * the page's filtered table runs. Passing raw search params straight through
 * produces a different (sparse, un-normalized) object, so the loader's
 * `ensureQueryData` call ends up under a different queryKey and the prefetch
 * never gets reused.
 */
export function makeResolveFilterParams<PP extends Record<string, number>>(
  cfg: ResolvedFiltersConfig
) {
  return function resolveFilterParams<T extends FilterConfigMap>(
    configs: T,
    raw: RawSearchParams,
    options: SharedFilterCallOptions = {}
  ): FilterParams<T, PP> {
    // Same option type as `useFilters` (its twin) — see `SharedFilterCallOptions`.
    const { pagination = true, arraySeparator = cfg.arraySeparator } = options;
    // Resolved by the same helper the hook uses, so both derive an identical
    // effective `defaultPerPage` (see `resolvePaginationOverride`).
    const { enabled, defaultPerPage } = resolvePaginationOverride(pagination, cfg);

    const search = normalizeRawSearch(raw);
    const result: Record<string, unknown> = {};
    for (const [key, config] of Object.entries(configs)) {
      // Coerce through the same parsers the hook uses, so a loader's params
      // object matches the hook's exactly (and their query keys collide).
      result[key] = coerceRawValue(config, search[key], arraySeparator);
    }
    if (enabled) {
      // Mirror the URL keys into `params`, exactly like the hook.
      result[cfg.pageKey] = coerceInt(search[cfg.pageKey]) ?? cfg.firstPage;
      result[cfg.perPageKey] = coerceInt(search[cfg.perPageKey]) ?? defaultPerPage;
    }
    return result as FilterParams<T, PP>;
  };
}
