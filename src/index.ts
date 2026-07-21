import { createFilters } from './create-filters';

export { f } from './builders';
export { createFilters } from './create-filters';
export type { Filters } from './create-filters';
export {
  DATE_FORMAT,
  DATE_TIME_FORMAT,
  fromDateTimeValue,
  fromDateValue,
  toDateTimeValue,
  toDateValue
} from './dates';
export { DEFAULT_ARRAY_SEPARATOR } from './parsers';
export type { RawSearchParams } from './search';
export type {
  AsyncMultiSelectFilterConfig,
  AsyncMultiSelectFilterMeta,
  AsyncSelectFilterConfig,
  AsyncSelectFilterMeta,
  BooleanFilterConfig,
  BooleanFilterMeta,
  ChoiceValueType,
  DateConfig,
  DateFilterConfig,
  DateFilterMeta,
  DateRangeFilterConfig,
  DateRangeFilterMeta,
  FilterCommitMode,
  FilterConfig,
  FilterConfigMap,
  FilterMeta,
  FilterNuqsOptions,
  FilterOption,
  FilterOptionMeta,
  FilterParams,
  FilterPrimitive,
  FiltersConfig,
  FiltersFor,
  FiltersMeta,
  FilterType,
  FilterValue,
  MultiSelectFilterConfig,
  MultiSelectFilterMeta,
  NumberFilterConfig,
  NumberFilterMeta,
  NumberRangeFilterConfig,
  NumberRangeFilterMeta,
  PaginationConfig,
  PaginationOverride,
  PaginationParams,
  ParamsChangeCause,
  ParamsChangeContext,
  ResolvedFilter,
  ResolvedFilterOf,
  ResolvedFiltersConfig,
  SelectedOption,
  SelectFilterConfig,
  SelectFilterMeta,
  SharedFilterCallOptions,
  TagsFilterConfig,
  TagsFilterMeta,
  TextFilterConfig,
  TextFilterMeta,
  TimeFilterConfig,
  TimeFilterMeta,
  TimeRangeFilterConfig,
  TimeRangeFilterMeta,
  UseFiltersListeners
} from './types';
export type { AnyUseFiltersReturn, UseFiltersOptions, UseFiltersReturn } from './types';

/**
 * Zero-config default instance using the built-in defaults (`page`/`per_page`
 * keys, `yyyy-MM-dd` dates). Import these to skip `createFilters`, or call
 * `createFilters(...)` to bind your own constants.
 */
const defaultFilters = createFilters();

export const useFilters = defaultFilters.useFilters;
export const resolveFilterParams = defaultFilters.resolveFilterParams;
export const defineFilters = defaultFilters.defineFilters;
