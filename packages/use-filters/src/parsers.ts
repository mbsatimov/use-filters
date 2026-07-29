import type { ParserMap, SingleParserBuilder } from 'nuqs';

import { parseAsArrayOf, parseAsBoolean, parseAsFloat, parseAsInteger, parseAsString } from 'nuqs';

import type { FilterConfig, FilterEntry, FilterParserValue } from './types';

import { asyncKindOf, isLabelKey, LABEL_SUFFIX, labelKeyOf } from './filter-utils';

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

/**
 * Structural fingerprint of everything {@link buildParserMap} reads off the
 * configs. `useFilters` keys the parser map on this rather than on the entries'
 * identity, so passing an inline config literal — a new object every render —
 * doesn't rebuild the parsers and re-key the URL state.
 */
export const fingerprintFilterConfigs = (entries: FilterEntry[]): string =>
  entries
    .map(([key, config]) => {
      const { precision = '', valueType = '' } = config as {
        precision?: string;
        valueType?: string;
      };
      const defaultValue = JSON.stringify(config.defaultValue ?? null);
      return `${key}:${config.type}:${valueType}:${precision}:${defaultValue}:${fingerprintNuqsOptions(config.nuqs)}`;
    })
    .join('|');

/** Pagination's own parsers; `null` when pagination is disabled for the call. */
export interface PaginationParsers {
  defaultPerPage: number;
  firstPage: number;
  pageKey: string;
  perPageKey: string;
}

/**
 * The full `key -> parser` map `useQueryStates` binds: one parser per filter,
 * a `<key>_label` sidecar for each async filter, and the pagination pair.
 * Per-filter `nuqs` options are applied to both a filter and its sidecar so the
 * two always write under the same history/shallow settings.
 */
export const buildParserMap = (
  entries: FilterEntry[],
  arraySeparator: string,
  pagination: PaginationParsers | null
): ParserMap => {
  // `ParserMap` is intentionally `any`-valued (nuqs); our typing is recovered via `params`.
  const map: ParserMap = {};

  for (const [key, config] of entries) {
    if (process.env.NODE_ENV !== 'production' && isLabelKey(key)) {
      console.warn(
        `[useFilters] "${key}" ends with the reserved "${LABEL_SUFFIX}" suffix used by async filter label sidecars — rename it to avoid collisions.`
      );
    }
    const parser = buildParser(config, arraySeparator);
    map[key] = config.nuqs ? parser.withOptions(config.nuqs) : parser;

    // Async filters carry a `<key>_label` sidecar (display-only, same separator).
    const asyncKind = asyncKindOf(config);
    if (asyncKind) {
      const labelParser =
        asyncKind === 'multi' ? parseAsArrayOf(parseAsString, arraySeparator) : parseAsString;
      map[labelKeyOf(key)] = config.nuqs ? labelParser.withOptions(config.nuqs) : labelParser;
    }
  }

  if (pagination) {
    map[pagination.pageKey] = parseAsInteger.withDefault(pagination.firstPage);
    map[pagination.perPageKey] = parseAsInteger.withDefault(pagination.defaultPerPage);
  }
  return map;
};
