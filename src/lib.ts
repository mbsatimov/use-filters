import type { SingleParserBuilder } from 'nuqs';

import { format, isValid } from 'date-fns';
import { parseAsArrayOf, parseAsBoolean, parseAsInteger, parseAsString } from 'nuqs';

import type { FilterConfig, FilterOption } from './types';

/** Default date storage/serialization format (matches the common API `yyyy-MM-dd`). */
export const DATE_FORMAT = 'yyyy-MM-dd';

/** Default URL key holding the 1-based page number. */
export const DEFAULT_PAGE_KEY = 'page';
/** Default URL key holding the page size. */
export const DEFAULT_PAGE_SIZE_KEY = 'page_size';
/** Default page number when the URL has none. */
export const DEFAULT_PAGE = 1;
/** Default page size when the URL has none. */
export const DEFAULT_PAGE_SIZE = 10;

/** `Date` -> stored string, using `dateFormat` (defaults to {@link DATE_FORMAT}). */
export const toDateValue = (date: Date, dateFormat: string = DATE_FORMAT): string =>
  format(date, dateFormat);

/** Stored string -> `Date` (or `undefined` when empty/invalid). */
export const fromDateValue = (value?: string | null): Date | undefined => {
  if (!value) return undefined;
  const date = new Date(value);
  return isValid(date) ? date : undefined;
};

/**
 * Whether a `select` / `multiSelect`'s options hold numbers, so the URL param
 * round-trips as `number | null` instead of `string | null`.
 */
const isNumeric = (options: readonly FilterOption[]): boolean =>
  typeof options[0]?.value === 'number';

/** Apply `defaultValue` (when provided) so an absent URL param resolves to it. */
const withOptionalDefault = <T>(
  parser: SingleParserBuilder<T>,
  defaultValue: NonNullable<T> | undefined
) => (defaultValue === undefined ? parser : parser.withDefault(defaultValue));

/**
 * Pick the right nuqs parser for a filter kind. The two casts undo type
 * erasure: `FilterConfig` unions select/multiSelect over `string | number`,
 * but `isNumeric` has already re-established which family the values are —
 * the `f.*` builders guarantee `defaultValue` matches `options`.
 */
export const buildParser = (config: FilterConfig) => {
  switch (config.type) {
    case 'asyncMultiSelect':
      return config.valueType === 'string'
        ? withOptionalDefault(
            parseAsArrayOf(parseAsString),
            config.defaultValue as string[] | undefined
          )
        : withOptionalDefault(
            parseAsArrayOf(parseAsInteger),
            config.defaultValue as number[] | undefined
          );
    case 'asyncSelect':
      return config.valueType === 'string'
        ? withOptionalDefault(parseAsString, config.defaultValue as string | undefined)
        : withOptionalDefault(parseAsInteger, config.defaultValue as number | undefined);
    case 'boolean':
      return withOptionalDefault(parseAsBoolean, config.defaultValue);
    case 'dateRange':
      return withOptionalDefault(parseAsArrayOf(parseAsString), config.defaultValue);
    case 'multiSelect':
      return isNumeric(config.options)
        ? withOptionalDefault(
            parseAsArrayOf(parseAsInteger),
            config.defaultValue as number[] | undefined
          )
        : withOptionalDefault(
            parseAsArrayOf(parseAsString),
            config.defaultValue as string[] | undefined
          );
    case 'number':
      return withOptionalDefault(parseAsInteger, config.defaultValue);
    case 'select':
      return isNumeric(config.options)
        ? withOptionalDefault(parseAsInteger, config.defaultValue as number | undefined)
        : withOptionalDefault(parseAsString, config.defaultValue as string | undefined);
    default:
      return withOptionalDefault(parseAsString, config.defaultValue); // text, date
  }
};

/**
 * URL key of the label sidecar for an async filter — stores the selected
 * option's display label(s) next to the value(s), so labels survive a refresh
 * without needing a by-id endpoint. Reserved suffix: don't name filters `*_label`.
 */
export const labelKeyOf = (key: string): string => `${key}_label`;

/** Async filter kinds carry a label sidecar param. */
export const asyncKindOf = (config: FilterConfig): 'multi' | 'single' | null =>
  config.type === 'asyncSelect' ? 'single' : config.type === 'asyncMultiSelect' ? 'multi' : null;

/** A value counts as "active" when it is set and non-empty. */
export const hasFilterValue = (value: unknown): boolean => {
  if (value === null || value === undefined || value === '') return false;
  if (Array.isArray(value)) return value.some((item) => item !== null && item !== '');
  return true;
};
