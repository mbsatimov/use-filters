import type {
  FilterConfigMap,
  FilterParams,
  FiltersConfig,
  PaginationOverride,
  PaginationParams,
  ResolvedFiltersConfig
} from './types';

import { f } from './builders';
import {
  coerceInt,
  coerceRawValue,
  DEFAULT_ARRAY_SEPARATOR,
  DEFAULT_FIRST_PAGE,
  DEFAULT_PAGE_KEY,
  DEFAULT_PER_PAGE,
  DEFAULT_PER_PAGE_KEY,
  fromDateTimeValue as fromDateTimeValueBase,
  fromDateValue as fromDateValueBase,
  toDateTimeValue as toDateTimeValueBase,
  toDateValue as toDateValueBase
} from './lib';
import { makeUseFilters } from './use-filters';

/** Fill in every `FiltersConfig` default, flattening it into the shape the internals consume. */
function resolveConfig(config: FiltersConfig<string, string> = {}): ResolvedFiltersConfig {
  const {
    pagination = {},
    date = {},
    defaultCommit = 'instant',
    arraySeparator = DEFAULT_ARRAY_SEPARATOR
  } = config;
  return {
    arraySeparator,
    defaultCommit,
    defaultPerPage: pagination.defaultPerPage ?? DEFAULT_PER_PAGE,
    firstPage: pagination.firstPage ?? DEFAULT_FIRST_PAGE,
    pageKey: pagination.pageKey ?? DEFAULT_PAGE_KEY,
    perPageKey: pagination.perPageKey ?? DEFAULT_PER_PAGE_KEY,
    // Date (de)serialization: fixed `yyyy-MM-dd` defaults, fully overridable to
    // store dates in whatever shape or library the app uses.
    parseDate: date.parse ?? fromDateValueBase,
    parseDateTime: date.parseDateTime ?? fromDateTimeValueBase,
    serializeDate: date.serialize ?? toDateValueBase,
    serializeDateTime: date.serializeDateTime ?? toDateTimeValueBase
  };
}

/**
 * Framework-agnostic mirror of `useFilters`'s `params` derivation, bound to the
 * same config. Given the config map and a raw search object (e.g. a route
 * `loader`'s `location.search`), it produces the identical shape `useFilters`
 * computes on mount: every configured key falls back to its `defaultValue` (or
 * `null`), the `page` / `per_page` values are mirrored into `params` under the
 * configured keys, and extra keys on `raw` — like an async filter's `_label`
 * sidecar — are dropped.
 *
 * Use it in a route `loader` so its prefetch queryKey matches the `useQuery`
 * the page's filtered table runs. Passing raw search params straight through
 * produces a different (sparse, un-normalized) object, so the loader's
 * `ensureQueryData` call ends up under a different queryKey and the prefetch
 * never gets reused.
 */
function makeResolveFilterParams<PP extends Record<string, number>>(cfg: ResolvedFiltersConfig) {
  return function resolveFilterParams<T extends FilterConfigMap>(
    configs: T,
    raw: Record<string, unknown>,
    options: { arraySeparator?: string; pagination?: PaginationOverride } = {}
  ): FilterParams<T, PP> {
    // Same `pagination` override shape as `useFilters` (its twin), so options
    // copy across cleanly: `false` off, object overrides `defaultPerPage`.
    const { pagination = true, arraySeparator = cfg.arraySeparator } = options;
    const defaultPerPage =
      typeof pagination === 'object'
        ? (pagination.defaultPerPage ?? cfg.defaultPerPage)
        : cfg.defaultPerPage;

    const result: Record<string, unknown> = {};
    for (const [key, config] of Object.entries(configs)) {
      // Coerce through the same parsers the hook uses, so a loader's params
      // object matches the hook's exactly (and their query keys collide).
      result[key] = coerceRawValue(config, raw[key], arraySeparator);
    }
    if (pagination !== false) {
      // Mirror the URL keys into `params`, exactly like the hook.
      result[cfg.pageKey] = coerceInt(raw[cfg.pageKey]) ?? cfg.firstPage;
      result[cfg.perPageKey] = coerceInt(raw[cfg.perPageKey]) ?? defaultPerPage;
    }
    return result as FilterParams<T, PP>;
  };
}

/** Everything a `createFilters` call returns, all bound to the same config. */
export interface Filters<PP extends Record<string, number> = PaginationParams> {
  /** The filter builders (`f.select`, `f.text`, …) — config-independent, re-exported for convenience. */
  f: typeof f;
  /** Route-`loader` twin of the hook's `params` — see {@link makeResolveFilterParams}. */
  resolveFilterParams: ReturnType<typeof makeResolveFilterParams<PP>>;
  /** The URL-synced filters hook, bound to this config. */
  useFilters: ReturnType<typeof makeUseFilters<PP>>;
  /** Stored datetime string -> `Date`, or `undefined` — for `precision: 'datetime'` filters. */
  fromDateTimeValue: (value?: string | null) => Date | undefined;
  /** Stored date string -> `Date`, or `undefined` when empty/invalid. */
  fromDateValue: (value?: string | null) => Date | undefined;
  /** `Date` -> stored datetime string (`date.serializeDateTime`) — for `precision: 'datetime'` filters. */
  toDateTimeValue: (date: Date) => string;
  /** `Date` -> stored date string (`date.serialize`, default `yyyy-MM-dd`). */
  toDateValue: (date: Date) => string;
}

/**
 * Create a `useFilters` hook and its companions bound to one set of per-project
 * constants (pagination keys, page defaults, where numbering starts, date
 * (de)serialization).
 *
 * A factory rather than a React provider on purpose: the constants have to be
 * shared with `resolveFilterParams`, which runs in route loaders *outside*
 * React and so can't read context. Closing over them here keeps the hook and
 * the loader helper perfectly in sync, with no runtime context lookup and full
 * type-safety.
 *
 * `params`' pagination keys **mirror the URL keys** — name them `page` /
 * `per_page` and `params` has `{ page, per_page }` (typed from the literal key
 * names). `firstPage` sets where numbering starts (default `1`; use `0` for a
 * 0-indexed API). For an API whose pagination shape differs from the URL keys
 * (e.g. offset-based), derive it at your fetch call from `params`.
 *
 * Call it once per project (or per API client) and export the result:
 *
 * @example
 * // src/lib/filters.ts — params: { ...filters, page, per_page }
 * export const { useFilters, resolveFilterParams, f } = createFilters({
 *   pagination: {
 *     pageKey: 'page',
 *     perPageKey: 'per_page',
 *     defaultPerPage: 25
 *   }
 * });
 *
 * // 0-indexed API — the first page is `page=0`
 * export const { useFilters } = createFilters({
 *   pagination: { firstPage: 0 }
 * });
 */
export function createFilters<
  PageKey extends string = typeof DEFAULT_PAGE_KEY,
  PerPageKey extends string = typeof DEFAULT_PER_PAGE_KEY,
  PP extends Record<string, number> = Record<PageKey | PerPageKey, number>
>(config: FiltersConfig<PageKey, PerPageKey> = {}): Filters<PP> {
  const cfg = resolveConfig(config);
  return {
    f,
    // Bound to this config's parse/serialize pair so each is an exact inverse.
    // The parser only ever sees a real string; the null/empty guard lives here.
    fromDateTimeValue: (value?: string | null) =>
      value == null || value === '' ? undefined : cfg.parseDateTime(value),
    fromDateValue: (value?: string | null) =>
      value == null || value === '' ? undefined : cfg.parseDate(value),
    resolveFilterParams: makeResolveFilterParams<PP>(cfg),
    toDateTimeValue: cfg.serializeDateTime,
    toDateValue: cfg.serializeDate,
    useFilters: makeUseFilters<PP>(cfg)
  };
}
