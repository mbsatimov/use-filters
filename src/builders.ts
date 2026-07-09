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
  TextFilterConfig
} from './types';

/**
 * `f` — the filter builders. Use these to declare each filter you pass to
 * `useFilters`; the map key becomes the URL query param, and the builder you
 * pick decides how that param is parsed and what type shows up in `params`.
 *
 * ```ts
 * const { params } = useFilters({
 *   search:      f.text({ label: 'Search' }),        // params.search      -> string | null
 *   min_amount:  f.number({ label: 'Min amount' }),  // params.min_amount  -> number | null
 *   active:      f.boolean({ label: 'Active' }),      // params.active      -> boolean | null
 *   status:      f.select({ label: 'Status', options: statusOptions }),      // -> Status | null
 *   customer_id: f.asyncSelect({ label: 'Customer', loadOptions })           // -> number | null
 * });
 * ```
 *
 * A builder is just a tiny `{ ...config, type }` wrapper. Its real job is
 * type inference: `f.select` / `f.multiSelect` capture the exact type of your
 * option values, and `f.asyncSelect` / `f.asyncMultiSelect` capture theirs, so
 * `params` comes out correctly typed with no manual annotations.
 */
export const f = {
  /**
   * Free-text filter, e.g. a search box. Stored and returned as a string.
   *
   * `params.<key>` → `string | null`
   *
   * @example
   * search: f.text({ label: 'Search', placeholder: 'Name or email' })
   */
  text: (config: Omit<TextFilterConfig, 'type'>): TextFilterConfig => ({
    ...config,
    type: 'text'
  }),

  /**
   * Numeric filter. Keeps decimals by default (amounts, prices, rates); pass
   * `precision: 'int'` to parse whole numbers only.
   *
   * `params.<key>` → `number | null`
   *
   * @example
   * min_amount: f.number({ label: 'Min amount', unit: '$' })
   * page_count: f.number({ label: 'Pages', precision: 'int' })
   */
  number: (config: Omit<NumberFilterConfig, 'type'>): NumberFilterConfig => ({
    ...config,
    type: 'number'
  }),

  /**
   * Numeric from–to range (price/amount/age "between"). The value is a
   * `[min, max]` pair. Like `number`, keeps decimals by default; pass
   * `precision: 'int'` for whole numbers only.
   *
   * `params.<key>` → `[number, number] | null`
   *
   * @example
   * price: f.numberRange({ label: 'Price', unit: '$' })
   * // in your UI: filter.onChange([min, max])
   */
  numberRange: (config: Omit<NumberRangeFilterConfig, 'type'>): NumberRangeFilterConfig => ({
    ...config,
    type: 'numberRange'
  }),

  /**
   * On/off filter, e.g. a toggle or a two-way switch. Use `trueLabel` /
   * `falseLabel` to label each state in your UI.
   *
   * `params.<key>` → `boolean | null`
   *
   * @example
   * is_active: f.boolean({ label: 'Status', trueLabel: 'Active', falseLabel: 'Archived' })
   */
  boolean: (config: Omit<BooleanFilterConfig, 'type'>): BooleanFilterConfig => ({
    ...config,
    type: 'boolean'
  }),

  /**
   * Single-date filter. The value is a formatted date string (default
   * `yyyy-MM-dd`); convert to/from a `Date` with `toDateValue` / `fromDateValue`.
   * Pass `precision: 'datetime'` to capture a date **and** time — then use the
   * `toDateTimeValue` / `fromDateTimeValue` converters instead.
   *
   * `params.<key>` → `string | null`
   *
   * @example
   * created_at: f.date({ label: 'Created' })
   * // in your UI:  onChange(toDateValue(pickedDate))
   * //              const date = fromDateValue(filter.value)
   *
   * @example
   * // date + time
   * starts_at: f.date({ label: 'Starts at', precision: 'datetime' })
   * // onChange(toDateTimeValue(pickedDate)); fromDateTimeValue(filter.value)
   */
  date: (config: Omit<DateFilterConfig, 'type'>): DateFilterConfig => ({
    ...config,
    type: 'date'
  }),

  /**
   * From–to date range. The value is a `[from, to]` pair of formatted date
   * strings (default `yyyy-MM-dd`). Pass `precision: 'datetime'` for a date +
   * time range (use `toDateTimeValue` / `fromDateTimeValue` for each end).
   *
   * `params.<key>` → `[string, string] | null`
   *
   * @example
   * period: f.dateRange({ label: 'Period' })
   * window: f.dateRange({ label: 'Window', precision: 'datetime' })
   */
  dateRange: (config: Omit<DateRangeFilterConfig, 'type'>): DateRangeFilterConfig => ({
    ...config,
    type: 'dateRange'
  }),

  /**
   * Single choice from a fixed, in-memory list of `options`. The option
   * values' type flows straight into `params`, so a status enum stays a status
   * enum and an id stays a number.
   *
   * `params.<key>` → `V | null` (where `V` is your option value type)
   *
   * @example
   * status: f.select({
   *   label: 'Status',
   *   options: [
   *     { label: 'Open', value: 'open' },
   *     { label: 'Closed', value: 'closed' }
   *   ]
   * })
   * // params.status -> 'open' | 'closed' | null
   */
  select: <const V extends FilterPrimitive>(
    config: Omit<SelectFilterConfig<V>, 'type'>
  ): SelectFilterConfig<V> => ({ ...config, type: 'select' }),

  /**
   * Multiple choices from a fixed, in-memory list of `options`.
   *
   * `params.<key>` → `V[] | null`
   *
   * @example
   * tags: f.multiSelect({ label: 'Tags', options: tagOptions })
   */
  multiSelect: <const V extends FilterPrimitive>(
    config: Omit<MultiSelectFilterConfig<V>, 'type'>
  ): MultiSelectFilterConfig<V> => ({ ...config, type: 'multiSelect' }),

  /**
   * Freeform multi-value text — a list of arbitrary strings the user types in,
   * with **no** predefined `options` and no server lookup. Use for "tags
   * contains", keyword lists, arbitrary ids pasted in, etc. (For a fixed list
   * use `multiSelect`; for a server-searched one use `asyncMultiSelect`.)
   *
   * `params.<key>` → `string[] | null`
   *
   * @example
   * tags: f.tags({ label: 'Tags', placeholder: 'Add a tag…' })
   * // in your UI: filter.onChange([...(filter.value ?? []), newTag])
   */
  tags: (config: Omit<TagsFilterConfig, 'type'>): TagsFilterConfig => ({
    ...config,
    type: 'tags'
  }),

  /**
   * Single choice from a **server-searched** list — e.g. pick a customer by id
   * from thousands. Options are fetched (debounced) via `loadOptions` as the
   * user types, so nothing is held in memory up front.
   *
   * The chosen label is saved to the URL alongside the value (`<key>_label`),
   * so the selection still shows its name after a refresh or a shared link —
   * no by-id lookup needed. Values round-trip as numbers by default; set
   * `valueType: 'string'` for string ids.
   *
   * `params.<key>` → `V | null` (the value only — the label is never sent to your API)
   *
   * @example
   * customer_id: f.asyncSelect({
   *   label: 'Customer',
   *   loadOptions: (search, signal) =>
   *     customerApi
   *       .getAll({ params: { search, limit: 20 }, signal })
   *       .then((list) => list.map((c) => ({ value: c.id, label: c.full_name })))
   * })
   */
  asyncSelect: <V extends FilterPrimitive>(
    config: Omit<AsyncSelectFilterConfig<V>, 'type'>
  ): AsyncSelectFilterConfig<V> => ({ ...config, type: 'asyncSelect' }),

  /**
   * Multiple-choice variant of `asyncSelect`. Values and their labels are kept
   * as paired arrays in the URL (`<key>` + `<key>_label`), so every chosen
   * option still renders with its name after a refresh — without a by-id
   * endpoint.
   *
   * `params.<key>` → `V[] | null`
   *
   * @example
   * owner_ids: f.asyncMultiSelect({
   *   label: 'Owners',
   *   loadOptions: (search, signal) =>
   *     userApi.search(search, signal).then((u) => u.map((x) => ({ value: x.id, label: x.name })))
   * })
   */
  asyncMultiSelect: <V extends FilterPrimitive>(
    config: Omit<AsyncMultiSelectFilterConfig<V>, 'type'>
  ): AsyncMultiSelectFilterConfig<V> => ({ ...config, type: 'asyncMultiSelect' })
};
