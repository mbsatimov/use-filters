import type { Options as NuqsOptions } from 'nuqs';
import type * as React from 'react';

/** Primitive types a `select` / `multiSelect` option's value can hold. */
export type FilterPrimitive = number | string;

/**
 * Fields shared by every filter kind's `meta` — augment this for a hint that
 * makes sense everywhere (e.g. a shared layout `variant`). Every per-kind meta
 * interface below (`SelectFilterMeta`, `NumberFilterMeta`, …) extends this one,
 * so an augmentation here shows up on all of them.
 *
 * @example
 * declare module '@mbsatimov/use-filters' {
 *   interface FilterMeta {
 *     variant?: 'flex' | 'list';
 *   }
 * }
 */
export interface FilterMeta {}

/**
 * Per-kind extension points — one per filter type, each empty by default and
 * independently augmentable, the same way TanStack augments `ColumnMeta`.
 * This is what lets `meta` take a different shape per filter kind while the
 * call-site syntax stays identical: `f.select({ ..., meta: {...} })` and
 * `f.number({ ..., meta: {...} })` both work, but each is checked against its
 * own interface.
 *
 * Augment only the kinds that need the extra field — no need to touch the
 * others:
 *
 * @example
 * // in your app, e.g. src/app/types/filters.ts
 * declare module '@mbsatimov/use-filters' {
 *   // Available on every select filter's meta.
 *   interface SelectFilterMeta {
 *     group?: 'primary' | 'advanced';
 *   }
 *   // Available only on `number` filters' meta.
 *   interface NumberFilterMeta {
 *     step?: number;
 *   }
 * }
 *
 * // usage — each checked against its own augmented shape:
 * status: f.select({ label: 'Holat', options, meta: { group: 'primary' } })
 * amount: f.number({ label: 'Summa', meta: { step: 0.5 } })
 */
export interface TextFilterMeta extends FilterMeta {}
export interface NumberFilterMeta extends FilterMeta {}
export interface BooleanFilterMeta extends FilterMeta {}
export interface DateFilterMeta extends FilterMeta {}
export interface DateRangeFilterMeta extends FilterMeta {}
export interface SelectFilterMeta extends FilterMeta {}
export interface AsyncSelectFilterMeta extends FilterMeta {}
export interface AsyncMultiSelectFilterMeta extends FilterMeta {}
export interface MultiSelectFilterMeta extends FilterMeta {}

/**
 * Extension point for `useFilters`' hook-level `meta` option — config that
 * applies to the whole filter set rather than a single filter (e.g. a
 * toolbar layout variant for a custom filter UI). Augment the same way as
 * `FilterMeta`.
 *
 * @example
 * declare module '@mbsatimov/use-filters' {
 *   interface FiltersMeta {
 *     variant?: 'toolbar' | 'sidebar';
 *   }
 * }
 */
export interface FiltersMeta {}

/**
 * Per-filter nuqs URL-update options. Resolution order is
 * `setter call > filter config > useFilters defaults`, so anything set here
 * overrides the hook-level `history` / `shallow` / `clearOnDefault`.
 */
export type FilterNuqsOptions = NuqsOptions;

/** A selectable option for `select` / `multiSelect` filters. */
export interface FilterOption<V extends FilterPrimitive = FilterPrimitive> {
  count?: number;
  icon?: React.FC<React.SVGProps<SVGSVGElement>>;
  label: string;
  /**
   * Custom content rendered at the start of the option row, after the
   * checkbox and in place of `icon` — e.g. a color swatch or an avatar.
   * Takes priority over `icon` when both are set.
   */
  leftSlot?: React.ReactNode;
  /**
   * Custom content rendered at the end of the option row, in place of the
   * `count` badge — e.g. a shortcut hint or a secondary value. Takes
   * priority over `count` when both are set.
   */
  rightSlot?: React.ReactNode;
  value: V;
}

/** Every supported filter kind — derived from the config union, never maintained by hand. */
export type FilterType = FilterConfig['type'];

interface FilterBase {
  /** Extra classes for the control wrapper. */
  className?: string;
  /**
   * When `true`, the filter is omitted from the rendered toolbar but its value
   * (e.g. a forced default) is still included in `params`.
   */
  hidden?: boolean;
  /** Human label shown on the control. */
  label: string;
  /**
   * nuqs options for this filter only — e.g. `{ history: 'push' }` to make a
   * filter back-button-friendly, or `{ limitUrlUpdates: debounce(500) }` to
   * slow down a chatty one. Overrides the `useFilters` defaults.
   */
  nuqs?: FilterNuqsOptions;
  /** Optional placeholder (defaults to `label`). */
  placeholder?: string;
}

/*
 * One interface per filter kind. `defaultValue` is the value the filter starts at
 * when the URL param is absent; a filter sitting at its default is treated as
 * "inactive" and clearing returns it to the default.
 *
 * `select` / `multiSelect` carry a type parameter `V` — the primitive their options
 * hold. It is inferred per call by the `f.select` / `f.multiSelect` builders, which
 * is what makes `params` come out correctly typed (e.g. `number | null` for an
 * id-based filter, `LoanStatus | null` for typed status options).
 */

export interface TextFilterConfig extends FilterBase {
  defaultValue?: string;
  /** Project-specific UI hints for text filters. See `TextFilterMeta`. */
  meta?: TextFilterMeta;
  type: 'text';
}

export interface NumberFilterConfig extends FilterBase {
  defaultValue?: number;
  /** Project-specific UI hints for number filters. See `NumberFilterMeta`. */
  meta?: NumberFilterMeta;
  type: 'number';
  unit?: string;
}

export interface BooleanFilterConfig extends FilterBase {
  defaultValue?: boolean;
  falseLabel?: string;
  /** Project-specific UI hints for boolean filters. See `BooleanFilterMeta`. */
  meta?: BooleanFilterMeta;
  trueLabel?: string;
  type: 'boolean';
}

export interface DateFilterConfig extends FilterBase {
  /** `yyyy-MM-dd` */
  defaultValue?: string;
  /** Project-specific UI hints for date filters. See `DateFilterMeta`. */
  meta?: DateFilterMeta;
  type: 'date';
}

export interface DateRangeFilterConfig extends FilterBase {
  /** `[from, to]` as `yyyy-MM-dd` */
  defaultValue?: [string, string];
  /** Project-specific UI hints for date-range filters. See `DateRangeFilterMeta`. */
  meta?: DateRangeFilterMeta;
  type: 'dateRange';
}

export interface SelectFilterConfig<
  V extends FilterPrimitive = FilterPrimitive
> extends FilterBase {
  /** Checked against `options` — a value outside them is a compile error. */
  defaultValue?: NoInfer<V>;
  /** Project-specific UI hints for select filters. See `SelectFilterMeta`. */
  meta?: SelectFilterMeta;
  options: readonly FilterOption<V>[];
  type: 'select';
}

export interface AsyncSelectFilterConfig<
  V extends FilterPrimitive = FilterPrimitive
> extends FilterBase {
  /** Debounce for the search input, in ms. Defaults to `300`. */
  debounceMs?: number;
  defaultValue?: NoInfer<V>;
  /** Project-specific UI hints for async-select filters. See `AsyncSelectFilterMeta`. */
  meta?: AsyncSelectFilterMeta;
  type: 'asyncSelect';
  /** How values round-trip through the URL. Defaults to `'number'` (ids). */
  valueType?: 'number' | 'string';
  /**
   * Fetch options matching the search text — called (debounced) on every
   * keystroke, so search runs server-side. Return a reasonably small page
   * (e.g. `limit: 20`); results are cached per search string.
   */
  loadOptions: (search: string, signal: AbortSignal) => Promise<FilterOption<V>[]>;
}

export interface AsyncMultiSelectFilterConfig<
  V extends FilterPrimitive = FilterPrimitive
> extends FilterBase {
  /** Debounce for the search input, in ms. Defaults to `300`. */
  debounceMs?: number;
  defaultValue?: readonly NoInfer<V>[];
  /** Project-specific UI hints for async-multi-select filters. See `AsyncMultiSelectFilterMeta`. */
  meta?: AsyncMultiSelectFilterMeta;
  type: 'asyncMultiSelect';
  /** How values round-trip through the URL. Defaults to `'number'` (ids). */
  valueType?: 'number' | 'string';
  /**
   * Fetch options matching the search text — called (debounced) on every
   * keystroke, so search runs server-side. Return a reasonably small page
   * (e.g. `limit: 20`); results are cached per search string.
   */
  loadOptions: (search: string, signal: AbortSignal) => Promise<FilterOption<V>[]>;
}

export interface MultiSelectFilterConfig<
  V extends FilterPrimitive = FilterPrimitive
> extends FilterBase {
  /** Checked against `options` — values outside them are a compile error. */
  defaultValue?: readonly NoInfer<V>[];
  /** Project-specific UI hints for multi-select filters. See `MultiSelectFilterMeta`. */
  meta?: MultiSelectFilterMeta;
  options: readonly FilterOption<V>[];
  type: 'multiSelect';
}

/** Declarative description of a single filter. Build these with the `f.*` helpers. */
export type FilterConfig =
  | AsyncMultiSelectFilterConfig
  | AsyncSelectFilterConfig
  | BooleanFilterConfig
  | DateFilterConfig
  | DateRangeFilterConfig
  | MultiSelectFilterConfig
  | NumberFilterConfig
  | SelectFilterConfig
  | TextFilterConfig;

/** The shape `useFilters` accepts: URL param key -> filter config. */
export type FilterConfigMap = Record<string, FilterConfig>;

/** Maps a `FilterConfig` to the type of the value it stores (and exposes in `params`). */
export type FilterValue<C extends FilterConfig> =
  C extends SelectFilterConfig<infer V>
    ? V | null
    : C extends AsyncSelectFilterConfig<infer V>
      ? V | null
      : C extends AsyncMultiSelectFilterConfig<infer V>
        ? V[] | null
        : C extends MultiSelectFilterConfig<infer V>
          ? V[] | null
          : C extends NumberFilterConfig
            ? number | null
            : C extends BooleanFilterConfig
              ? boolean | null
              : C extends DateRangeFilterConfig
                ? [string, string] | null
                : string | null; // text, date

/**
 * A selected entity as reconstructed from the URL: the value plus its label
 * sidecar (`<key>_label`). `label` is `null` when the sidecar is missing —
 * e.g. a hand-edited URL — and the UI falls back to the raw value.
 */
export interface SelectedOption<V extends FilterPrimitive = FilterPrimitive> {
  label: string | null;
  value: V;
}

/** Extra handlers/state async filters get — they write value + label atomically. */
type AsyncResolvedExtras<C> =
  C extends AsyncSelectFilterConfig<infer V>
    ? {
        /** Select an option (or `null` to clear) — writes value and label sidecar together. */
        onSelectOption: (option: FilterOption<V> | null) => void;
        /** Current selection paired with its URL-stored label. */
        selectedOption: SelectedOption<V> | null;
      }
    : C extends AsyncMultiSelectFilterConfig<infer V>
      ? {
          /** Replace the whole selection at once (batch apply from the mobile sheet). */
          onSetOptions: (options: FilterOption<V>[]) => void;
          /** Toggle an option in/out of the selection — keeps value/label arrays paired. */
          onToggleOption: (option: FilterOption<V>) => void;
          /** Current selections paired with their URL-stored labels. */
          selectedOptions: SelectedOption<V>[];
        }
      : unknown;

/**
 * Read-side convenience for static (non-async) choice filters: the full
 * selected option object(s) — value + label (+ count/icon) — resolved from the
 * config's `options`. No URL label sidecar is needed because static options are
 * always in memory; this just spares callers a value→option lookup.
 */
type StaticSelectExtras<C> =
  C extends SelectFilterConfig<infer V>
    ? {
        /** The full selected option, or `null` when nothing is chosen. */
        selectedOption: FilterOption<V> | null;
      }
    : C extends MultiSelectFilterConfig<infer V>
      ? {
          /** The full selected options, in the config's option order. */
          selectedOptions: FilterOption<V>[];
        }
      : unknown;

/** A `FilterConfig` enriched with its key, current value and handlers — what the UI receives. */
export type ResolvedFilter<C extends FilterConfig = FilterConfig> = C extends unknown
  ? C &
      AsyncResolvedExtras<C> &
      StaticSelectExtras<C> & {
        key: string;
        onChange: (value: FilterValue<C>) => void;
        onClear: () => void;
        value: FilterValue<C>;
      }
  : never;

/** Narrow a `ResolvedFilter` to one concrete kind, e.g. `ResolvedFilterOf<'select'>`. */
export type ResolvedFilterOf<T extends FilterType> = Extract<ResolvedFilter, { type: T }>;

/** The filter kinds able to produce a value assignable to `V` (an API param's type). */
type ConfigFor<V> = [V] extends [boolean]
  ? BooleanFilterConfig
  : [V] extends [number]
    ? number extends V
      ? AsyncSelectFilterConfig<number> | NumberFilterConfig | SelectFilterConfig<number>
      : AsyncSelectFilterConfig<V & FilterPrimitive> | SelectFilterConfig<V & FilterPrimitive>
    : [V] extends [[string, string]]
      ? DateRangeFilterConfig
      : [V] extends [readonly (infer E extends FilterPrimitive)[]]
        ? AsyncMultiSelectFilterConfig<E> | MultiSelectFilterConfig<E>
        : [V] extends [string]
          ? string extends V
            ?
                | AsyncSelectFilterConfig<string>
                | DateFilterConfig
                | SelectFilterConfig<string>
                | TextFilterConfig
            : AsyncSelectFilterConfig<V & FilterPrimitive> | SelectFilterConfig<V & FilterPrimitive> // closed union, e.g. LoanStatus
          : FilterConfig;

/**
 * Constrains a filter config map to an API's list-params type: every key must
 * exist in `P` (pagination keys excluded — `useFilters` owns those) and its
 * config must produce a value assignable to `P[key]`. Pass the params type to
 * `useFilters` to get key autocomplete and checking:
 *
 * @example
 * useFilters<LoanListParams>({
 *   status: f.select({ label: 'Holat', options: loanStatusLabelOptions })
 * });
 *
 * `[P] extends [never]` (no type argument given) falls back to any config map,
 * keeping full per-config inference.
 */
export type FiltersFor<P, PP = PaginationParams> = [P] extends [never]
  ? FilterConfigMap
  : { [K in Exclude<keyof P, keyof PP>]?: ConfigFor<NonNullable<P[K]>> };

/**
 * Per-project constants for a filter setup, injected once through
 * `createFilters` so the hook and the framework-agnostic `resolveFilterParams`
 * share the exact same values. A plain React provider can't do this: it can't
 * reach `resolveFilterParams`, which runs in route loaders outside React and
 * whose whole contract is producing the identical `params` shape. Every option
 * is optional and falls back to a sensible default.
 *
 * `PP` is the pagination shape the API expects, inferred from `mapPagination`,
 * so `params` comes out typed to whatever that returns.
 *
 * @example
 * export const { useFilters, resolveFilterParams, f } = createFilters({
 *   pageKey: 'page',
 *   pageSizeKey: 'per_page',
 *   defaultPageSize: 25,
 *   mapPagination: (page, pageSize) => ({ page, per_page: pageSize })
 * });
 */
export interface FiltersConfig<PP extends Record<string, number> = PaginationParams> {
  /** `date-fns` format used to serialize date values. Defaults to `'yyyy-MM-dd'`. */
  dateFormat?: string;
  /** Page number assumed when the URL has none. Defaults to `1`. */
  defaultPage?: number;
  /** Page size assumed when the URL has none. Defaults to `10`. */
  defaultPageSize?: number;
  /**
   * Translate the human `page` / `pageSize` held in the URL into the pagination
   * params the API expects. Defaults to
   * `{ limit: pageSize, offset: (page - 1) * pageSize }`. The return shape
   * becomes the pagination portion of `params`.
   */
  mapPagination?: (page: number, pageSize: number) => PP;
  /** URL key holding the 1-based page number. Defaults to `'page'`. */
  pageKey?: string;
  /** URL key holding the page size. Defaults to `'page_size'`. */
  pageSizeKey?: string;
}

/**
 * `FiltersConfig` with every default filled in — what `createFilters` hands to
 * the hook and `resolveFilterParams` internally. Not part of the public API.
 */
export type ResolvedFiltersConfig<PP extends Record<string, number> = PaginationParams> = Required<
  FiltersConfig<PP>
>;

/**
 * Default API pagination always included in `params` (unless pagination is
 * disabled). The URL stores human-readable `page` / `page_size`; `params`
 * translates them via `mapPagination` — `{ limit, offset }` by default.
 *
 * A `type` (not an `interface`) so it satisfies the `Record<string, number>`
 * bound used for custom pagination shapes.
 */
export type PaginationParams = {
  limit: number;
  offset: number;
};

/**
 * The strongly-typed `params` object derived from a config map (same keys),
 * plus the pagination params (`PP`, `{ limit, offset }` by default) for the
 * API request.
 */
export type FilterParams<T extends FilterConfigMap, PP = PaginationParams> = {
  [K in keyof T]: FilterValue<T[K]>;
} & PP;
