import type { Options as NuqsOptions } from 'nuqs';

/** Primitive types a `select` / `multiSelect` option's value can hold. */
export type FilterPrimitive = number | string;

/** Every non-null value one of our nuqs parsers can produce/serialize. */
export type FilterParserValue = boolean | number | string | number[] | string[];

/**
 * The URL value-type token for a choice filter, constrained to match the option
 * type `V` (number → `'number'`, string → `'string'`). The tuple wrappers stop
 * the conditional distributing over a union (so `1 | 2` resolves to `'number'`).
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
 * Per-kind `meta` extension points — augment only the kinds you need (like
 * TanStack's `ColumnMeta`), each checked against its own interface.
 *
 * @example
 * declare module '@mbsatimov/use-filters' {
 *   interface SelectFilterMeta { group?: 'primary' | 'advanced' }
 * }
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
 * Extension point for `useFilters`' hook-level `meta` — whole-set UI hints.
 * Augment like {@link FilterMeta}.
 */
export interface FiltersMeta {}

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
 * Extension point for per-option UI hints (`FilterOption.meta`) — augment for
 * an icon, color swatch, etc. The option counterpart to {@link FilterMeta}.
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
  /** How values round-trip through the URL (`'number'` for ids, `'string'` otherwise). */
  valueType: 'number' | 'string';
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
  /** How values round-trip through the URL (`'number'` for ids, `'string'` otherwise). */
  valueType: 'number' | 'string';
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

/**
 * Whether a config was given a `defaultValue`. A filter with a default never
 * resolves to `null` at runtime (nuqs `withDefault`, and reset/clear fall back
 * to it), so its value type drops the `| null`. An absent — or explicitly
 * `undefined` — default stays nullable.
 */
type HasDefault<C> = C extends { defaultValue: infer D }
  ? [D] extends [undefined]
    ? false
    : true
  : false;

/** A filter's base value type, made nullable unless the config carries a `defaultValue`. */
type MaybeNull<C, B> = HasDefault<C> extends true ? B : B | null;

/**
 * Maps a `FilterConfig` to the type of the value it stores (and exposes in
 * `params`). `null` is included only when the filter has no `defaultValue` —
 * with one, the value is always at least the default.
 */
export type FilterValue<C extends FilterConfig> =
  C extends SelectFilterConfig<infer V>
    ? MaybeNull<C, V>
    : C extends AsyncSelectFilterConfig<infer V>
      ? MaybeNull<C, V>
      : C extends AsyncMultiSelectFilterConfig<infer V>
        ? MaybeNull<C, V[]>
        : C extends MultiSelectFilterConfig<infer V>
          ? MaybeNull<C, V[]>
          : C extends TagsFilterConfig
            ? MaybeNull<C, string[]>
            : C extends NumberRangeFilterConfig
              ? MaybeNull<C, [number, number]>
              : C extends NumberFilterConfig
                ? MaybeNull<C, number>
                : C extends BooleanFilterConfig
                  ? MaybeNull<C, boolean>
                  : C extends DateRangeFilterConfig
                    ? MaybeNull<C, [string, string]>
                    : C extends TimeRangeFilterConfig
                      ? MaybeNull<C, [string, string]>
                      : MaybeNull<C, string>; // text, date, time

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
 * Extra handlers/state async filters get. The handlers use **method syntax**
 * on purpose: method params are checked bivariantly, which is what keeps a
 * narrow resolved filter assignable to the wide `ResolvedFilter` union (the
 * unsafe direction stays rejected via covariant `value`/`selectedOption`).
 * Hence the targeted `method-signature-style` disables.
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
 * selected option object(s) — value + label (+ count, custom `meta`) — resolved
 * from the config's `options`. No URL label sidecar is needed because static options are
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
 * A single filter as your UI receives it: everything from the config plus its
 * live `key`, current `value`, and ready-made handlers. An element of the hook's
 * `filters` array and a value in `filterMap`. Choice filters also expose the
 * resolved `selectedOption(s)`; async ones add option-aware setters.
 */
export type ResolvedFilter<C extends FilterConfig = FilterConfig> = C extends unknown
  ? Omit<C, 'commit'> &
      AsyncResolvedExtras<C> &
      StaticSelectExtras<C> & {
        /** Commit this filter's pending change now, bypassing `commit`. No-op when not `isDirty`. */
        apply: () => void;
        /** Discard this filter's pending change, reverting to `committedValue`. No-op when not `isDirty`. */
        cancel: () => void;
        /** This filter's *effective* `commit` mode (per-filter config, else the resolved default). */
        commit: FilterCommitMode;
        /** The committed (URL) value, independent of any pending draft. Equals `value` unless `isDirty`. */
        committedValue: FilterValue<C>;
        /** Debounce delay (ms) when `commit` is `{ debounce }`, else `null`. */
        debounceMs: number | null;
        /** `true` when `commit` resolves to `{ debounce }`. */
        isDebounced: boolean;
        /** `true` while a change hasn't reached the URL yet (debounce pending, or manual awaiting `apply()`). */
        isDirty: boolean;
        /**
         * `true` when this filter's **committed** value is active (differs from
         * default, or non-empty). Per-filter — doesn't exclude `hidden`. Use
         * `isFilteredDraft` for UI reacting to the draft before commit.
         */
        isFiltered: boolean;
        /** Like `isFiltered`, but against the **draft** value. Equals `isFiltered` unless `isDirty`. */
        isFilteredDraft: boolean;
        /** `true` when `commit` resolves to `'instant'` (the default). */
        isInstant: boolean;
        /** `true` when `commit` resolves to `'manual'`. */
        isManual: boolean;
        /** Reset to default **immediately**, bypassing `commit` (the mode-bypassing counterpart to `reset`). */
        instantReset: () => void;
        key: string;
        // Method syntax on purpose — bivariant params keep a narrow resolved
        // filter assignable to the wide `ResolvedFilter` union (see `AsyncResolvedExtras`).
        // `| null` so a defaulted filter can still be cleared back to its default.
        // eslint-disable-next-line ts/method-signature-style -- intentional bivariance
        onChange(value: FilterValue<C> | null): void;
        /** Reset to default, **respecting** `commit` (stays a draft on manual/debounced filters). */
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
 * Requires the config kind's own `defaultValue` field, made non-optional.
 * Distributes over the {@link ConfigFor} union so each member demands *its*
 * default shape (`V` for selects, `readonly V[]` for multi-selects, tuples for
 * ranges, …). The `f.*` builders capture `defaultValue` presence in their
 * return type, which is what makes this checkable.
 */
type RequireDefault<C> = C extends { defaultValue?: infer D }
  ? C & { defaultValue: NonNullable<D> }
  : never;

/**
 * The config constraint for one API param, derived from the param's
 * nullability: a nullable param (`null` in its type) may leave `defaultValue`
 * unset — `null` in `params` is representable. A non-nullable param **must**
 * set `defaultValue`, since without one an unset filter resolves to `null` at
 * runtime, which the param's type says is impossible.
 */
type ConfigForParam<V> = null extends V
  ? ConfigFor<NonNullable<V>>
  : RequireDefault<ConfigFor<NonNullable<V>>>;

/**
 * Constrains a filter config map to an API's list-params type (pagination keys
 * excluded — `useFilters` owns those). Pass the params type to `useFilters` to
 * get key autocomplete and checking. The obligations mirror `P`'s own shape, so
 * `params` can be typed as exactly `P`:
 *
 * - a **required** key in `P` must have a filter declared; an optional (`?:`)
 *   key may omit one (the key is then absent from `params`).
 * - a **non-nullable** param must set `defaultValue` (it can never be `null`);
 *   a `| null` param may leave it unset.
 *
 * @example
 * interface LoanListParams {
 *   status: LoanStatus | null; // required + nullable -> filter required, default optional
 *   sort?: 'date' | 'price';   // optional + non-null -> filter optional; default required if declared
 *   page: number;
 *   per_page: number;
 * }
 * useFilters<LoanListParams>({
 *   status: f.select({ label: 'Holat', valueType: 'string', options: loanStatusLabelOptions })
 * });
 *
 * `[P] extends [never]` (no type argument given) falls back to any config map,
 * keeping full per-config inference.
 */
export type FiltersFor<P, PP = PaginationParams> = [P] extends [never]
  ? FilterConfigMap
  : [Exclude<keyof P, keyof PP>] extends [never]
    ? // `P` declares no filter params (only pagination): reject any config key
      // here, at the config. An empty mapped type would be `{}`, which accepts
      // anything and defers the error to `params.<key>`; the `never` index
      // value makes a declared filter a compile error instead.
      Record<string, never>
    : {
        [K in Exclude<keyof P, keyof PP> as undefined extends P[K] ? K : never]?: ConfigForParam<
          Exclude<P[K], undefined>
        >;
      } & {
        [K in Exclude<keyof P, keyof PP> as undefined extends P[K] ? never : K]-?: ConfigForParam<
          P[K]
        >;
      };

/**
 * The **loose** config-map shape for `P` — optional keys, no default
 * requirement. This (not {@link FiltersFor}) is the generic *bound* and
 * default* for `T`: the strict contract in bound position makes the checker
 * expand its enriched config unions through every `ResolvedFilter` in the
 * return type — a multi-GB blowup (same hazard `FilterMapOf` documents). The
 * contract is instead enforced once, concretely, at the `configs` parameter
 * (`T & FiltersFor<P, PP>`); in the explicit-`P` path `T` is never inferred
 * (TS has no partial type-argument inference), so the loose bound costs
 * nothing.
 */
export type FiltersForBound<P, PP = PaginationParams> = [P] extends [never]
  ? FilterConfigMap
  : { [K in Exclude<keyof P, keyof PP>]?: ConfigFor<NonNullable<P[K]>> };

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
 * Per-project constants injected once through `createFilters`, so the hook and
 * `resolveFilterParams` share the exact same values (a provider can't reach the
 * loader, which runs outside React). Every option falls back to a default.
 */
export interface FiltersConfig<
  PageKey extends string = string,
  PerPageKey extends string = string
> {
  /** Delimiter for array-shaped params in the URL. Defaults to `','`. */
  arraySeparator?: string;
  /** Date (de)serialization for `date` filters. See {@link DateConfig}. */
  date?: DateConfig;
  /** Default `commit` mode for this factory's filters. Defaults to `'instant'`. */
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
 * The strongly-typed `params` object derived from a config map (same keys),
 * plus the pagination params (`PP`, `{ page, per_page }` by default) for the
 * API request.
 */
export type FilterParams<T extends FilterConfigMap, PP = PaginationParams> = {
  [K in keyof T]: FilterValue<T[K]>;
} & PP;

/** Any value nuqs can serialize for our parsers, or `null` for "unset". */
export type ParamValue = FilterParserValue | null;

/**
 * The kind-independent fields every resolved filter carries — the contract the
 * `resolveFilter` site (use-filters.ts) is compile-checked against. Kind-specific
 * extras are assembled separately. {@link ResolvedFilter} is the public per-kind
 * view; a type test ties them so they can't drift. Internal (not re-exported).
 */
export interface ResolvedFilterBase {
  commit: FilterCommitMode;
  committedValue: ParamValue;
  debounceMs: number | null;
  isDebounced: boolean;
  isDirty: boolean;
  isFiltered: boolean;
  isFilteredDraft: boolean;
  isInstant: boolean;
  isManual: boolean;
  key: string;
  value: ParamValue;
  apply: () => void;
  cancel: () => void;
  instantReset: () => void;
  // Method syntax on purpose — bivariant params keep each variant's narrowly
  // typed `onChange` assignable to this base (see {@link AsyncResolvedExtras}).
  // eslint-disable-next-line ts/method-signature-style -- intentional bivariance, see comment
  onChange(value: ParamValue): void;
  reset: () => void;
}

/**
 * What triggered a committed `params` change, passed to `onParamsChange`:
 *
 * - `'change'` — a filter value changed (`onChange`, `setFilter`, `apply`, or a
 *   debounced commit).
 * - `'reset'` — filters were cleared to defaults (`reset` or `instantReset`).
 * - `'external'` — the change came from outside the hook: a back/forward
 *   navigation, another URL consumer, or a pagination write you own.
 */
export type ParamsChangeCause = 'change' | 'external' | 'reset';

/** Context passed to {@link UseFiltersListeners.onParamsChange}. */
export interface ParamsChangeContext<
  P = never,
  PP extends Record<string, number> = PaginationParams,
  T extends FiltersForBound<P, PP> = FiltersForBound<P, PP>
> {
  /** The whole `useFilters` return — read state and call methods from here. */
  api: UseFiltersReturn<P, PP, T>;
  /** What triggered this change. See {@link ParamsChangeCause}. */
  cause: ParamsChangeCause;
  /** The new committed params. */
  params: ParamsOf<P, T, PP>;
  /** The committed params before this change (for diffing). */
  prev: ParamsOf<P, T, PP>;
}

/**
 * Side-effect listeners for `useFilters`, à la TanStack Form. Each fires in an
 * effect (never during render), so calling side-effects — or even the hook's
 * own methods via `ctx.api` — is safe. Note: calling a *mutating* method inside
 * `onParamsChange` triggers another change; guard against loops with `cause`.
 */
export interface UseFiltersListeners<
  P = never,
  PP extends Record<string, number> = PaginationParams,
  T extends FiltersForBound<P, PP> = FiltersForBound<P, PP>
> {
  /** Fires whenever committed `params` change (respects debounce/manual commit). */
  onParamsChange?: (ctx: ParamsChangeContext<P, PP, T>) => void;
}

/**
 * `useFilters`' per-call options. Extends {@link SharedFilterCallOptions}
 * (`arraySeparator`, `pagination`) — the two fields `resolveFilterParams`
 * also takes, and must agree with for their `params` to match — with
 * hook-only UI behavior that has no loader counterpart.
 */
export interface UseFiltersOptions<
  P = never,
  PP extends Record<string, number> = PaginationParams,
  T extends FiltersForBound<P, PP> = FiltersForBound<P, PP>
> extends SharedFilterCallOptions {
  /** Remove a param from the URL when it is cleared. Defaults to `true`. */
  clearOnDefault?: boolean;
  /** Default `commit` mode for this call's filters (per-filter `commit` wins). Defaults to `'instant'`. */
  defaultCommit?: FilterCommitMode;
  /** How URL updates affect history. Defaults to `'replace'`. */
  history?: 'push' | 'replace';
  /** Side-effect listeners — e.g. `onParamsChange`. See {@link UseFiltersListeners}. */
  listeners?: UseFiltersListeners<P, PP, T>;
  /** Whole-set UI hints, echoed back on the return. Augment {@link FiltersMeta} to type it. */
  meta?: FiltersMeta;
  /** Keep navigation client-side. Defaults to `true`. */
  shallow?: boolean;
}

/**
 * The `params` shape: exactly the API params type `P` when one is given (plus
 * pagination `PP`), otherwise computed per config from the inferred map.
 *
 * The explicit-`P` arm mirrors `P` **without** `Partial`: {@link FiltersFor}'s
 * obligations (required key -> filter declared; non-nullable param ->
 * `defaultValue` set) make `P`'s own shape hold at runtime, so `params` is
 * directly assignable to the API's params type — soundly.
 */
export type ParamsOf<P, T extends Record<string, FilterConfig | undefined>, PP> = [P] extends [
  never
]
  ? FilterParams<{ [K in keyof T]-?: NonNullable<T[K]> }, PP>
  : Omit<P, keyof PP> & PP;

/**
 * Filter keys/values only (pagination stripped) — the domain of `setFilter`.
 * Bound to `Record<string, FilterConfig | undefined>` for the same reason as
 * `FilterMapOf` below — see its doc comment.
 */
export type FilterValues<P, T extends Record<string, FilterConfig | undefined>, PP> = Omit<
  ParamsOf<P, T, PP>,
  keyof PP
>;

/**
 * The `filterMap` shape: each key maps to *its own* config's `ResolvedFilter`
 * variant (a plain `Record<keyof T, ResolvedFilter>` would collapse `onChange`'s
 * param to `null` — union functions are contravariant on params).
 *
 * Bound to plain `Record<string, FilterConfig | undefined>`, NOT `FiltersFor<P>`:
 * a conditional type as a generic bound referencing a sibling generic (`P`)
 * sends the checker into a multi-GB blowup, even fully concrete. `T` is always
 * structurally compatible with this looser bound.
 */
export type FilterMapOf<T extends Record<string, FilterConfig | undefined>> = {
  [K in keyof T]-?: ResolvedFilter<NonNullable<T[K]>>;
};

export interface UseFiltersReturn<
  P = never,
  PP extends Record<string, number> = PaginationParams,
  T extends FiltersForBound<P, PP> = FiltersForBound<P, PP>
> {
  /** Same filters as `filters`, keyed by config key (includes hidden ones). */
  filterMap: FilterMapOf<T>;
  /** Resolved filters (config + value + handlers) — pass to your filter UI. Excludes hidden. */
  filters: ResolvedFilter[];
  /** `true` when at least one filter has an uncommitted change (debounce pending or manual). */
  isDirty: boolean;
  /** `true` when at least one visible filter is active. */
  isFiltered: boolean;
  /** The `meta` passed to `useFilters` (or `{}`). */
  meta: FiltersMeta;
  /** Current committed values + pagination. Pass straight to your fetcher / use as a query key. */
  params: ParamsOf<P, T, PP>;
  /**
   * `params` serialized to a deterministic, sorted string — a stable cache key
   * (same state always produces the same string). Handy as a React Query key or
   * memo dependency when you'd rather compare a string than an object.
   */
  paramsStr: string;
  /** Commit every pending change at once (the "Apply" action). No-op when nothing is pending. */
  apply: () => void;
  /** Discard every pending change, reverting to committed values. */
  cancel: () => void;
  /**
   * Reset every filter to its default, **bypassing** commit modes — one batched
   * URL write. The whole-set twin of a filter's `instantReset()`; use for "Clear all".
   */
  instantReset: () => void;
  /**
   * Reset every filter to its default, **respecting** each one's commit mode
   * (manual/debounced stage a draft until `apply()`). For immediate, use `instantReset`.
   */
  reset: () => void;
  /** Imperatively set one filter's value (resets to the first page, bypasses `commit`). */
  setFilter: <K extends keyof FilterValues<P, T, PP>>(
    key: K,
    value: FilterValues<P, T, PP>[K] | null
  ) => void;
}

/**
 * The return of *any* `useFilters` call, for pass-through components (a shared
 * toolbar, debug panel, mobile sheet) that take a `useFilters` return as a prop
 * without generics. Every concrete return is assignable to this.
 *
 * Config-independent fields are inherited from {@link UseFiltersReturn} (one
 * source of truth — a new field there shows up here for free); only the three
 * key/value-typed fields are erased below.
 */
export interface AnyUseFiltersReturn extends Omit<
  UseFiltersReturn,
  'filterMap' | 'params' | 'setFilter'
> {
  /** Same as the concrete return's `filterMap`, keyed by `string`. Includes hidden filters. */
  filterMap: Record<string, ResolvedFilter>;
  /** Current values (plus pagination) — `unknown` since the keys aren't known here. */
  params: Record<string, unknown>;
  /** Uncallable (`never` keys): a pass-through component doesn't know the config's keys. */
  setFilter: (key: never, value: never) => void;
}
