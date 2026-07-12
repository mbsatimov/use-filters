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
} from './lib';
export type {
  AsyncMultiSelectFilterConfig,
  AsyncMultiSelectFilterMeta,
  AsyncSelectFilterConfig,
  AsyncSelectFilterMeta,
  BooleanFilterConfig,
  BooleanFilterMeta,
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
  PaginationParams,
  ResolvedFilter,
  ResolvedFilterOf,
  ResolvedFiltersConfig,
  SelectedOption,
  SelectFilterConfig,
  SelectFilterMeta,
  TagsFilterConfig,
  TagsFilterMeta,
  TextFilterConfig,
  TextFilterMeta,
  TimeFilterConfig,
  TimeFilterMeta,
  TimeRangeFilterConfig,
  TimeRangeFilterMeta
} from './types';
export type { UseFiltersOptions, UseFiltersReturn } from './use-filters';

/**
 * Zero-config default instance — a `useFilters` / `resolveFilterParams` pair
 * using the built-in defaults (`page` / `per_page` URL keys mirrored straight
 * into `params`, `yyyy-MM-dd` dates). Import these directly to skip `createFilters`, or
 * call `createFilters(...)` to bind your own constants.
 */
const defaultFilters = createFilters();

export const useFilters = defaultFilters.useFilters;
export const resolveFilterParams = defaultFilters.resolveFilterParams;
