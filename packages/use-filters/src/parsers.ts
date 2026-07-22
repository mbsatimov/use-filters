import type { SingleParserBuilder } from 'nuqs';

import { parseAsArrayOf, parseAsBoolean, parseAsFloat, parseAsInteger, parseAsString } from 'nuqs';

import type { FilterConfig, FilterParserValue } from './types';

/** Apply `defaultValue` (when provided) so an absent URL param resolves to it. */
const withOptionalDefault = <T>(
  parser: SingleParserBuilder<T>,
  defaultValue: NonNullable<T> | undefined
) => (defaultValue === undefined ? parser : parser.withDefault(defaultValue));

/** Default separator between items of an array-shaped param (`multiSelect`, `tags`, ranges, …). */
export const DEFAULT_ARRAY_SEPARATOR = ',';

/**
 * Pick the right nuqs parser for a filter kind. The casts undo type erasure —
 * `config.valueType` has already established the value family, and the `f.*`
 * builders guarantee `defaultValue` matches. The return type is normalized to a
 * single `SingleParserBuilder`: a *union* of builders would collapse
 * `.parse`/`.serialize` params to `never` (contravariance), unusable downstream.
 */
export const buildParser = (
  config: FilterConfig,
  separator: string = DEFAULT_ARRAY_SEPARATOR
): SingleParserBuilder<FilterParserValue> => {
  const build = (): unknown => {
    switch (config.type) {
      // Choice kinds: `valueType` is the single (required) source of truth for
      // the value family — identical for the static and async variants.
      case 'select':
      case 'asyncSelect':
        return config.valueType === 'number'
          ? withOptionalDefault(parseAsInteger, config.defaultValue as number | undefined)
          : withOptionalDefault(parseAsString, config.defaultValue as string | undefined);
      case 'multiSelect':
      case 'asyncMultiSelect':
        return config.valueType === 'number'
          ? withOptionalDefault(
              parseAsArrayOf(parseAsInteger, separator),
              config.defaultValue as number[] | undefined
            )
          : withOptionalDefault(
              parseAsArrayOf(parseAsString, separator),
              config.defaultValue as string[] | undefined
            );
      case 'boolean':
        return withOptionalDefault(parseAsBoolean, config.defaultValue);
      case 'number':
        // Float by default (amounts/prices); `precision: 'int'` for whole numbers.
        return config.precision === 'int'
          ? withOptionalDefault(parseAsInteger, config.defaultValue)
          : withOptionalDefault(parseAsFloat, config.defaultValue);
      case 'numberRange':
        return config.precision === 'int'
          ? withOptionalDefault(
              parseAsArrayOf(parseAsInteger, separator),
              config.defaultValue as number[] | undefined
            )
          : withOptionalDefault(
              parseAsArrayOf(parseAsFloat, separator),
              config.defaultValue as number[] | undefined
            );
      // String-array kinds: a `[from, to]` date/time pair and freeform tags all
      // store a plain string array — one parser shape.
      case 'dateRange':
      case 'timeRange':
      case 'tags':
        return withOptionalDefault(
          parseAsArrayOf(parseAsString, separator),
          config.defaultValue as string[] | undefined
        );
      default:
        return withOptionalDefault(parseAsString, config.defaultValue); // text, date, time
    }
  };
  return build() as SingleParserBuilder<FilterParserValue>;
};

/**
 * Stable fingerprint of a filter's `nuqs` options for `useFilters`' parser
 * signature — a *content* change (`history: 'replace'` → `'push'`) must re-key
 * the parser. Functions serialize to a fixed token, so swapping one never re-keys.
 */
export const fingerprintNuqsOptions = (options: object | undefined): string =>
  options === undefined
    ? ''
    : JSON.stringify(options, (_key, value: unknown) =>
        typeof value === 'function' ? 'fn' : value
      );
