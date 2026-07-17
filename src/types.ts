import type { Options as NuqsOptions } from 'nuqs';
import type * as React from 'react';

/** Primitive types a `select` / `multiSelect` option's value can hold. */
export type FilterPrimitive = number | string;

/**
 * The URL value-type token for a choice filter (`select` / `multiSelect`),
 * constrained to match the option value type `V`:
 *
 * - numeric options (`V` is a number) → must be `'number'`
 * - string options (`V` is a string) → must be `'string'`
 * - dynamic / untyped options (`V` is the open `FilterPrimitive`) → either
 *
 * Because it is checked against `V`, a token that contradicts the options is a
 * compile error. In the `f.select` / `f.multiSelect` builders the token is the
 * declaration — when present it drives `V`, and `options` are checked against
 * it, so the error lands on the mismatched option. The tuple wrappers stop the
 * conditional from distributing over a union of literals (so `1 | 2` resolves
 * to `'number'`, not `'number'`-per-member).
 */
export type ChoiceValueType<V extends FilterPrimitive> = [V] extends [number]
  ? 'number'
  : [V] extends [string]
    ? 'string'
    : 'number' | 'string';

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
export interface NumberRangeFilterMeta extends FilterMeta {}
export interface BooleanFilterMeta extends FilterMeta {}
export interface DateFilterMeta extends FilterMeta {}
export interface DateRangeFilterMeta extends FilterMeta {}
export interface TimeFilterMeta extends FilterMeta {}
export interface TimeRangeFilterMeta extends FilterMeta {}
export interface SelectFilterMeta extends FilterMeta {}
export interface AsyncSelectFilterMeta extends FilterMeta {}
export interface AsyncMultiSelectFilterMeta extends FilterMeta {}
export interface MultiSelectFilterMeta extends FilterMeta {}
export interface TagsFilterMeta extends FilterMeta {}

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

/**
 * When a filter's change reaches `params`/the URL, relative to the `onChange`
 * that triggered it. `useFilters` keeps a local draft of every non-`instant`
 * filter, so the control stays responsive while the committed value waits:
 *
 * - `'instant'` (default) — commit on every change; identical to URL-only state.
 * - `{ debounce: ms }` — show the change immediately, commit `ms` after the
 *   last one (the timer resets on each change). Good for a search box.
 * - `'manual'` — show the change immediately, commit only when `apply()` runs.
 *   Good for a mobile "Apply filters" sheet.
 */
export type FilterCommitMode = 'instant' | 'manual' | { debounce: number };

/**
 * Extension point for per-option UI hints (`FilterOption.meta`) — the option
 * counterpart to {@link FilterMeta}. Augment it once in your app for hints
 * your option rows need (an icon, a color swatch, a shortcut label):
 *
 * @example
 * declare module '@mbsatimov/use-filters' {
 *   interface FilterOptionMeta {
 *     icon?: React.ComponentType;
 *     swatch?: string;
 *   }
 * }
 *
 * // usage:
 * options: [{ label: 'Open', value: 'open', meta: { swatch: '#22c55e' } }]
 */
export interface FilterOptionMeta {}

/**
 * A selectable option for `select` / `multiSelect` (and their async variants).
 * Options are **data** — everything on them flows through to `filters` /
 * `selectedOption(s)` untouched. Rendering hints beyond `label` belong in
 * `meta` (see {@link FilterOptionMeta}).
 */
export interface FilterOption<V extends FilterPrimitive = FilterPrimitive> {
  /** Facet count shown next to the option — e.g. result counts from your backend. */
  count?: number;
  /**
   * @deprecated Rendering hints don't belong on the headless core — declare an
   * `icon` field on {@link FilterOptionMeta} in your app and pass it via
   * `meta` instead (same data, typed by you). Will be removed in 1.0.
   */
  icon?: React.FC<React.SVGProps<SVGSVGElement>>;
  label: string;
  /**
   * @deprecated Like `icon` — move custom row content into `meta` (see
   * {@link FilterOptionMeta}). Will be removed in 1.0.
   */
  leftSlot?: React.ReactNode;
  /** Project-specific UI hints for this option. See {@link FilterOptionMeta}. */
  meta?: FilterOptionMeta;
  /**
   * @deprecated Like `icon` — move custom row content into `meta` (see
   * {@link FilterOptionMeta}). Will be removed in 1.0.
   */
  rightSlot?: React.ReactNode;
  value: V;
}

/** Every supported filter kind — derived from the config union, never maintained by hand. */
export type FilterType = FilterConfig['type'];

interface FilterBase {
  /**
   * @deprecated Styling hints don't belong on the headless core — declare a
   * `className` field on {@link FilterMeta} in your app and pass it via
   * `meta` instead (same data, typed by you). Will be removed in 1.0.
   */
  className?: string;
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
  /** Project-specific UI hints for text filters. See `TextFilterMeta`. */
  meta?: TextFilterMeta;
  type: 'text';
}

export interface NumberFilterConfig extends FilterBase {
  defaultValue?: number;
  /** Project-specific UI hints for number filters. See `NumberFilterMeta`. */
  meta?: NumberFilterMeta;
  /**
   * Numeric precision for URL round-tripping. `'float'` (the default) keeps
   * decimals — e.g. amounts, prices, rates — while `'int'` parses whole numbers
   * only. Defaults to `'float'`.
   */
  precision?: 'float' | 'int';
  type: 'number';
  unit?: string;
}

export interface NumberRangeFilterConfig extends FilterBase {
  /** `[min, max]` */
  defaultValue?: [number, number];
  /** Project-specific UI hints for number-range filters. See `NumberRangeFilterMeta`. */
  meta?: NumberRangeFilterMeta;
  /**
   * Numeric precision for both ends of the range. `'float'` (the default) keeps
   * decimals; `'int'` parses whole numbers only. Defaults to `'float'`.
   */
  precision?: 'float' | 'int';
  type: 'numberRange';
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
  /** Formatted date string — `yyyy-MM-dd`, or the datetime format when `precision: 'datetime'`. */
  defaultValue?: string;
  /** Project-specific UI hints for date filters. See `DateFilterMeta`. */
  meta?: DateFilterMeta;
  /**
   * Whether the filter captures a date or a date **and time**. `'datetime'`
   * switches the bound `toDateTimeValue` / `fromDateTimeValue` converters and
   * signals your UI to render a time picker too. Defaults to `'date'`.
   */
  precision?: 'date' | 'datetime';
  type: 'date';
}

export interface DateRangeFilterConfig extends FilterBase {
  /** `[from, to]` as formatted date strings (`yyyy-MM-dd`, or the datetime format when `precision: 'datetime'`). */
  defaultValue?: [string, string];
  /** Project-specific UI hints for date-range filters. See `DateRangeFilterMeta`. */
  meta?: DateRangeFilterMeta;
  /**
   * Whether each end captures a date or a date **and time**. `'datetime'`
   * switches the bound `toDateTimeValue` / `fromDateTimeValue` converters and
   * signals your UI to render time pickers too. Defaults to `'date'`.
   */
  precision?: 'date' | 'datetime';
  type: 'dateRange';
}

export interface TimeFilterConfig extends FilterBase {
  /** Time-of-day string — `HH:mm` (24-hour), or `HH:mm:ss` when `precision: 'second'`. */
  defaultValue?: string;
  /** Project-specific UI hints for time filters. See `TimeFilterMeta`. */
  meta?: TimeFilterMeta;
  /**
   * Granularity of the time value. `'minute'` (the default) stores `HH:mm`;
   * `'second'` stores `HH:mm:ss`. Times are wall-clock, 24-hour and
   * timezone-free — stored as-is (exactly what an `<input type="time">`
   * produces), so no `Date` conversion is involved. Defaults to `'minute'`.
   */
  precision?: 'minute' | 'second';
  type: 'time';
}

export interface TimeRangeFilterConfig extends FilterBase {
  /** `[from, to]` as time-of-day strings (`HH:mm`, or `HH:mm:ss` when `precision: 'second'`). */
  defaultValue?: [string, string];
  /** Project-specific UI hints for time-range filters. See `TimeRangeFilterMeta`. */
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
  /** Project-specific UI hints for select filters. See `SelectFilterMeta`. */
  meta?: SelectFilterMeta;
  options: readonly FilterOption<V>[];
  type: 'select';
  /**
   * How this filter's value round-trips through the URL — `'number'` or
   * `'string'`. Inferred from `options` when they're static, so you rarely set
   * it. **Set it when the options are fetched at runtime:** the same config is
   * then also used somewhere the options aren't loaded (a route loader calling
   * `resolveFilterParams`), where the inference has nothing to read and the two
   * call sites can otherwise disagree on the value type. An explicit token makes
   * parsing deterministic and identical everywhere. The token is the
   * declaration: in the `f.select` builder it drives the value type, and
   * `options` are checked against it — a mismatched option is a compile error
   * on that option. See {@link ChoiceValueType}.
   */
  valueType?: ChoiceValueType<NoInfer<V>>;
}

export interface AsyncSelectFilterConfig<
  V extends FilterPrimitive = FilterPrimitive
> extends FilterBase {
  defaultValue?: NoInfer<V>;
  /** Project-specific UI hints for async-select filters. See `AsyncSelectFilterMeta`. */
  meta?: AsyncSelectFilterMeta;
  /** Debounce for the search input, in ms. Defaults to `300`. */
  searchDebounceMs?: number;
  type: 'asyncSelect';
  /** How values round-trip through the URL. Defaults to `'number'` (ids). */
  valueType?: 'number' | 'string';
  /**
   * Fetch options matching the search text — search runs server-side. Calls
   * within `searchDebounceMs` of each other collapse into one request, and
   * `signal` aborts stale ones. Return a reasonably small page (e.g.
   * `limit: 20`). Results are **not** cached — pair with your data layer
   * (React Query etc.) if you want caching.
   */
  loadOptions: (search: string, signal: AbortSignal) => Promise<FilterOption<V>[]>;
}

export interface AsyncMultiSelectFilterConfig<
  V extends FilterPrimitive = FilterPrimitive
> extends FilterBase {
  defaultValue?: readonly NoInfer<V>[];
  /** Project-specific UI hints for async-multi-select filters. See `AsyncMultiSelectFilterMeta`. */
  meta?: AsyncMultiSelectFilterMeta;
  /** Debounce for the search input, in ms. Defaults to `300`. */
  searchDebounceMs?: number;
  type: 'asyncMultiSelect';
  /** How values round-trip through the URL. Defaults to `'number'` (ids). */
  valueType?: 'number' | 'string';
  /**
   * Fetch options matching the search text — search runs server-side. Calls
   * within `searchDebounceMs` of each other collapse into one request, and
   * `signal` aborts stale ones. Return a reasonably small page (e.g.
   * `limit: 20`). Results are **not** cached — pair with your data layer
   * (React Query etc.) if you want caching.
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
  /**
   * How this filter's values round-trip through the URL — `'number'` or
   * `'string'`. Inferred from `options` when they're static; **set it when the
   * options are fetched at runtime** so `resolveFilterParams` (which sees no
   * options in a loader) parses the same type the hook does. When set (in the
   * `f.multiSelect` builder) it drives the value type and `options` are
   * checked against it. See {@link ChoiceValueType}.
   */
  valueType?: ChoiceValueType<NoInfer<V>>;
}

export interface TagsFilterConfig extends FilterBase {
  defaultValue?: readonly string[];
  /** Project-specific UI hints for tags filters. See `TagsFilterMeta`. */
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
          : C extends TagsFilterConfig
            ? string[] | null
            : C extends NumberRangeFilterConfig
              ? [number, number] | null
              : C extends NumberFilterConfig
                ? number | null
                : C extends BooleanFilterConfig
                  ? boolean | null
                  : C extends DateRangeFilterConfig
                    ? [string, string] | null
                    : C extends TimeRangeFilterConfig
                      ? [string, string] | null
                      : string | null; // text, date, time

/**
 * A selected entity as reconstructed from the URL: the value plus its label
 * sidecar (`<key>_label`). `label` is `null` when the sidecar is missing —
 * e.g. a hand-edited URL — and the UI falls back to the raw value.
 */
export interface SelectedOption<V extends FilterPrimitive = FilterPrimitive> {
  label: string | null;
  value: V;
}

/**
 * Extra handlers/state async filters get — they write value + label atomically.
 *
 * The handlers use method syntax (`onSelectOption(...)`, not
 * `onSelectOption: (...) =>`) deliberately: TypeScript checks method
 * parameters bivariantly, which is what lets a narrowly-typed resolved filter
 * (`V = 'open' | 'closed'`) be assignable to the wide `ResolvedFilter` union —
 * the relation `filterMap` values, `AnyUseFiltersReturn`, and any
 * `ResolvedFilter`-typed prop all rely on. The unsafe direction (assigning a
 * wide filter where a narrow one is expected) stays rejected via the
 * covariant `value`/`selectedOption` properties. The lint rule banning method
 * syntax exists to prevent accidental bivariance — here it's the point, hence
 * the targeted disables.
 */
type AsyncResolvedExtras<C> =
  C extends AsyncSelectFilterConfig<infer V>
    ? {
        /** Select an option (or `null` to clear) — writes value and label sidecar together. */
        // eslint-disable-next-line ts/method-signature-style -- intentional bivariance, see doc comment
        onSelectOption(option: FilterOption<V> | null): void;
        /** Current selection paired with its URL-stored label. */
        selectedOption: SelectedOption<V> | null;
      }
    : C extends AsyncMultiSelectFilterConfig<infer V>
      ? {
          /** Replace the whole selection at once (batch apply from the mobile sheet). */
          // eslint-disable-next-line ts/method-signature-style -- intentional bivariance, see doc comment
          onSetOptions(options: FilterOption<V>[]): void;
          /** Toggle an option in/out of the selection — keeps value/label arrays paired. */
          // eslint-disable-next-line ts/method-signature-style -- intentional bivariance, see doc comment
          onToggleOption(option: FilterOption<V>): void;
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

/**
 * A single filter as your UI receives it: everything from the original config
 * (`label`, `placeholder`, `options`, `meta`, …) plus its live `key`, current
 * `value`, and ready-made handlers. This is an element of the hook's `filters`
 * array and a value in its `filterMap`.
 *
 * Every resolved filter has `value`, `onChange(value)` and `onClear()`. Choice
 * filters additionally expose the resolved option object(s) — `selectedOption`
 * / `selectedOptions` — so you can show the chosen label without a lookup, and
 * async ones add option-aware setters (`onSelectOption`, `onToggleOption`, …).
 *
 * @example
 * function StatusControl(filter: ResolvedFilterOf<'select'>) {
 *   return (
 *     <select
 *       value={filter.value ?? ''}
 *       onChange={(e) => filter.onChange(e.target.value || null)}
 *     >
 *       <option value="">{filter.placeholder ?? filter.label}</option>
 *       {filter.options.map((o) => (
 *         <option key={o.value} value={o.value}>{o.label}</option>
 *       ))}
 *     </select>
 *   );
 * }
 */
export type ResolvedFilter<C extends FilterConfig = FilterConfig> = C extends unknown
  ? Omit<C, 'commit'> &
      AsyncResolvedExtras<C> &
      StaticSelectExtras<C> & {
        /**
         * Commit this filter's pending change right now, whatever its `commit`
         * mode — flushes a running debounce timer, or applies a `manual` change.
         * A no-op when `isDirty` is `false`. Scoped version of the hook's
         * whole-set `apply()`.
         */
        apply: () => void;
        /**
         * Discard this filter's pending change — it reverts to `committedValue`
         * on the next render. A no-op when `isDirty` is `false`. Scoped version
         * of the hook's whole-set `cancel()`.
         */
        cancel: () => void;
        /**
         * This filter's *effective* `commit` mode — the per-filter config if it
         * set one, otherwise the resolved default (`useFilters`' `defaultCommit`
         * option, then `createFilters`'). Always present (unlike the optional
         * `commit` on the config), since a resolved filter always has one.
         */
        commit: FilterCommitMode;
        /**
         * This filter's value as currently committed in `params`/the URL —
         * independent of any pending draft. Equal to `value` unless `isDirty`.
         * Read this (not `value`) if you want "what will actually be fetched",
         * e.g. to show a draft-vs-committed diff.
         */
        committedValue: FilterValue<C>;
        /** The debounce delay in ms when `commit` resolves to `{ debounce }`; `null` otherwise. */
        debounceMs: number | null;
        /** `true` when `commit` resolves to `{ debounce }` for this filter. */
        isDebounced: boolean;
        /**
         * `true` while this filter has a change that hasn't reached `params`/the
         * URL yet — a running debounce timer, or a manual change awaiting
         * `apply()`. Always `false` for `commit: 'instant'` (the default).
         */
        isDirty: boolean;
        /**
         * `true` when this filter is active: its **committed** value differs
         * from `defaultValue` (or, with no default, simply holds a non-empty
         * value). Unlike the hook's whole-set `isFiltered`, this doesn't
         * exclude `hidden` filters — it's just this one filter's own state.
         * Right for anything reflecting what's actually applied (a "N filters
         * applied" badge). For UI that should react to the draft immediately —
         * e.g. hiding a "Clear" button the instant the control empties, even
         * before a `commit: 'manual'` change is applied — use `isFilteredDraft`.
         */
        isFiltered: boolean;
        /**
         * Same check as `isFiltered`, but against the **draft** `value` instead
         * of `committedValue`. Equal to `isFiltered` unless `isDirty`.
         */
        isFilteredDraft: boolean;
        /** `true` when `commit` resolves to `'instant'` for this filter (the default). */
        isInstant: boolean;
        /** `true` when `commit` resolves to `'manual'` for this filter. */
        isManual: boolean;
        /**
         * Set this filter back to its `defaultValue` (or empty, with none)
         * **immediately**, bypassing `commit` — cancels any pending draft for
         * this filter and commits straight to `params`/the URL, even on a
         * `manual`/`{ debounce }` filter. Scoped, mode-bypassing counterpart to
         * `reset` — the same relationship `setFilter` has to `onChange` at the
         * hook level. Use this for a "Clear" button that should always act
         * instantly, whatever the filter's commit mode.
         */
        instantReset: () => void;
        key: string;
        // Method syntax on purpose — bivariant params keep a narrow resolved
        // filter assignable to the wide `ResolvedFilter` union (see
        // `AsyncResolvedExtras`' doc comment).
        // eslint-disable-next-line ts/method-signature-style -- intentional bivariance
        onChange(value: FilterValue<C>): void;
        /**
         * @deprecated Use `reset` instead — same behavior, kept as an alias
         * (identical function reference). Will be removed in a future major
         * version.
         */
        onClear: () => void;
        /**
         * Set this filter back to its `defaultValue` (or empty, with none).
         * Like any change, this respects the filter's `commit` mode — on a
         * `manual`/`{ debounce }` filter it lands in the draft and waits for
         * `apply()`, same as `onChange` would. (For an immediate, mode-bypassing
         * reset of *every* filter at once, see the hook's whole-set `reset()`,
         * which is a different, harder operation.)
         */
        reset: () => void;
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
      ? DateRangeFilterConfig | TimeRangeFilterConfig
      : [V] extends [[number, number]]
        ? NumberRangeFilterConfig
        : [V] extends [readonly (infer E extends FilterPrimitive)[]]
          ? string extends E
            ? AsyncMultiSelectFilterConfig<E> | MultiSelectFilterConfig<E> | TagsFilterConfig
            : AsyncMultiSelectFilterConfig<E> | MultiSelectFilterConfig<E>
          : [V] extends [string]
            ? string extends V
              ? | AsyncSelectFilterConfig<string>
                | DateFilterConfig
                | SelectFilterConfig<string>
                | TextFilterConfig
                | TimeFilterConfig
              : | AsyncSelectFilterConfig<V & FilterPrimitive>
                | SelectFilterConfig<V & FilterPrimitive> // closed union, e.g. LoanStatus
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
 * How the URL's `page` / `perPage` map to the URL query keys, where page
 * numbering starts, and the page defaults. Grouped under
 * {@link FiltersConfig.pagination}.
 *
 * The API params **mirror the URL keys**: with the default `pageKey: 'page'` /
 * `perPageKey: 'per_page'`, `params` comes out `{ page, per_page }`; rename the
 * keys and `params` follows — name them `page` / `page_size` and you get
 * `{ page, page_size }`. `PageKey` / `PerPageKey` are inferred from the literal
 * key names so `params` is typed to match. There is no separate API-shape mapping
 * to keep in sync; for an API that wants a different shape (e.g. offset-based),
 * derive it at your fetch call from `params.page` / `params[perPageKey]`.
 *
 * @example
 * // params: { page, page_size }
 * pagination: { pageKey: 'page', perPageKey: 'page_size', defaultPerPage: 25 }
 *
 * @example
 * // 0-indexed API: the first page is 0 (URL and params both start at 0)
 * pagination: { firstPage: 0 }
 */
export interface PaginationConfig<
  PageKey extends string = string,
  PerPageKey extends string = string
> {
  /** Per-page count assumed when the URL has none. Defaults to `10`. */
  defaultPerPage?: number;
  /**
   * The number your first page is counted from — the value used when the URL has
   * no page, what "reset to the first page" writes, and the base your backend
   * pages from. Defaults to `1` (1-based); set it to `0` for a 0-indexed API, so
   * the first page is `page=0` in both the URL and `params`.
   */
  firstPage?: number;
  /** URL key holding the page number, and its key in `params`. Defaults to `'page'`. */
  pageKey?: PageKey;
  /** URL key holding the per-page count, and its key in `params`. Defaults to `'per_page'`. */
  perPageKey?: PerPageKey;
  /**
   * Whether changing a filter resets the page to `firstPage`. Defaults to
   * `true` — a changed filter invalidates the old result window, so staying on
   * page 7 of results that no longer exist is almost never right. Set `false`
   * when pagination is driven entirely outside this hook and it should never
   * write the page param; this also applies to the whole-set `reset()`.
   * Overridable per call (see {@link PaginationOverride}).
   */
  resetPageOnFilterChange?: boolean;
}

/**
 * Per-call pagination override — the `pagination` field of `useFilters` /
 * `resolveFilterParams` options.
 *
 * - `false` disables pagination entirely for this call (no `page` / `per_page`
 *   in `params`, no reset-to-first-page on change).
 * - `true` (or omitted) keeps the factory's pagination as-is.
 * - An object overrides only the *safe* per-call fields — `defaultPerPage` and
 *   `resetPageOnFilterChange` — for this call, merged over the factory. Safe
 *   because neither changes the `params` shape or the URL keys. The
 *   page/per-page **keys** and `firstPage` are deliberately not overridable
 *   here: they come from `createFilters` so the hook's `params` stays
 *   byte-identical to what `resolveFilterParams` produces (see
 *   {@link FiltersConfig}).
 */
export type PaginationOverride =
  boolean | Pick<PaginationConfig, 'defaultPerPage' | 'resetPageOnFilterChange'>;

/**
 * The options `useFilters` and `resolveFilterParams` share — the two fields
 * that must be *identical* between them for their `params` to match (a
 * different `arraySeparator` parses an array-shaped value differently; a
 * different `pagination` override changes whether/how page keys appear).
 * `UseFiltersOptions` extends this rather than the reverse: everything it adds
 * on top (`defaultCommit`, `meta`, `history`, `shallow`, `clearOnDefault`) is
 * hook-only UI behavior that `resolveFilterParams` doesn't take and can't
 * disagree on. `resolveFilterParams`'s own `options` parameter is typed
 * against this directly (not a hand-copied duplicate), so the two can't drift
 * out of sync — see `defineFilters`, which binds both to one instance of it.
 */
export interface SharedFilterCallOptions {
  /**
   * Delimiter joining/splitting an array-shaped param's items in the URL for
   * this call, overriding the `createFilters` config. Defaults to the
   * factory's `arraySeparator` (`','` unless set). See
   * {@link FiltersConfig.arraySeparator}.
   */
  arraySeparator?: string;
  /**
   * Pagination for this call, overriding the `createFilters` config: `false`
   * turns it off, `true` (default) keeps the factory's, and an object
   * overrides the per-call-safe fields (`defaultPerPage`,
   * `resetPageOnFilterChange`). The page/per-page keys and `firstPage` stay
   * factory-only. See {@link PaginationOverride}.
   */
  pagination?: PaginationOverride;
}

/**
 * How `date` filters (de)serialize between a stored URL string and a `Date`.
 * Grouped under {@link FiltersConfig.date}. Override in pairs (`parse` +
 * `serialize`, `parseDateTime` + `serializeDateTime`) so each is an exact
 * inverse. Defaults are the fixed `yyyy-MM-dd` / `yyyy-MM-dd'T'HH:mm:ss` shapes.
 */
export interface DateConfig {
  /**
   * Parse a stored date string back into a `Date` — the inverse of `serialize`.
   * Defaults to parsing the fixed `yyyy-MM-dd` format. This is the customization
   * hook: override it (together with `serialize`) to store dates any way you
   * like — a `dd.MM.yyyy` UI, month names, or a timezone-aware / non-Gregorian
   * date library (Day.js, Luxon, Temporal, …).
   */
  parse?: (value: string) => Date | undefined;
  /** Datetime counterpart of `parse` (for `precision: 'datetime'` filters). */
  parseDateTime?: (value: string) => Date | undefined;
  /**
   * Serialize a `Date` into the string stored in the URL. Defaults to the fixed
   * `yyyy-MM-dd` format; override (together with `parse`) to store dates in
   * whatever shape or library your app uses.
   */
  serialize?: (date: Date) => string;
  /** Datetime counterpart of `serialize` (for `precision: 'datetime'` filters). */
  serializeDateTime?: (date: Date) => string;
}

/**
 * Per-project constants for a filter setup, injected once through
 * `createFilters` so the hook and the framework-agnostic `resolveFilterParams`
 * share the exact same values. A plain React provider can't do this: it can't
 * reach `resolveFilterParams`, which runs in route loaders outside React and
 * whose whole contract is producing the identical `params` shape. Every option
 * is optional and falls back to a sensible default.
 *
 * Constants are grouped by concern: {@link PaginationConfig | `pagination`}
 * (URL keys, page defaults, and where numbering starts) and
 * {@link DateConfig | `date`} (date (de)serialization). `params` mirrors the
 * pagination URL keys, so the pagination shape is inferred from the key names.
 *
 * @example
 * export const { useFilters, resolveFilterParams, f } = createFilters({
 *   pagination: {
 *     pageKey: 'page',
 *     perPageKey: 'per_page',
 *     defaultPerPage: 25
 *   }
 * });
 * // params: { page, per_page, ...filters }
 */
export interface FiltersConfig<
  PageKey extends string = string,
  PerPageKey extends string = string
> {
  /**
   * Delimiter joining/splitting an array-shaped param's items in the URL —
   * `multiSelect`, `asyncMultiSelect`, `tags`, and the range kinds
   * (`numberRange`/`dateRange`/`timeRange`). Defaults to `','`. Change it if a
   * comma can appear inside an item's own value (or your backend just expects
   * something else), or if it collides with a comma used elsewhere in your URL
   * scheme. Overridable per `useFilters`/`resolveFilterParams` call (their
   * `arraySeparator` option).
   */
  arraySeparator?: string;
  /** Date (de)serialization for `date` filters. See {@link DateConfig}. */
  date?: DateConfig;
  /**
   * Default `commit` mode for every filter this factory's hook renders, unless
   * overridden per `useFilters` call (its `defaultCommit` option) or per filter
   * (its `commit` config). Defaults to `'instant'`. See {@link FilterCommitMode}.
   */
  defaultCommit?: FilterCommitMode;
  /** URL keys, page defaults, and where numbering starts. See {@link PaginationConfig}. */
  pagination?: PaginationConfig<PageKey, PerPageKey>;
}

/**
 * `FiltersConfig` with every default filled in and flattened — what
 * `createFilters` hands to the hook and `resolveFilterParams` internally. Not
 * part of the public config surface (`createFilters` takes the nested
 * `FiltersConfig`); this is the normalized form the internals consume.
 */
export interface ResolvedFiltersConfig {
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
 * Default API pagination included in `params` (unless pagination is disabled),
 * for the default `page` / `per_page` URL keys. `params` mirrors the keys, so
 * the values pass straight through under those names; rename the keys and this
 * shape changes to match.
 *
 * A `type` (not an `interface`) so it satisfies the `Record<string, number>`
 * bound used for custom pagination shapes (interfaces lack an implicit index
 * signature and would not be assignable).
 */
// eslint-disable-next-line ts/consistent-type-definitions -- must stay a type alias (see above)
export type PaginationParams = {
  page: number;
  per_page: number;
};

/**
 * The strongly-typed `params` object derived from a config map (same keys),
 * plus the pagination params (`PP`, `{ page, per_page }` by default) for the
 * API request.
 */
export type FilterParams<T extends FilterConfigMap, PP = PaginationParams> = {
  [K in keyof T]: FilterValue<T[K]>;
} & PP;
