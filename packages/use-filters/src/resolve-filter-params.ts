import type { RawSearchParams } from './search';
import type {
  FilterConfigMap,
  FilterParams,
  ResolvedFiltersConfig,
  SharedFilterCallOptions
} from './types';

import { coerceInt, resolvePaginationOverride } from './pagination';
import { coerceRawValue, normalizeRawSearch } from './search';

/**
 * Framework-agnostic twin of the hook's `params` derivation, for route loaders.
 * Produces the **identical** object `useFilters` computes on mount — same
 * parsers, same defaults, same pagination keys — so a loader's prefetch lands
 * under the same query key the page's `useQuery` uses. See the route-loaders guide.
 */
export function makeResolveFilterParams<PP extends Record<string, number>>(
  cfg: ResolvedFiltersConfig
) {
  return function resolveFilterParams<T extends FilterConfigMap>(
    configs: T,
    raw: RawSearchParams,
    options: SharedFilterCallOptions = {}
  ): FilterParams<T, PP> {
    const { pagination = true, arraySeparator = cfg.arraySeparator } = options;
    const { enabled, defaultPerPage } = resolvePaginationOverride(pagination, cfg);

    const search = normalizeRawSearch(raw);
    const result: Record<string, unknown> = {};
    for (const [key, config] of Object.entries(configs)) {
      result[key] = coerceRawValue(config, search[key], arraySeparator);
    }
    if (enabled) {
      result[cfg.pageKey] = coerceInt(search[cfg.pageKey]) ?? cfg.firstPage;
      result[cfg.perPageKey] = coerceInt(search[cfg.perPageKey]) ?? defaultPerPage;
    }
    return result as FilterParams<T, PP>;
  };
}
