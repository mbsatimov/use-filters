import { DATE_FORMAT, DATE_TIME_FORMAT } from '@mbsatimov/use-filters';

/**
 * The project-level setup a `createFilters()` call binds once.
 *
 * These are the constants a codebase picks on day one and then stops thinking
 * about — what the pagination params are called, how array params reach the
 * backend, how dates are stored. Getting them out of the way with one command
 * is the whole point of the create flow; individual filters are declared later,
 * per screen, in normal code.
 *
 * Every field's default here matches the library's own default, which is what
 * lets the generated config omit anything untouched and the install URL carry
 * only what actually changed.
 */

/** The registry kit that renders the filters, or none for a headless start. */
export type KitChoice = 'facet-panel' | 'filter-bar' | 'filter-controls' | 'none';

/** How array-shaped params (multiSelect, tags, ranges) reach your API. */
export type ArrayFormat = 'array' | 'string';

/** Default commit mode for every filter this factory creates. */
export type CommitChoice = 'debounce' | 'instant' | 'manual';

export interface ProjectConfig {
  arrayFormat: ArrayFormat;
  arraySeparator: string;
  /** `date-fns` pattern for `date` filters; empty means the library default. */
  dateFormat: string;
  /** Pattern for `precision: 'datetime'` filters; empty means the library default. */
  dateTimeFormat: string;
  debounceMs: number;
  defaultCommit: CommitChoice;
  defaultPerPage: number;
  firstPage: number;
  kit: KitChoice;
  pageKey: string;
  perPageKey: string;
  resetPageOnFilterChange: boolean;
  /** Emit a starter screen alongside the config. */
  starter: boolean;
}

/** The library's own defaults — see `resolveConfig` in create-filters.ts. */
export const DEFAULTS: ProjectConfig = {
  arrayFormat: 'array',
  arraySeparator: ',',
  dateFormat: '',
  dateTimeFormat: '',
  debounceMs: 300,
  defaultCommit: 'instant',
  defaultPerPage: 10,
  firstPage: 1,
  kit: 'filter-bar',
  pageKey: 'page',
  perPageKey: 'per_page',
  resetPageOnFilterChange: true,
  starter: true
};

/**
 * True when a pattern is the library's own default in either spelling — the
 * preset's empty token, or the literal the Custom field opens on. Everything
 * that emits output (codegen, the install URL, the endpoint's dependency list)
 * checks this, so writing out the default pattern by hand changes nothing.
 */
export const isDefaultDateFormat = (pattern: string) => pattern === '' || pattern === DATE_FORMAT;

/** The datetime counterpart, for `precision: 'datetime'` filters. */
export const isDefaultDateTimeFormat = (pattern: string) =>
  pattern === '' || pattern === DATE_TIME_FORMAT;

/** True when either date pattern is overridden — the generators need date-fns. */
export const overridesDates = (config: ProjectConfig) =>
  !isDefaultDateFormat(config.dateFormat) || !isDefaultDateTimeFormat(config.dateTimeFormat);

/** Date storage formats offered as presets. Empty value = the library default. */
export const DATE_FORMATS = [
  { hint: 'ISO, the default', label: 'yyyy-MM-dd', value: '' },
  { hint: 'Day first', label: 'dd.MM.yyyy', value: 'dd.MM.yyyy' },
  { hint: 'US order', label: 'MM/dd/yyyy', value: 'MM/dd/yyyy' },
  { hint: 'Compact', label: 'yyyyMMdd', value: 'yyyyMMdd' }
] as const;

/** Common page sizes, offered as chips rather than a free number input. */
export const PAGE_SIZES = [10, 20, 25, 50, 100] as const;

/** Backend conventions that decide the pagination param names. */
export const PAGINATION_PRESETS = [
  { label: 'page / per_page', pageKey: 'page', perPageKey: 'per_page' },
  { label: 'page / limit', pageKey: 'page', perPageKey: 'limit' },
  { label: 'page / pageSize', pageKey: 'page', perPageKey: 'pageSize' },
  { label: 'offset / limit', pageKey: 'offset', perPageKey: 'limit' }
] as const;

/** Package managers, and how each runs a one-off CLI. */
export const PACKAGE_MANAGERS = [
  { label: 'pnpm', runner: 'pnpm dlx' },
  { label: 'npm', runner: 'npx' },
  { label: 'yarn', runner: 'yarn dlx' },
  { label: 'bun', runner: 'bunx --bun' }
] as const;

export type PackageManager = (typeof PACKAGE_MANAGERS)[number]['label'];

/** True when the config is entirely stock — nothing to emit beyond the kit. */
export const isStock = (config: ProjectConfig) =>
  (Object.keys(DEFAULTS) as (keyof ProjectConfig)[])
    .filter((key) => key !== 'kit' && key !== 'starter')
    .every((key) => config[key] === DEFAULTS[key]);
