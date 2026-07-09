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
  DateFilterConfig,
  DateFilterMeta,
  DateRangeFilterConfig,
  DateRangeFilterMeta,
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
  TextFilterMeta
} from './types';
export type { UseFiltersOptions, UseFiltersReturn } from './use-filters';

/**
 * Zero-config default instance — a `useFilters` / `resolveFilterParams` pair
 * using the built-in defaults (`page` / `page_size` URL keys, `{ limit, offset }`
 * params, `yyyy-MM-dd` dates). Import these directly to skip `createFilters`, or
 * call `createFilters(...)` to bind your own constants.
 */
const defaultFilters = createFilters();

export const useFilters = defaultFilters.useFilters;
export const resolveFilterParams = defaultFilters.resolveFilterParams;
