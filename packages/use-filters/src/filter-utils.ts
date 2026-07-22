import type { FilterConfig } from './types';

/** Reserved suffix for async filters' label-sidecar param. One source of truth for the convention. */
export const LABEL_SUFFIX = '_label';

/** URL key of an async filter's label sidecar (`<key>_label`), so labels survive a refresh. */
export const labelKeyOf = (key: string): string => `${key}${LABEL_SUFFIX}`;

/** Whether `key` is (or collides with) an async filter's label sidecar. See {@link LABEL_SUFFIX}. */
export const isLabelKey = (key: string): boolean => key.endsWith(LABEL_SUFFIX);

/** Async filter kinds carry a label sidecar param. */
export const asyncKindOf = (config: FilterConfig): 'multi' | 'single' | null =>
  config.type === 'asyncSelect' ? 'single' : config.type === 'asyncMultiSelect' ? 'multi' : null;

/** A value counts as "active" when it is set and non-empty. */
export const hasFilterValue = (value: unknown): boolean => {
  if (value === null || value === undefined || value === '') return false;
  if (Array.isArray(value)) return value.some((item) => item !== null && item !== '');
  return true;
};

/**
 * Deep-equal for filter values only — primitives and arrays of primitives
 * (ranges, multi-select arrays). Not general-purpose; avoids a lodash dep.
 */
export const valuesEqual = (a: unknown, b: unknown): boolean => {
  if (a === b) return true;
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((item, index) => valuesEqual(item, b[index]));
  }
  return false;
};
