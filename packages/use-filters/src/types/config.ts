import type { Options as NuqsOptions } from 'nuqs';

import type {
  AsyncMultiSelectFilterMeta,
  AsyncSelectFilterMeta,
  BooleanFilterMeta,
  DateFilterMeta,
  DateRangeFilterMeta,
  FilterOptionMeta,
  MultiSelectFilterMeta,
  NumberFilterMeta,
  NumberRangeFilterMeta,
  SelectFilterMeta,
  TagsFilterMeta,
  TextFilterMeta,
  TimeFilterMeta,
  TimeRangeFilterMeta
} from './meta';
import type { ChoiceToken, ChoiceValueType, FilterPrimitive } from './primitives';

/**
 * Per-filter nuqs URL-update options. Resolution order is
 * `setter call > filter config > useFilters defaults`, so anything set here
 * overrides the hook-level `history` / `shallow` / `clearOnDefault`.
 */
export type FilterNuqsOptions = NuqsOptions;

/**
 * When a filter's change reaches `params`/the URL:
 * - `'instant'` (default) — commit on every change.
 * - `{ debounce: ms }` — show immediately, commit `ms` after the last change.
 * - `'manual'` — show immediately, commit only on `apply()`.
 */
export type FilterCommitMode = 'instant' | 'manual' | { debounce: number };

/**
 * A selectable option for `select` / `multiSelect` (and their async variants).
 * Options are **data** — everything on them flows through to `filters` /
 * `selectedOption(s)` untouched. Rendering hints beyond `label` belong in
 * `meta` (see {@link FilterOptionMeta}).
 */
export interface FilterOption<V extends FilterPrimitive = FilterPrimitive> {
  /** Facet count shown next to the option — e.g. result counts from your backend. */
  count?: number;
  label: string;
  /** Project-specific UI hints for this option. See {@link FilterOptionMeta}. */
  meta?: FilterOptionMeta;
  value: V;
}

/** Every supported filter kind — derived from the config union, never maintained by hand. */
export type FilterType = FilterConfig['type'];

interface FilterBase {
  /**
   * When this filter's change reaches `params`/the URL — `'instant'` (default),
   * `{ debounce: ms }`, or `'manual'` (awaits `apply()`). See {@link FilterCommitMode}.
   */
  commit?: FilterCommitMode;
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
  /** UI hints — see {@link TextFilterMeta}. */
  meta?: TextFilterMeta;
  type: 'text';
}

export interface NumberFilterConfig extends FilterBase {
  defaultValue?: number;
  /** UI hints — see {@link NumberFilterMeta}. */
  meta?: NumberFilterMeta;
  /** `'float'` (default) keeps decimals; `'int'` parses whole numbers only. */
  precision?: 'float' | 'int';
  type: 'number';
}

export interface NumberRangeFilterConfig extends FilterBase {
  /** `[min, max]` */
  defaultValue?: [number, number];
  /** UI hints — see {@link NumberRangeFilterMeta}. */
  meta?: NumberRangeFilterMeta;
  /** `'float'` (default) keeps decimals; `'int'` parses whole numbers only. */
  precision?: 'float' | 'int';
  type: 'numberRange';
}

export interface BooleanFilterConfig extends FilterBase {
  defaultValue?: boolean;
  falseLabel?: string;
  /** UI hints — see {@link BooleanFilterMeta}. */
  meta?: BooleanFilterMeta;
  trueLabel?: string;
  type: 'boolean';
}

export interface DateFilterConfig extends FilterBase {
  /** Formatted date string — `yyyy-MM-dd`, or the datetime format when `precision: 'datetime'`. */
  defaultValue?: string;
  /** UI hints — see {@link DateFilterMeta}. */
  meta?: DateFilterMeta;
  /** `'datetime'` captures date + time (use the `*DateTime` converters). Defaults to `'date'`. */
  precision?: 'date' | 'datetime';
  type: 'date';
}

export interface DateRangeFilterConfig extends FilterBase {
  /** `[from, to]` as formatted date strings (`yyyy-MM-dd`, or the datetime format when `precision: 'datetime'`). */
  defaultValue?: [string, string];
  /** UI hints — see {@link DateRangeFilterMeta}. */
  meta?: DateRangeFilterMeta;
  /** `'datetime'` captures date + time (use the `*DateTime` converters). Defaults to `'date'`. */
  precision?: 'date' | 'datetime';
  type: 'dateRange';
}

export interface TimeFilterConfig extends FilterBase {
  /** Time-of-day string — `HH:mm` (24-hour), or `HH:mm:ss` when `precision: 'second'`. */
  defaultValue?: string;
  /** UI hints — see {@link TimeFilterMeta}. */
  meta?: TimeFilterMeta;
  /** `'minute'` (default) stores `HH:mm`; `'second'` stores `HH:mm:ss`. Wall-clock, no `Date` conversion. */
  precision?: 'minute' | 'second';
  type: 'time';
}

export interface TimeRangeFilterConfig extends FilterBase {
  /** `[from, to]` as time-of-day strings (`HH:mm`, or `HH:mm:ss` when `precision: 'second'`). */
  defaultValue?: [string, string];
  /** UI hints — see {@link TimeRangeFilterMeta}. */
  meta?: TimeRangeFilterMeta;
  /**
   * Granularity of both ends. `'minute'` (the default) stores `HH:mm`;
   * `'second'` stores `HH:mm:ss`. A range may wrap midnight (`from > to`, e.g.
   * `['22:00', '02:00']`); it is stored as-is and interpreted by your API/UI.
   * Defaults to `'minute'`.
   */
  precision?: 'minute' | 'second';
  type: 'timeRange';
}

export interface SelectFilterConfig<
  V extends FilterPrimitive = FilterPrimitive
> extends FilterBase {
  /** Checked against `options` — a value outside them is a compile error. */
  defaultValue?: NoInfer<V>;
  /** UI hints — see {@link SelectFilterMeta}. */
  meta?: SelectFilterMeta;
  options: readonly FilterOption<V>[];
  type: 'select';
  /**
   * How the value round-trips through the URL. Drives `V` (in `f.select`);
   * `options` are checked against it. Required so `resolveFilterParams` (no
   * `options` in a loader) parses the same type. See {@link ChoiceValueType}.
   */
  valueType: ChoiceValueType<NoInfer<V>>;
}

export interface AsyncSelectFilterConfig<
  V extends FilterPrimitive = FilterPrimitive
> extends FilterBase {
  defaultValue?: NoInfer<V>;
  /** UI hints — see {@link AsyncSelectFilterMeta}. */
  meta?: AsyncSelectFilterMeta;
  /** Debounce for the search input, in ms. Defaults to `300`. */
  searchDebounceMs?: number;
  type: 'asyncSelect';
  /**
   * How values round-trip through the URL (`'number'` for ids, `'string'`
   * otherwise). Unlike the static kinds this is *not* `ChoiceValueType<V>`:
   * there are no `options` to check `V` against, so the token drives `V` in
   * `f.asyncSelect` and `loadOptions` returning the other family is caught by a
   * dev-only runtime warning instead.
   */
  valueType: ChoiceToken;
  /**
   * Server-side search; debounced calls collapse into one, `signal` aborts
   * stale ones. Return a small page. Not cached — pair with your data layer.
   */
  loadOptions: (search: string, signal: AbortSignal) => Promise<FilterOption<V>[]>;
}

export interface AsyncMultiSelectFilterConfig<
  V extends FilterPrimitive = FilterPrimitive
> extends FilterBase {
  defaultValue?: readonly NoInfer<V>[];
  /** UI hints — see {@link AsyncMultiSelectFilterMeta}. */
  meta?: AsyncMultiSelectFilterMeta;
  /** Debounce for the search input, in ms. Defaults to `300`. */
  searchDebounceMs?: number;
  type: 'asyncMultiSelect';
  /** How values round-trip through the URL — see {@link AsyncSelectFilterConfig.valueType}. */
  valueType: ChoiceToken;
  /**
   * Server-side search; debounced calls collapse into one, `signal` aborts
   * stale ones. Return a small page. Not cached — pair with your data layer.
   */
  loadOptions: (search: string, signal: AbortSignal) => Promise<FilterOption<V>[]>;
}

export interface MultiSelectFilterConfig<
  V extends FilterPrimitive = FilterPrimitive
> extends FilterBase {
  /** Checked against `options` — values outside them are a compile error. */
  defaultValue?: readonly NoInfer<V>[];
  /** UI hints — see {@link MultiSelectFilterMeta}. */
  meta?: MultiSelectFilterMeta;
  options: readonly FilterOption<V>[];
  type: 'multiSelect';
  /**
   * How values round-trip through the URL. Drives `V` (in `f.multiSelect`);
   * `options` are checked against it. Required for loader parity — see
   * {@link ChoiceValueType}.
   */
  valueType: ChoiceValueType<NoInfer<V>>;
}

export interface TagsFilterConfig extends FilterBase {
  defaultValue?: readonly string[];
  /** UI hints — see {@link TagsFilterMeta}. */
  meta?: TagsFilterMeta;
  type: 'tags';
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
  | NumberRangeFilterConfig
  | SelectFilterConfig
  | TagsFilterConfig
  | TextFilterConfig
  | TimeFilterConfig
  | TimeRangeFilterConfig;

/** The shape `useFilters` accepts: URL param key -> filter config. */
export type FilterConfigMap = Record<string, FilterConfig>;

/** One `[key, config]` pair — the internals iterate configs in this form. */
export type FilterEntry = [key: string, config: FilterConfig];
