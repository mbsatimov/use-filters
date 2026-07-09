import type { SingleParserBuilder } from 'nuqs';

import { format, isValid, parse } from 'date-fns';
import {
  parseAsArrayOf,
  parseAsBoolean,
  parseAsFloat,
  parseAsInteger,
  parseAsString
} from 'nuqs';

import type { FilterConfig, MultiSelectFilterConfig, SelectFilterConfig } from './types';

/** Every non-null value one of our parsers can produce/serialize. */
export type FilterParserValue = boolean | number | string | number[] | string[];

/** Default date storage/serialization format (matches the common API `yyyy-MM-dd`). */
export const DATE_FORMAT = 'yyyy-MM-dd';

/**
 * Default datetime storage/serialization format (date + time, no timezone) —
 * used by `date` / `dateRange` filters declared with `precision: 'datetime'`.
 */
export const DATE_TIME_FORMAT = "yyyy-MM-dd'T'HH:mm:ss";

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

/**
 * Stored string -> `Date` (or `undefined` when empty/invalid). Parses with the
 * same `dateFormat` used by {@link toDateValue}, so a custom format
 * (e.g. `dd.MM.yyyy`) round-trips correctly instead of being misread by the
 * native `Date` constructor.
 */
export const fromDateValue = (
  value?: string | null,
  dateFormat: string = DATE_FORMAT
): Date | undefined => {
  if (!value) return undefined;
  const date = parse(value, dateFormat, new Date());
  return isValid(date) ? date : undefined;
};

/** `Date` -> stored string for datetime filters (defaults to {@link DATE_TIME_FORMAT}). */
export const toDateTimeValue = (date: Date, dateTimeFormat: string = DATE_TIME_FORMAT): string =>
  format(date, dateTimeFormat);

/** Stored string -> `Date` for datetime filters (or `undefined` when empty/invalid). */
export const fromDateTimeValue = (
  value?: string | null,
  dateTimeFormat: string = DATE_TIME_FORMAT
): Date | undefined => {
  if (!value) return undefined;
  const date = parse(value, dateTimeFormat, new Date());
  return isValid(date) ? date : undefined;
};

/**
 * Whether a `select` / `multiSelect`'s values are numeric, so the URL param
 * round-trips as `number | null` instead of `string | null`. Scans all options
 * (not just the first) and falls back to `defaultValue`, so an empty or
 * sparsely-populated `options` array still resolves correctly.
 */
const isNumericChoice = (config: MultiSelectFilterConfig | SelectFilterConfig): boolean => {
  const sample = config.options.find((option) => option.value != null);
  if (sample) return typeof sample.value === 'number';
  const fallback = Array.isArray(config.defaultValue)
    ? config.defaultValue[0]
    : config.defaultValue;
  return typeof fallback === 'number';
};

/** Apply `defaultValue` (when provided) so an absent URL param resolves to it. */
const withOptionalDefault = <T>(
  parser: SingleParserBuilder<T>,
  defaultValue: NonNullable<T> | undefined
) => (defaultValue === undefined ? parser : parser.withDefault(defaultValue));

/**
 * Pick the right nuqs parser for a filter kind. The casts undo type erasure:
 * `FilterConfig` unions select/multiSelect over `string | number`, but
 * `isNumericChoice` has already re-established which family the values are —
 * the `f.*` builders guarantee `defaultValue` matches `options`.
 *
 * The return type is normalized to a single `SingleParserBuilder` over the
 * union of every value a filter can hold. Without it, `buildParser` returns a
 * *union* of parser builders, and calling `.parse` / `.serialize` on that union
 * collapses their parameters to `never` (functions are contravariant on their
 * arguments) — which is unusable at the call site.
 */
export const buildParser = (config: FilterConfig): SingleParserBuilder<FilterParserValue> => {
  const build = (): unknown => {
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
      return isNumericChoice(config)
        ? withOptionalDefault(
            parseAsArrayOf(parseAsInteger),
            config.defaultValue as number[] | undefined
          )
        : withOptionalDefault(
            parseAsArrayOf(parseAsString),
            config.defaultValue as string[] | undefined
          );
    case 'number':
      // Floats by default so amounts/prices survive a URL round-trip; opt into
      // integer-only parsing with `precision: 'int'`.
      return config.precision === 'int'
        ? withOptionalDefault(parseAsInteger, config.defaultValue)
        : withOptionalDefault(parseAsFloat, config.defaultValue);
    case 'numberRange':
      // A `[min, max]` pair; same float-by-default rule as `number`.
      return config.precision === 'int'
        ? withOptionalDefault(
            parseAsArrayOf(parseAsInteger),
            config.defaultValue as number[] | undefined
          )
        : withOptionalDefault(
            parseAsArrayOf(parseAsFloat),
            config.defaultValue as number[] | undefined
          );
    case 'tags':
      // Freeform string array — no options, no server lookup.
      return withOptionalDefault(
        parseAsArrayOf(parseAsString),
        config.defaultValue as string[] | undefined
      );
    case 'select':
      return isNumericChoice(config)
        ? withOptionalDefault(parseAsInteger, config.defaultValue as number | undefined)
        : withOptionalDefault(parseAsString, config.defaultValue as string | undefined);
    default:
      return withOptionalDefault(parseAsString, config.defaultValue); // text, date
    }
  };
  return build() as SingleParserBuilder<FilterParserValue>;
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

/**
 * Deep-equal for filter values only — primitives, and arrays of primitives
 * (`[string, string]` ranges, multi-select value arrays). Replaces
 * `lodash/isEqual` so the package ships no lodash. Not a general-purpose
 * deep-equal: it only needs to handle the shapes a filter value can hold.
 */
export const valuesEqual = (a: unknown, b: unknown): boolean => {
  if (a === b) return true;
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((item, index) => valuesEqual(item, b[index]));
  }
  return false;
};

/**
 * Coerce a single raw search value (usually a URL string, but possibly already
 * typed by the router) into the same runtime type the hook's nuqs parsers
 * produce. Used by `resolveFilterParams` so a route loader's params object is
 * byte-for-byte identical to the hook's — otherwise their query keys diverge
 * (e.g. `status: '5'` vs `status: 5`) and the prefetch is never reused.
 */
export const coerceRawValue = (config: FilterConfig, raw: unknown): unknown => {
  if (raw == null) return config.defaultValue ?? null;
  if (typeof raw !== 'string') return raw; // already coerced upstream
  const parsed = buildParser(config).parse(raw);
  return parsed ?? config.defaultValue ?? null;
};

/** Coerce a raw page/pageSize value (string or number) to an integer, or `undefined`. */
export const coerceInt = (raw: unknown): number | undefined => {
  if (typeof raw === 'number') return Number.isFinite(raw) ? raw : undefined;
  if (typeof raw === 'string' && raw !== '') {
    const parsed = Number.parseInt(raw, 10);
    return Number.isNaN(parsed) ? undefined : parsed;
  }
  return undefined;
};
