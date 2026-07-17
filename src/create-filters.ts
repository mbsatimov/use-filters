import type { FiltersConfig, PaginationParams, ResolvedFiltersConfig } from './types';

import { f } from './builders';
import { makeDefineFilters } from './define-filters';
import {
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
import { makeResolveFilterParams } from './resolve-filter-params';
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
    resetPageOnFilterChange: pagination.resetPageOnFilterChange ?? true,
    serializeDate: date.serialize ?? toDateValueBase,
    serializeDateTime: date.serializeDateTime ?? toDateTimeValueBase
  };
}

/** Everything a `createFilters` call returns, all bound to the same config. */
export interface Filters<PP extends Record<string, number> = PaginationParams> {
  /**
   * Bind one screen's `configs` and `{ arraySeparator, pagination }` once for
   * both `useFilters` and `resolveFilterParams`, so the two can't drift out of
   * sync. See {@link makeDefineFilters} (define-filters.ts).
   */
  defineFilters: ReturnType<typeof makeDefineFilters<PP>>;
  /** The filter builders (`f.select`, `f.text`, …) — config-independent, re-exported for convenience. */
  f: typeof f;
  /** Route-`loader` twin of the hook's `params` — see {@link makeResolveFilterParams} (resolve-filter-params.ts). */
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
  const useFiltersBound = makeUseFilters<PP>(cfg);
  const resolveFilterParamsBound = makeResolveFilterParams<PP>(cfg);
  return {
    defineFilters: makeDefineFilters<PP>(useFiltersBound, resolveFilterParamsBound),
    f,
    // Bound to this config's parse/serialize pair so each is an exact inverse.
    // The parser only ever sees a real string; the null/empty guard lives here.
    fromDateTimeValue: (value?: string | null) =>
      value == null || value === '' ? undefined : cfg.parseDateTime(value),
    fromDateValue: (value?: string | null) =>
      value == null || value === '' ? undefined : cfg.parseDate(value),
    resolveFilterParams: resolveFilterParamsBound,
    toDateTimeValue: cfg.serializeDateTime,
    toDateValue: cfg.serializeDate,
    useFilters: useFiltersBound
  };
}
