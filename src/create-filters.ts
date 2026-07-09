import type {
  FilterConfigMap,
  FilterParams,
  FiltersConfig,
  PaginationParams,
  ResolvedFiltersConfig
} from './types';

import { f } from './builders';
import {
  coerceInt,
  coerceRawValue,
  DEFAULT_PAGE,
  DEFAULT_PAGE_KEY,
  DEFAULT_PAGE_SIZE,
  DEFAULT_PAGE_SIZE_KEY,
  fromDateTimeValue as fromDateTimeValueBase,
  fromDateValue as fromDateValueBase,
  toDateTimeValue as toDateTimeValueBase,
  toDateValue as toDateValueBase
} from './lib';
import { makeUseFilters } from './use-filters';

/** Default page → API pagination mapping: `{ limit, offset }` with a real offset. */
const defaultMapPagination = (page: number, pageSize: number): PaginationParams => ({
  limit: pageSize,
  offset: (page - 1) * pageSize
});

/** Fill in every `FiltersConfig` default, yielding the shape the internals consume. */
function resolveConfig<PP extends Record<string, number> = PaginationParams>(
  config: FiltersConfig<PP> = {}
): ResolvedFiltersConfig<PP> {
  return {
    defaultPage: config.defaultPage ?? DEFAULT_PAGE,
    defaultPageSize: config.defaultPageSize ?? DEFAULT_PAGE_SIZE,
    // The default only produces `{ limit, offset }`. A custom `PP` can only be
    // inferred *from* a supplied `mapPagination`, so whenever `PP` differs from
    // `PaginationParams` this fallback is unreachable — the cast is safe.
    mapPagination:
      config.mapPagination ??
      (defaultMapPagination as unknown as ResolvedFiltersConfig<PP>['mapPagination']),
    pageKey: config.pageKey ?? DEFAULT_PAGE_KEY,
    pageSizeKey: config.pageSizeKey ?? DEFAULT_PAGE_SIZE_KEY,
    // Date (de)serialization: fixed `yyyy-MM-dd` defaults, fully overridable to
    // store dates in whatever shape or library the app uses.
    parseDate: config.parseDate ?? fromDateValueBase,
    parseDateTime: config.parseDateTime ?? fromDateTimeValueBase,
    serializeDate: config.serializeDate ?? toDateValueBase,
    serializeDateTime: config.serializeDateTime ?? toDateTimeValueBase
  };
}

/**
 * Framework-agnostic mirror of `useFilters`'s `params` derivation, bound to the
 * same config. Given the config map and a raw search object (e.g. a route
 * `loader`'s `location.search`), it produces the identical shape `useFilters`
 * computes on mount: every configured key falls back to its `defaultValue` (or
 * `null`), pagination is normalized through `mapPagination`, and extra keys on
 * `raw` — like an async filter's `_label` sidecar — are dropped.
 *
 * Use it in a route `loader` so its prefetch queryKey matches the `useQuery`
 * the page's filtered table runs. Passing raw search params straight through
 * produces a different (sparse, un-normalized) object, so the loader's
 * `ensureQueryData` call ends up under a different queryKey and the prefetch
 * never gets reused.
 */
function makeResolveFilterParams<PP extends Record<string, number>>(
  cfg: ResolvedFiltersConfig<PP>
) {
  return function resolveFilterParams<T extends FilterConfigMap>(
    configs: T,
    raw: Record<string, unknown>,
    options: { defaultPageSize?: number; pagination?: boolean } = {}
  ): FilterParams<T, PP> {
    const { pagination = true, defaultPageSize = cfg.defaultPageSize } = options;

    const result: Record<string, unknown> = {};
    for (const [key, config] of Object.entries(configs)) {
      // Coerce through the same parsers the hook uses, so a loader's params
      // object matches the hook's exactly (and their query keys collide).
      result[key] = coerceRawValue(config, raw[key]);
    }
    if (pagination) {
      const page = coerceInt(raw[cfg.pageKey]) ?? cfg.defaultPage;
      const pageSize = coerceInt(raw[cfg.pageSizeKey]) ?? defaultPageSize;
      Object.assign(result, cfg.mapPagination(page, pageSize));
    }
    return result as FilterParams<T, PP>;
  };
}

/** Everything a `createFilters` call returns, all bound to the same config. */
export interface Filters<PP extends Record<string, number> = PaginationParams> {
  /** The filter builders (`f.select`, `f.text`, …) — config-independent, re-exported for convenience. */
  f: typeof f;
  /** Stored datetime string -> `Date`, or `undefined` — for `precision: 'datetime'` filters. */
  fromDateTimeValue: (value?: string | null) => Date | undefined;
  /** Stored date string -> `Date`, or `undefined` when empty/invalid. */
  fromDateValue: (value?: string | null) => Date | undefined;
  /** Route-`loader` twin of the hook's `params` — see {@link makeResolveFilterParams}. */
  resolveFilterParams: ReturnType<typeof makeResolveFilterParams<PP>>;
  /** `Date` -> stored datetime string (`serializeDateTime`) — for `precision: 'datetime'` filters. */
  toDateTimeValue: (date: Date) => string;
  /** `Date` -> stored date string (`serializeDate`, default `yyyy-MM-dd`). */
  toDateValue: (date: Date) => string;
  /** The URL-synced filters hook, bound to this config. */
  useFilters: ReturnType<typeof makeUseFilters<PP>>;
}

/**
 * Create a `useFilters` hook and its companions bound to one set of per-project
 * constants (pagination keys, defaults, date format, API pagination shape).
 *
 * A factory rather than a React provider on purpose: the constants have to be
 * shared with `resolveFilterParams`, which runs in route loaders *outside*
 * React and so can't read context. Closing over them here keeps the hook and
 * the loader helper perfectly in sync, with no runtime context lookup and full
 * type-safety — `params` is typed from your `mapPagination` return shape.
 *
 * Call it once per project (or per API client) and export the result:
 *
 * @example
 * // src/lib/filters.ts
 * export const { useFilters, resolveFilterParams, f } = createFilters({
 *   pageKey: 'page',
 *   pageSizeKey: 'per_page',
 *   defaultPageSize: 25
 * });
 *
 * // a custom API pagination shape — `params` follows it:
 * export const { useFilters } = createFilters({
 *   mapPagination: (page, pageSize) => ({ page, page_size: pageSize })
 * });
 */
export function createFilters<PP extends Record<string, number> = PaginationParams>(
  config: FiltersConfig<PP> = {}
): Filters<PP> {
  const cfg = resolveConfig(config);
  return {
    f,
    // Bound to this config's parse/serialize pairs so each is an exact inverse
    // (the previous unbound `fromDateValue` ignored a custom format). The
    // parsers only ever see a real string; the null/empty guard stays here.
    fromDateTimeValue: (value?: string | null) =>
      value == null || value === '' ? undefined : cfg.parseDateTime(value),
    fromDateValue: (value?: string | null) =>
      value == null || value === '' ? undefined : cfg.parseDate(value),
    resolveFilterParams: makeResolveFilterParams(cfg),
    toDateTimeValue: cfg.serializeDateTime,
    toDateValue: cfg.serializeDate,
    useFilters: makeUseFilters(cfg)
  };
}
