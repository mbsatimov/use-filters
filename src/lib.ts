import type { SingleParserBuilder } from 'nuqs';

import { parseAsArrayOf, parseAsBoolean, parseAsFloat, parseAsInteger, parseAsString } from 'nuqs';

import type { FilterConfig, MultiSelectFilterConfig, SelectFilterConfig } from './types';

/** Every non-null value one of our parsers can produce/serialize. */
export type FilterParserValue = boolean | number | string | number[] | string[];

/** The fixed format `date` filters serialize to. Override `date.serialize` / `date.parse` to change it. */
export const DATE_FORMAT = 'yyyy-MM-dd';

/**
 * The fixed format datetime filters serialize to (date + time, local, no
 * timezone) — used by `date` / `dateRange` filters with `precision: 'datetime'`.
 * Override `date.serializeDateTime` / `date.parseDateTime` to change it.
 */
export const DATE_TIME_FORMAT = "yyyy-MM-dd'T'HH:mm:ss";

/** Default URL key holding the page number. */
export const DEFAULT_PAGE_KEY = 'page';
/** Default URL key holding the per-page count. */
export const DEFAULT_PER_PAGE_KEY = 'per_page';
/** Default `firstPage` — the number the first page is counted from. */
export const DEFAULT_FIRST_PAGE = 1;
/** Default per-page count when the URL has none. */
export const DEFAULT_PER_PAGE = 10;

/*
 * Date (de)serialization. The defaults are deliberately fixed to the common ISO
 * shapes above — no configurable format string, no parser engine, nothing to
 * misfire. Need a different representation (a `dd.MM.yyyy` UI, month names, a
 * timezone-aware or non-Gregorian library)? Override `date.serialize` /
 * `date.parse` (and their `*DateTime` counterparts) on `createFilters`; these
 * functions are just the defaults those hooks fall back to.
 */

const pad2 = (value: number): string => String(value).padStart(2, '0');

/**
 * Build a local `Date` from parts, returning `undefined` for out-of-range input.
 * The `Date` constructor silently rolls parts over (month 13 → next January,
 * Feb 30 → March), so any component that changed after construction means the
 * input was invalid.
 */
const buildDate = (
  year: number,
  month: number, // 1-12
  day: number,
  hours = 0,
  minutes = 0,
  seconds = 0
): Date | undefined => {
  const date = new Date(year, month - 1, day, hours, minutes, seconds);
  if (
    Number.isNaN(date.getTime()) ||
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day ||
    date.getHours() !== hours ||
    date.getMinutes() !== minutes ||
    date.getSeconds() !== seconds
  ) {
    return undefined;
  }
  return date;
};

/** `Date` -> `yyyy-MM-dd` (local). */
export const toDateValue = (date: Date): string =>
  `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;

/** `yyyy-MM-dd` -> `Date`, or `undefined` when empty / malformed / out of range. */
export const fromDateValue = (value?: string | null): Date | undefined => {
  if (!value) return undefined;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  return match ? buildDate(+match[1], +match[2], +match[3]) : undefined;
};

/** `Date` -> `yyyy-MM-ddTHH:mm:ss` (local). */
export const toDateTimeValue = (date: Date): string =>
  `${toDateValue(date)}T${pad2(date.getHours())}:${pad2(date.getMinutes())}:${pad2(date.getSeconds())}`;

/** `yyyy-MM-ddTHH:mm:ss` -> `Date`, or `undefined` when empty / malformed / out of range. */
export const fromDateTimeValue = (value?: string | null): Date | undefined => {
  if (!value) return undefined;
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})$/.exec(value);
  return match
    ? buildDate(+match[1], +match[2], +match[3], +match[4], +match[5], +match[6])
    : undefined;
};

/**
 * Whether a `select` / `multiSelect`'s values are numeric, so the URL param
 * round-trips as `number | null` instead of `string | null`. Scans all options
 * (not just the first) and falls back to `defaultValue`, so an empty or
 * sparsely-populated `options` array still resolves correctly. Exported for
 * `useFilters`' parser fingerprint: dynamic (backend-driven) options often
 * start empty and arrive later, and the parser must rebuild when the value
 * family they resolve to changes.
 */
export const isNumericChoice = (config: MultiSelectFilterConfig | SelectFilterConfig): boolean => {
  const sample = config.options.find((option) => option.value != null);
  if (sample) return typeof sample.value === 'number';
  const fallback = Array.isArray(config.defaultValue)
    ? config.defaultValue[0]
    : config.defaultValue;
  return typeof fallback === 'number';
};

/**
 * The resolved URL value type for a choice filter (`select` / `multiSelect`).
 * Prefers the explicit `valueType` — a *static* token that is identical at
 * every call site — and only falls back to sniffing `options`/`defaultValue`
 * ({@link isNumericChoice}) when it is absent. The sniff reads runtime data, so
 * it can disagree between the hook (options loaded) and `resolveFilterParams`
 * in a route loader (options empty); setting `valueType` removes that risk.
 */
export const resolveChoiceValueType = (
  config: MultiSelectFilterConfig | SelectFilterConfig
): 'number' | 'string' => config.valueType ?? (isNumericChoice(config) ? 'number' : 'string');

/**
 * A choice filter whose URL value type can't be determined from its config: no
 * explicit `valueType`, no option carries a value, and `defaultValue` reveals
 * nothing either. The sniff falls back to `'string'` in this case — a guess
 * that silently diverges from a call site which *does* have the options.
 * `resolveFilterParams` warns on this (dev only) so a loader's params can't
 * quietly mismatch the hook's.
 */
export const choiceValueTypeIsIndeterminate = (config: FilterConfig): boolean => {
  if (config.type !== 'select' && config.type !== 'multiSelect') return false;
  if (config.valueType !== undefined) return false;
  if (config.options.some((option) => option.value != null)) return false;
  const fallback = Array.isArray(config.defaultValue)
    ? config.defaultValue[0]
    : config.defaultValue;
  return fallback == null;
};

/**
 * Dev-only warning for {@link choiceValueTypeIsIndeterminate}: a `select` /
 * `multiSelect` used without loaded options and without an explicit `valueType`
 * can't have its URL value type determined, so it defaults to `'string'` and
 * may disagree with a call site that *does* have the options. `seen` dedupes so
 * a loader firing on every navigation warns at most once per key.
 */
export const warnIndeterminateChoiceValueType = (
  key: string,
  config: FilterConfig,
  seen: Set<string>
): void => {
  if (process.env.NODE_ENV === 'production') return;
  if (!choiceValueTypeIsIndeterminate(config) || seen.has(key)) return;
  seen.add(key);
  console.warn(
    `[useFilters] "${key}": this ${config.type} has no options and no \`valueType\`, so its URL value type can't be determined and defaults to 'string'. If its options are fetched at runtime (so this config is also used somewhere without them, e.g. this route loader), set \`valueType: 'number'\` or \`'string'\` on the filter so parsing stays identical across call sites.`
  );
};

/** Apply `defaultValue` (when provided) so an absent URL param resolves to it. */
const withOptionalDefault = <T>(
  parser: SingleParserBuilder<T>,
  defaultValue: NonNullable<T> | undefined
) => (defaultValue === undefined ? parser : parser.withDefault(defaultValue));

/** Default separator between items of an array-shaped param (`multiSelect`, `tags`, ranges, …). */
export const DEFAULT_ARRAY_SEPARATOR = ',';

/**
 * Pick the right nuqs parser for a filter kind. The casts undo type erasure:
 * `FilterConfig` unions select/multiSelect over `string | number`, but
 * `isNumericChoice` has already re-established which family the values are —
 * the `f.*` builders guarantee `defaultValue` matches `options`.
 *
 * The return type is normalized to a single `SingleParserBuilder` over the
 * union of every value a filter can hold. Without it, `buildParser` returns a
 * `union` of parser builders, and calling `.parse` / `.serialize` on that union
 * collapses their parameters to `never` (functions are contravariant on their
 * arguments) — which is unusable at the call site.
 *
 * `separator` is the delimiter joining/splitting array-shaped values
 * (`multiSelect`, `tags`, and the range kinds) in the URL — resolved by the
 * caller from `useFilters`'/`resolveFilterParams`' `arraySeparator` option,
 * then `createFilters`', then {@link DEFAULT_ARRAY_SEPARATOR}. Ignored by
 * scalar kinds (text, number, boolean, date, time, select, asyncSelect).
 */
export const buildParser = (
  config: FilterConfig,
  separator: string = DEFAULT_ARRAY_SEPARATOR
): SingleParserBuilder<FilterParserValue> => {
  const build = (): unknown => {
    switch (config.type) {
      case 'asyncMultiSelect':
        return config.valueType === 'string'
          ? withOptionalDefault(
              parseAsArrayOf(parseAsString, separator),
              config.defaultValue as string[] | undefined
            )
          : withOptionalDefault(
              parseAsArrayOf(parseAsInteger, separator),
              config.defaultValue as number[] | undefined
            );
      case 'asyncSelect':
        return config.valueType === 'string'
          ? withOptionalDefault(parseAsString, config.defaultValue as string | undefined)
          : withOptionalDefault(parseAsInteger, config.defaultValue as number | undefined);
      case 'boolean':
        return withOptionalDefault(parseAsBoolean, config.defaultValue);
      case 'dateRange':
        return withOptionalDefault(parseAsArrayOf(parseAsString, separator), config.defaultValue);
      case 'multiSelect':
        return resolveChoiceValueType(config) === 'number'
          ? withOptionalDefault(
              parseAsArrayOf(parseAsInteger, separator),
              config.defaultValue as number[] | undefined
            )
          : withOptionalDefault(
              parseAsArrayOf(parseAsString, separator),
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
              parseAsArrayOf(parseAsInteger, separator),
              config.defaultValue as number[] | undefined
            )
          : withOptionalDefault(
              parseAsArrayOf(parseAsFloat, separator),
              config.defaultValue as number[] | undefined
            );
      case 'tags':
        // Freeform string array — no options, no server lookup.
        return withOptionalDefault(
          parseAsArrayOf(parseAsString, separator),
          config.defaultValue as string[] | undefined
        );
      case 'timeRange':
        // A `[from, to]` pair of time-of-day strings — same string-array shape as
        // `dateRange`, no `Date` conversion.
        return withOptionalDefault(parseAsArrayOf(parseAsString, separator), config.defaultValue);
      case 'select':
        return resolveChoiceValueType(config) === 'number'
          ? withOptionalDefault(parseAsInteger, config.defaultValue as number | undefined)
          : withOptionalDefault(parseAsString, config.defaultValue as string | undefined);
      default:
        return withOptionalDefault(parseAsString, config.defaultValue); // text, date, time
    }
  };
  return build() as SingleParserBuilder<FilterParserValue>;
};

/**
 * Stable fingerprint of a filter's per-filter `nuqs` options, for `useFilters`'
 * structural parser signature — a parser is (re)built with these options baked
 * in, so a *content* change (say `history: 'replace'` → `'push'`) must re-key
 * it, not just presence/absence. Function values (e.g. `startTransition`)
 * serialize as a fixed token: swapping one function for another never changes
 * how the parser is constructed.
 */
export const fingerprintNuqsOptions = (options: object | undefined): string =>
  options === undefined
    ? ''
    : JSON.stringify(options, (_key, value: unknown) =>
        typeof value === 'function' ? 'fn' : value
      );

/**
 * Undo a stale parse after a `select` / `multiSelect`'s value family changes at
 * runtime — the second half of supporting backend-driven options that arrive
 * after mount. Rebuilding the parser map (see `useFilters`' parser signature)
 * makes nuqs use the right parser for *new* URL values, but nuqs caches parsed
 * state per query string, so an already-committed param (`?ids=1,2` parsed as
 * `['1','2']` while options were still `[]`) is never re-parsed. This detects a
 * committed value whose runtime type contradicts the options' family and runs
 * it back through the current parser, so reads match what a fresh mount — and
 * `resolveFilterParams` in a loader — would produce.
 */
export const reparseChoiceValue = (
  config: FilterConfig,
  value: unknown,
  separator: string
): unknown => {
  if (value == null) return value;
  if (config.type !== 'select' && config.type !== 'multiSelect') return value;
  const numeric = resolveChoiceValueType(config) === 'number';
  const isStale = (item: unknown) =>
    numeric ? typeof item === 'string' : typeof item === 'number';
  const mismatched = Array.isArray(value) ? value.some(isStale) : isStale(value);
  if (!mismatched) return value;
  const raw = Array.isArray(value) ? value.join(separator) : String(value);
  return buildParser(config, separator).parse(raw);
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
 * The raw-search shapes `resolveFilterParams` accepts — whatever your router
 * hands you: an already-parsed object (TanStack Router's `location.search`),
 * a `URLSearchParams` (React Router loaders — `new URL(request.url).searchParams`),
 * or the raw query string itself (`location.search`, leading `?` optional).
 */
export type RawSearchParams = string | Record<string, unknown> | URLSearchParams;

/** Normalize any accepted raw-search shape into a plain object (last value wins for repeated keys). */
export const normalizeRawSearch = (raw: RawSearchParams): Record<string, unknown> => {
  if (typeof raw === 'string') return Object.fromEntries(new URLSearchParams(raw));
  if (raw instanceof URLSearchParams) return Object.fromEntries(raw);
  return raw;
};

/**
 * Coerce a single raw search value (usually a URL string, but possibly already
 * typed by the router) into the same runtime type the hook's nuqs parsers
 * produce. Used by `resolveFilterParams` so a route loader's params object is
 * byte-for-byte identical to the hook's — otherwise their query keys diverge
 * (e.g. `status: '5'` vs `status: 5`) and the prefetch is never reused. Pass
 * the same `separator` the hook is using (see {@link buildParser}) so an
 * array-shaped value splits identically.
 */
export const coerceRawValue = (
  config: FilterConfig,
  raw: unknown,
  separator: string = DEFAULT_ARRAY_SEPARATOR
): unknown => {
  if (raw == null) return config.defaultValue ?? null;
  if (typeof raw !== 'string') return raw; // already coerced upstream
  const parsed = buildParser(config, separator).parse(raw);
  return parsed ?? config.defaultValue ?? null;
};

/** Coerce a raw page / per-page value (string or number) to an integer, or `undefined`. */
export const coerceInt = (raw: unknown): number | undefined => {
  if (typeof raw === 'number') return Number.isFinite(raw) ? raw : undefined;
  if (typeof raw === 'string' && raw !== '') {
    const parsed = Number.parseInt(raw, 10);
    return Number.isNaN(parsed) ? undefined : parsed;
  }
  return undefined;
};

/** Default debounce for an async filter's `loadOptions`, when `searchDebounceMs` isn't set. */
export const DEFAULT_ASYNC_DEBOUNCE_MS = 300;

/**
 * Debounce an async function: calls within `ms` of each other collapse into
 * one real call to `fn`, using the *last* call's arguments — every caller in
 * that window resolves/rejects together with that one call's outcome. Used to
 * debounce an async filter's `loadOptions` (see `searchDebounceMs` on
 * `AsyncSelectFilterConfig`/`AsyncMultiSelectFilterConfig`), so typing
 * "search" calls the real `loadOptions` once instead of once per keystroke —
 * without the library needing to own the search input itself.
 */
export const debounceAsync = <Args extends unknown[], R>(
  fn: (...args: Args) => Promise<R>,
  ms: number
): ((...args: Args) => Promise<R>) => {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let waiting: { reject: (reason: unknown) => void; resolve: (value: R) => void }[] = [];

  return (...args: Args) =>
    new Promise<R>((resolve, reject) => {
      waiting.push({ reject, resolve });
      if (timer !== undefined) clearTimeout(timer);
      timer = setTimeout(() => {
        timer = undefined;
        const callers = waiting;
        waiting = [];
        fn(...args).then(
          (result) => {
            for (const caller of callers) caller.resolve(result);
          },
          (error: unknown) => {
            for (const caller of callers) caller.reject(error);
          }
        );
      }, ms);
    });
};
