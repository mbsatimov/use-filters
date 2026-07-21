import type { FiltersConfig, PaginationParams, ResolvedFiltersConfig } from './types';

import { f } from './builders';
import {
  fromDateTimeValue as fromDateTimeValueBase,
  fromDateValue as fromDateValueBase,
  toDateTimeValue as toDateTimeValueBase,
  toDateValue as toDateValueBase
} from './dates';
import { makeDefineFilters } from './define-filters';
import {
  DEFAULT_FIRST_PAGE,
  DEFAULT_PAGE_KEY,
  DEFAULT_PER_PAGE,
  DEFAULT_PER_PAGE_KEY
} from './pagination';
import { DEFAULT_ARRAY_SEPARATOR } from './parsers';
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
 * constants (pagination keys, page defaults, date (de)serialization). Call once
 * per project and export the result.
 *
 * A factory rather than a React provider on purpose: the constants must be
 * shared with `resolveFilterParams`, which runs in route loaders *outside* React
 * and so can't read context.
 *
 * @example
 * export const { useFilters, resolveFilterParams, f } = createFilters({
 *   pagination: { defaultPerPage: 25 }
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
    // null/empty guard lives here so the bound parse fns only ever see a real string.
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
