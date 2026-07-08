import type {
  AsyncMultiSelectFilterConfig,
  AsyncSelectFilterConfig,
  BooleanFilterConfig,
  DateFilterConfig,
  DateRangeFilterConfig,
  FilterPrimitive,
  MultiSelectFilterConfig,
  NumberFilterConfig,
  SelectFilterConfig,
  TextFilterConfig
} from './types';

/**
 * Filter builders — the intended way to declare filters for `useFilters`.
 *
 * Each builder is a thin `{ ...config, type }` wrapper whose real job is type
 * inference: `f.select` / `f.multiSelect` capture the option values' type `V`
 * per call, so `params` comes out correctly typed with zero annotations.
 *
 * @example
 * const { params, filters } = useFilters({
 *   search: f.text({ label: 'Search' }),
 *   status: f.select({ label: 'Status', options: statusOptions }),
 *   customer_id: f.select({ label: 'Customer', options: customerOptions })
 * });
 * // params.search      -> string | null
 * // params.status      -> Status | null
 * // params.customer_id -> number | null
 */
export const f = {
  /**
   * Single-choice filter over a server-searched entity (e.g. pick a customer
   * by id). Options are fetched per keystroke via `loadOptions`; the selected
   * label is stored in the URL (`<key>_label`), so it survives refreshes with
   * no extra request.
   *
   * @example
   * customer_id: f.asyncSelect({
   *   label: 'Customer',
   *   loadOptions: (search) =>
   *     customerApi.getAll({ params: { search, limit: 20 } })
   *       .then((list) => list.map((c) => ({ value: c.id, label: c.full_name })))
   * })
   */
  asyncSelect: <V extends FilterPrimitive>(
    config: Omit<AsyncSelectFilterConfig<V>, 'type'>
  ): AsyncSelectFilterConfig<V> => ({ ...config, type: 'asyncSelect' }),
  /**
   * Multiple-choice variant of `asyncSelect`. Selected values and their labels
   * are stored as paired arrays in the URL (`<key>` + `<key>_label`), so no
   * by-id endpoint is needed to restore labels after a refresh.
   */
  asyncMultiSelect: <V extends FilterPrimitive>(
    config: Omit<AsyncMultiSelectFilterConfig<V>, 'type'>
  ): AsyncMultiSelectFilterConfig<V> => ({ ...config, type: 'asyncMultiSelect' }),
  boolean: (config: Omit<BooleanFilterConfig, 'type'>): BooleanFilterConfig => ({
    ...config,
    type: 'boolean'
  }),
  date: (config: Omit<DateFilterConfig, 'type'>): DateFilterConfig => ({
    ...config,
    type: 'date'
  }),
  dateRange: (config: Omit<DateRangeFilterConfig, 'type'>): DateRangeFilterConfig => ({
    ...config,
    type: 'dateRange'
  }),
  multiSelect: <const V extends FilterPrimitive>(
    config: Omit<MultiSelectFilterConfig<V>, 'type'>
  ): MultiSelectFilterConfig<V> => ({ ...config, type: 'multiSelect' }),
  number: (config: Omit<NumberFilterConfig, 'type'>): NumberFilterConfig => ({
    ...config,
    type: 'number'
  }),
  select: <const V extends FilterPrimitive>(
    config: Omit<SelectFilterConfig<V>, 'type'>
  ): SelectFilterConfig<V> => ({ ...config, type: 'select' }),
  text: (config: Omit<TextFilterConfig, 'type'>): TextFilterConfig => ({
    ...config,
    type: 'text'
  })
};
