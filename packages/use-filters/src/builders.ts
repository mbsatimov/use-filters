import type {
  AsyncMultiSelectFilterConfig,
  AsyncSelectFilterConfig,
  BooleanFilterConfig,
  DateFilterConfig,
  DateRangeFilterConfig,
  FilterPrimitive,
  MultiSelectFilterConfig,
  NumberFilterConfig,
  NumberRangeFilterConfig,
  SelectFilterConfig,
  TagsFilterConfig,
  TextFilterConfig,
  TimeFilterConfig,
  TimeRangeFilterConfig
} from './types';

/** The base primitive a `valueType` token declares; `options` are checked against it. */
type ChoiceBase<VT extends 'number' | 'string'> = VT extends 'number' ? number : string;

/**
 * `f` — the filter builders. The map key becomes the URL query param; the
 * builder decides how it's parsed and what type shows up in `params`. Each is a
 * tiny `{ ...config, type }` wrapper whose real job is capturing option value
 * types so `params` is correctly typed with no annotations.
 *
 * ```ts
 * const { params } = useFilters({
 *   search:      f.text({ label: 'Search' }),        // params.search      -> string | null
 *   min_amount:  f.number({ label: 'Min amount' }),  // params.min_amount  -> number | null
 *   status:      f.select({ label: 'Status', valueType: 'string', options }), // -> Status | null
 *   customer_id: f.asyncSelect({ label: 'Customer', valueType: 'number', loadOptions }) // -> number | null
 * });
 * ```
 */
export const f = {
  /** Free-text filter (search box). `params.<key>` → `string | null`. */
  text: (config: Omit<TextFilterConfig, 'type'>): TextFilterConfig => ({
    ...config,
    type: 'text'
  }),

  /** Numeric filter; keeps decimals unless `precision: 'int'`. `params.<key>` → `number | null`. */
  number: (config: Omit<NumberFilterConfig, 'type'>): NumberFilterConfig => ({
    ...config,
    type: 'number'
  }),

  /** Numeric `[min, max]` range. `params.<key>` → `[number, number] | null`. */
  numberRange: (config: Omit<NumberRangeFilterConfig, 'type'>): NumberRangeFilterConfig => ({
    ...config,
    type: 'numberRange'
  }),

  /** On/off filter. `params.<key>` → `boolean | null`. */
  boolean: (config: Omit<BooleanFilterConfig, 'type'>): BooleanFilterConfig => ({
    ...config,
    type: 'boolean'
  }),

  /**
   * Single-date filter — a formatted string (default `yyyy-MM-dd`); convert
   * with `toDateValue`/`fromDateValue` (or the `*DateTime` pair when
   * `precision: 'datetime'`). `params.<key>` → `string | null`.
   */
  date: (config: Omit<DateFilterConfig, 'type'>): DateFilterConfig => ({
    ...config,
    type: 'date'
  }),

  /** From–to date range of formatted strings. `params.<key>` → `[string, string] | null`. */
  dateRange: (config: Omit<DateRangeFilterConfig, 'type'>): DateRangeFilterConfig => ({
    ...config,
    type: 'dateRange'
  }),

  /** Time-of-day (no date) — `HH:mm`, or `HH:mm:ss` with `precision: 'second'`. `params.<key>` → `string | null`. */
  time: (config: Omit<TimeFilterConfig, 'type'>): TimeFilterConfig => ({
    ...config,
    type: 'time'
  }),

  /** From–to time-of-day range; may wrap midnight (`from > to`). `params.<key>` → `[string, string] | null`. */
  timeRange: (config: Omit<TimeRangeFilterConfig, 'type'>): TimeRangeFilterConfig => ({
    ...config,
    type: 'timeRange'
  }),

  /**
   * Single choice from a fixed `options` list. `params.<key>` → `V | null`.
   *
   * `valueType` (`'number' | 'string'`) is required and `options` are checked
   * against it — required (not inferred) so `resolveFilterParams`, which sees no
   * `options` in a loader, parses the same type the hook does.
   *
   * @example
   * f.select({ label: 'Customer', valueType: 'number', options: [] }) // params -> number | null
   */
  select: <VT extends 'number' | 'string', const V extends ChoiceBase<VT> = ChoiceBase<VT>>(
    config: Omit<SelectFilterConfig<V>, 'type' | 'valueType'> & { valueType: VT }
  ): SelectFilterConfig<V> =>
    // Cast bridges `VT` to the interface's `ChoiceValueType<V>` — the constraint guarantees they agree.
    ({ ...config, type: 'select' }) as SelectFilterConfig<V>,

  /** Multi-choice from a fixed `options` list; `valueType` required. `params.<key>` → `V[] | null`. */
  multiSelect: <VT extends 'number' | 'string', const V extends ChoiceBase<VT> = ChoiceBase<VT>>(
    config: Omit<MultiSelectFilterConfig<V>, 'type' | 'valueType'> & { valueType: VT }
  ): MultiSelectFilterConfig<V> =>
    ({ ...config, type: 'multiSelect' }) as MultiSelectFilterConfig<V>,

  /** Freeform string list — no options, no lookup. `params.<key>` → `string[] | null`. */
  tags: (config: Omit<TagsFilterConfig, 'type'>): TagsFilterConfig => ({
    ...config,
    type: 'tags'
  }),

  /**
   * Single choice from a **server-searched** list via `loadOptions`. The chosen
   * label is stored alongside the value (`<key>_label`) so it survives a
   * refresh. `valueType` required (`'number'` for ids). `params.<key>` → `V | null`.
   *
   * @example
   * f.asyncSelect({
   *   label: 'Customer',
   *   valueType: 'number',
   *   loadOptions: (search, signal) =>
   *     api.getAll({ params: { search }, signal }).then((l) => l.map((c) => ({ value: c.id, label: c.name })))
   * })
   */
  asyncSelect: <V extends FilterPrimitive>(
    config: Omit<AsyncSelectFilterConfig<V>, 'type'>
  ): AsyncSelectFilterConfig<V> => ({ ...config, type: 'asyncSelect' }),

  /** Multi-choice variant of `asyncSelect`; values + labels paired in the URL. `params.<key>` → `V[] | null`. */
  asyncMultiSelect: <V extends FilterPrimitive>(
    config: Omit<AsyncMultiSelectFilterConfig<V>, 'type'>
  ): AsyncMultiSelectFilterConfig<V> => ({ ...config, type: 'asyncMultiSelect' })
};
