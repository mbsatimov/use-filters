import type {
  AsyncMultiSelectFilterConfig,
  AsyncSelectFilterConfig,
  BooleanFilterConfig,
  ChoiceBase,
  ChoiceToken,
  DateFilterConfig,
  DateRangeFilterConfig,
  MultiSelectFilterConfig,
  NumberFilterConfig,
  NumberRangeFilterConfig,
  SelectFilterConfig,
  TagsFilterConfig,
  TextFilterConfig,
  TimeFilterConfig,
  TimeRangeFilterConfig
} from './types';

/**
 * The config a choice builder accepts: the kind's own config `C` with
 * `defaultValue` narrowed to `Captured` (whatever the call site passed, or
 * `undefined`) and `valueType` to the captured token `VT` (which drives the
 * value type `V`). `type` is added by the builder, never by the caller.
 */
type ChoiceInput<C, VT extends ChoiceToken, Captured> = Omit<
  C,
  'defaultValue' | 'type' | 'valueType'
> & {
  defaultValue?: Captured;
  valueType: VT;
};

/**
 * What a choice builder returns: the kind's config `C`, plus a **required**
 * `defaultValue: Declared` when the call site actually passed one — that
 * presence is what lets `params` drop `| null` for defaulted filters, so this
 * must stay in lockstep with `HasDefault` in `types/values.ts` (pinned by the
 * `ChoiceResult ↔ HasDefault tie` tests). `Captured` answers *whether* a default
 * was given; `Declared` is the widened type the result advertises for it.
 */
type ChoiceResult<C, Captured, Declared> = C &
  ([Captured] extends [undefined] ? unknown : { defaultValue: Declared });

/**
 * `f` — the filter builders. The map key becomes the URL query param; the
 * builder decides how it's parsed and what type shows up in `params`. Each is a
 * tiny `{ ...config, type }` wrapper whose real job is capturing types so
 * `params` is correctly typed with no annotations: the option value type, and
 * whether a `defaultValue` was given (a filter with a default never resolves to
 * `null`, so `params.<key>` drops the `| null`).
 *
 * ```ts
 * const { params } = useFilters({
 *   search:      f.text({ label: 'Search' }),        // params.search      -> string | null
 *   per_page:    f.number({ label: 'Per page', defaultValue: 25 }), // -> number (never null)
 *   status:      f.select({ label: 'Status', valueType: 'string', options }), // -> Status | null
 *   customer_id: f.asyncSelect({ label: 'Customer', valueType: 'number', loadOptions }) // -> number | null
 * });
 * ```
 */
export const f = {
  /** Free-text filter (search box). `params.<key>` → `string | null` (`string` with a `defaultValue`). */
  text: <C extends Omit<TextFilterConfig, 'type'>>(config: C): C & { type: 'text' } =>
    ({ ...config, type: 'text' }) as C & { type: 'text' },

  /** Numeric filter; keeps decimals unless `precision: 'int'`. `params.<key>` → `number | null` (`number` with a `defaultValue`). */
  number: <C extends Omit<NumberFilterConfig, 'type'>>(config: C): C & { type: 'number' } =>
    ({ ...config, type: 'number' }) as C & { type: 'number' },

  /** Numeric `[min, max]` range. `params.<key>` → `[number, number] | null` (non-null with a `defaultValue`). */
  numberRange: <C extends Omit<NumberRangeFilterConfig, 'type'>>(
    config: C
  ): C & { type: 'numberRange' } =>
    ({ ...config, type: 'numberRange' }) as C & { type: 'numberRange' },

  /** On/off filter. `params.<key>` → `boolean | null` (`boolean` with a `defaultValue`). */
  boolean: <C extends Omit<BooleanFilterConfig, 'type'>>(config: C): C & { type: 'boolean' } =>
    ({ ...config, type: 'boolean' }) as C & { type: 'boolean' },

  /**
   * Single-date filter — a formatted string (default `yyyy-MM-dd`); convert
   * with `toDateValue`/`fromDateValue` (or the `*DateTime` pair when
   * `precision: 'datetime'`). `params.<key>` → `string | null` (`string` with a `defaultValue`).
   */
  date: <C extends Omit<DateFilterConfig, 'type'>>(config: C): C & { type: 'date' } =>
    ({ ...config, type: 'date' }) as C & { type: 'date' },

  /** From–to date range of formatted strings. `params.<key>` → `[string, string] | null` (non-null with a `defaultValue`). */
  dateRange: <C extends Omit<DateRangeFilterConfig, 'type'>>(
    config: C
  ): C & { type: 'dateRange' } => ({ ...config, type: 'dateRange' }) as C & { type: 'dateRange' },

  /** Time-of-day (no date) — `HH:mm`, or `HH:mm:ss` with `precision: 'second'`. `params.<key>` → `string | null` (`string` with a `defaultValue`). */
  time: <C extends Omit<TimeFilterConfig, 'type'>>(config: C): C & { type: 'time' } =>
    ({ ...config, type: 'time' }) as C & { type: 'time' },

  /** From–to time-of-day range; may wrap midnight (`from > to`). `params.<key>` → `[string, string] | null` (non-null with a `defaultValue`). */
  timeRange: <C extends Omit<TimeRangeFilterConfig, 'type'>>(
    config: C
  ): C & { type: 'timeRange' } => ({ ...config, type: 'timeRange' }) as C & { type: 'timeRange' },

  /**
   * Single choice from a fixed `options` list. `params.<key>` → `V | null`
   * (`V` when a `defaultValue` is given).
   *
   * `valueType` (`'number' | 'string'`) is required and `options` are checked
   * against it — required (not inferred) so `resolveFilterParams`, which sees no
   * `options` in a loader, parses the same type the hook does.
   *
   * @example
   * f.select({ label: 'Customer', valueType: 'number', options: [] }) // params -> number | null
   */
  select: <
    VT extends ChoiceToken,
    const V extends ChoiceBase<VT> = ChoiceBase<VT>,
    const D extends V | undefined = undefined
  >(
    // `V` is inferred from `valueType`/`options`; `D` records whether a default
    // was given so `params.<key>` drops `| null`. Cast bridges to the union member.
    config: ChoiceInput<SelectFilterConfig<V>, VT, D>
  ): ChoiceResult<SelectFilterConfig<V>, D, V> =>
    ({ ...config, type: 'select' }) as ChoiceResult<SelectFilterConfig<V>, D, V>,

  /** Multi-choice from a fixed `options` list; `valueType` required. `params.<key>` → `V[] | null` (non-null with a `defaultValue`). */
  multiSelect: <
    VT extends ChoiceToken,
    const V extends ChoiceBase<VT> = ChoiceBase<VT>,
    const D extends readonly V[] | undefined = undefined
  >(
    config: ChoiceInput<MultiSelectFilterConfig<V>, VT, D>
  ): ChoiceResult<MultiSelectFilterConfig<V>, D, readonly V[]> =>
    ({ ...config, type: 'multiSelect' }) as ChoiceResult<
      MultiSelectFilterConfig<V>,
      D,
      readonly V[]
    >,

  /** Freeform string list — no options, no lookup. `params.<key>` → `string[] | null` (non-null with a `defaultValue`). */
  tags: <C extends Omit<TagsFilterConfig, 'type'>>(config: C): C & { type: 'tags' } =>
    ({ ...config, type: 'tags' }) as C & { type: 'tags' },

  /**
   * Single choice from a **server-searched** list via `loadOptions`. The chosen
   * label is stored alongside the value (`<key>_label`) so it survives a
   * refresh. `valueType` is required and **drives the value type**:
   * `'number'` → `params.<key>` is `number | null`, `'string'` → `string | null`
   * (non-null with a `defaultValue`). A `loadOptions` that resolves to anything
   * other than `FilterOption<V>[]` — including `undefined` from optional
   * chaining — is an error at its own line, never a silently widened param.
   *
   * @example
   * f.asyncSelect({
   *   label: 'Customer',
   *   valueType: 'number',
   *   loadOptions: (search, signal) =>
   *     api.getAll({ params: { search }, signal }).then((l) => l.map((c) => ({ value: c.id, label: c.name })))
   * })
   */
  // Unlike `select`, `V` is exactly what `valueType` declares — a server-searched
  // option page is open-ended, so its values must never narrow `V` to literals.
  asyncSelect: <VT extends ChoiceToken, const D extends ChoiceBase<VT> | undefined = undefined>(
    config: ChoiceInput<AsyncSelectFilterConfig<ChoiceBase<VT>>, VT, D>
  ): ChoiceResult<AsyncSelectFilterConfig<ChoiceBase<VT>>, D, ChoiceBase<VT>> =>
    ({ ...config, type: 'asyncSelect' }) as ChoiceResult<
      AsyncSelectFilterConfig<ChoiceBase<VT>>,
      D,
      ChoiceBase<VT>
    >,

  /** Multi-choice variant of `asyncSelect`; values + labels paired in the URL. `valueType` drives the value type. `params.<key>` → `V[] | null` (non-null with a `defaultValue`). */
  asyncMultiSelect: <
    VT extends ChoiceToken,
    const D extends readonly ChoiceBase<VT>[] | undefined = undefined
  >(
    config: ChoiceInput<AsyncMultiSelectFilterConfig<ChoiceBase<VT>>, VT, D>
  ): ChoiceResult<AsyncMultiSelectFilterConfig<ChoiceBase<VT>>, D, readonly ChoiceBase<VT>[]> =>
    ({ ...config, type: 'asyncMultiSelect' }) as ChoiceResult<
      AsyncMultiSelectFilterConfig<ChoiceBase<VT>>,
      D,
      readonly ChoiceBase<VT>[]
    >
};
