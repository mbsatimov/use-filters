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
    VT extends 'number' | 'string',
    const V extends ChoiceBase<VT> = ChoiceBase<VT>,
    const D extends V | undefined = undefined
  >(
    config: Omit<SelectFilterConfig<V>, 'defaultValue' | 'type' | 'valueType'> & {
      valueType: VT;
      defaultValue?: D;
    }
    // `V` stays inferred from `valueType`/`options`; `D` records whether a default
    // was given so `params.<key>` drops `| null`. Cast bridges to the union member.
  ): SelectFilterConfig<V> & ([D] extends [undefined] ? unknown : { defaultValue: V }) =>
    ({ ...config, type: 'select' }) as SelectFilterConfig<V> &
      ([D] extends [undefined] ? unknown : { defaultValue: V }),

  /** Multi-choice from a fixed `options` list; `valueType` required. `params.<key>` → `V[] | null` (non-null with a `defaultValue`). */
  multiSelect: <
    VT extends 'number' | 'string',
    const V extends ChoiceBase<VT> = ChoiceBase<VT>,
    const D extends readonly V[] | undefined = undefined
  >(
    config: Omit<MultiSelectFilterConfig<V>, 'defaultValue' | 'type' | 'valueType'> & {
      valueType: VT;
      defaultValue?: D;
    }
  ): MultiSelectFilterConfig<V> &
    ([D] extends [undefined] ? unknown : { defaultValue: readonly V[] }) =>
    ({ ...config, type: 'multiSelect' }) as MultiSelectFilterConfig<V> &
      ([D] extends [undefined] ? unknown : { defaultValue: readonly V[] }),

  /** Freeform string list — no options, no lookup. `params.<key>` → `string[] | null` (non-null with a `defaultValue`). */
  tags: <C extends Omit<TagsFilterConfig, 'type'>>(config: C): C & { type: 'tags' } =>
    ({ ...config, type: 'tags' }) as C & { type: 'tags' },

  /**
   * Single choice from a **server-searched** list via `loadOptions`. The chosen
   * label is stored alongside the value (`<key>_label`) so it survives a
   * refresh. `valueType` required (`'number'` for ids). `params.<key>` → `V | null`
   * (`V` when a `defaultValue` is given).
   *
   * @example
   * f.asyncSelect({
   *   label: 'Customer',
   *   valueType: 'number',
   *   loadOptions: (search, signal) =>
   *     api.getAll({ params: { search }, signal }).then((l) => l.map((c) => ({ value: c.id, label: c.name })))
   * })
   */
  asyncSelect: <V extends FilterPrimitive, const D extends V | undefined = undefined>(
    config: Omit<AsyncSelectFilterConfig<V>, 'defaultValue' | 'type'> & { defaultValue?: D }
  ): AsyncSelectFilterConfig<V> & ([D] extends [undefined] ? unknown : { defaultValue: V }) =>
    ({ ...config, type: 'asyncSelect' }) as AsyncSelectFilterConfig<V> &
      ([D] extends [undefined] ? unknown : { defaultValue: V }),

  /** Multi-choice variant of `asyncSelect`; values + labels paired in the URL. `params.<key>` → `V[] | null` (non-null with a `defaultValue`). */
  asyncMultiSelect: <
    V extends FilterPrimitive,
    const D extends readonly V[] | undefined = undefined
  >(
    config: Omit<AsyncMultiSelectFilterConfig<V>, 'defaultValue' | 'type'> & { defaultValue?: D }
  ): AsyncMultiSelectFilterConfig<V> &
    ([D] extends [undefined] ? unknown : { defaultValue: readonly V[] }) =>
    ({ ...config, type: 'asyncMultiSelect' }) as AsyncMultiSelectFilterConfig<V> &
      ([D] extends [undefined] ? unknown : { defaultValue: readonly V[] })
};
