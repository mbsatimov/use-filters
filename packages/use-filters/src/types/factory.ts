import type { FilterCommitMode } from './config';
import type { ArrayFormat } from './primitives';

/**
 * Default pagination params (`page`/`per_page`). A `type`, not an `interface`,
 * so it satisfies the `Record<string, number>` bound (interfaces lack an
 * implicit index signature).
 */
// eslint-disable-next-line ts/consistent-type-definitions -- must stay a type alias (see above)
export type PaginationParams = {
  page: number;
  per_page: number;
};

/**
 * Pagination URL keys, page defaults, and where numbering starts. `params`
 * mirrors the URL keys (`PageKey`/`PerPageKey` are inferred from the literals),
 * so renaming them renames `params`. For a different API shape (e.g.
 * offset-based), derive it at your fetch call from `params`.
 */
export interface PaginationConfig<
  PageKey extends string = string,
  PerPageKey extends string = string
> {
  /** Per-page count assumed when the URL has none. Defaults to `10`. */
  defaultPerPage?: number;
  /** Where numbering starts (URL, `params`, and reset). Defaults to `1`; use `0` for a 0-indexed API. */
  firstPage?: number;
  /** URL key holding the page number, and its key in `params`. Defaults to `'page'`. */
  pageKey?: PageKey;
  /** URL key holding the per-page count, and its key in `params`. Defaults to `'per_page'`. */
  perPageKey?: PerPageKey;
  /** Whether a filter change resets the page to `firstPage`. Defaults to `true`. */
  resetPageOnFilterChange?: boolean;
}

/**
 * Per-call pagination override: `false` disables it, `true`/omitted keeps the
 * factory's, an object overrides the per-call-safe fields (`defaultPerPage`,
 * `resetPageOnFilterChange`). Keys and `firstPage` stay factory-only so
 * `params` matches `resolveFilterParams`.
 */
export type PaginationOverride =
  boolean | Pick<PaginationConfig, 'defaultPerPage' | 'resetPageOnFilterChange'>;

/**
 * How `date` filters (de)serialize between a stored URL string and a `Date`.
 * Override in pairs (`parse`+`serialize`, `parseDateTime`+`serializeDateTime`)
 * so each is an exact inverse. Defaults to the fixed `yyyy-MM-dd` shapes.
 */
export interface DateConfig {
  /** Stored string -> `Date` (inverse of `serialize`). Override to use any format/library. */
  parse?: (value: string) => Date | undefined;
  /** Datetime counterpart of `parse` (for `precision: 'datetime'` filters). */
  parseDateTime?: (value: string) => Date | undefined;
  /** `Date` -> stored string. Override (with `parse`) to change the stored shape. */
  serialize?: (date: Date) => string;
  /** Datetime counterpart of `serialize` (for `precision: 'datetime'` filters). */
  serializeDateTime?: (date: Date) => string;
}

/**
 * How the factory shapes a **backend request** — a per-API constant, like
 * {@link DateConfig} and {@link PaginationConfig}. Set once on `createFilters`;
 * it governs the `params` object the hook and `resolveFilterParams` produce.
 */
export interface RequestConfig<AF extends ArrayFormat = ArrayFormat> {
  /**
   * How array-shaped params appear in `params`: `'array'` (default, a JS array)
   * or `'string'` (items joined with `arraySeparator`, backend-ready). See
   * {@link ArrayFormat}.
   */
  arrayFormat?: AF;
}

/**
 * Per-project constants injected once through `createFilters`, so the hook and
 * `resolveFilterParams` share the exact same values (a provider can't reach the
 * loader, which runs outside React). Every option falls back to a default.
 */
export interface FiltersConfig<
  PageKey extends string = string,
  PerPageKey extends string = string,
  AF extends ArrayFormat = ArrayFormat
> {
  /** Delimiter for array-shaped params in the URL. Defaults to `','`. */
  arraySeparator?: string;
  /** Date (de)serialization for `date` filters. See {@link DateConfig}. */
  date?: DateConfig;
  /** Default `commit` mode for this factory's filters. Defaults to `'instant'`. */
  defaultCommit?: FilterCommitMode;
  /** URL keys, page defaults, and where numbering starts. See {@link PaginationConfig}. */
  pagination?: PaginationConfig<PageKey, PerPageKey>;
  /** How `params` are shaped for a backend request. See {@link RequestConfig}. */
  request?: RequestConfig<AF>;
}

/**
 * `FiltersConfig` with every default filled in and flattened — what
 * `createFilters` hands to the hook and `resolveFilterParams` internally. Not
 * part of the public config surface (`createFilters` takes the nested
 * `FiltersConfig`); this is the normalized form the internals consume.
 */
export interface ResolvedFiltersConfig {
  arrayFormat: ArrayFormat;
  arraySeparator: string;
  defaultCommit: FilterCommitMode;
  defaultPerPage: number;
  firstPage: number;
  pageKey: string;
  perPageKey: string;
  resetPageOnFilterChange: boolean;
  parseDate: (value: string) => Date | undefined;
  parseDateTime: (value: string) => Date | undefined;
  serializeDate: (date: Date) => string;
  serializeDateTime: (date: Date) => string;
}

/**
 * The options `useFilters` and `resolveFilterParams` share — must be identical
 * between them for their `params` to match. `UseFiltersOptions` extends this
 * with hook-only fields the loader doesn't take.
 */
export interface SharedFilterCallOptions {
  /**
   * Delimiter joining/splitting an array-shaped param's items in the URL for
   * this call, overriding the `createFilters` config. Defaults to the
   * factory's `arraySeparator` (`','` unless set). See
   * {@link FiltersConfig.arraySeparator}.
   */
  arraySeparator?: string;
  /** Per-call pagination override. See {@link PaginationOverride}. */
  pagination?: PaginationOverride;
}
