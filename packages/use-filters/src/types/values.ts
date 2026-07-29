import type {
  AsyncMultiSelectFilterConfig,
  AsyncSelectFilterConfig,
  BooleanFilterConfig,
  DateRangeFilterConfig,
  FilterConfig,
  FilterConfigMap,
  MultiSelectFilterConfig,
  NumberFilterConfig,
  NumberRangeFilterConfig,
  SelectFilterConfig,
  TagsFilterConfig,
  TimeRangeFilterConfig
} from './config';
import type { PaginationParams } from './factory';
import type { ArrayFormat, ArrayValue } from './primitives';

/**
 * Whether a config was given a `defaultValue`. A filter with a default never
 * resolves to `null` at runtime (nuqs `withDefault`, and reset/clear fall back
 * to it), so its value type drops the `| null`. An absent — or explicitly
 * `undefined` — default stays nullable.
 */
type HasDefault<C> = C extends { defaultValue: infer D }
  ? [D] extends [undefined]
    ? false
    : true
  : false;

/** A filter's base value type, made nullable unless the config carries a `defaultValue`. */
type MaybeNull<C, B> = HasDefault<C> extends true ? B : B | null;

/**
 * Maps a `FilterConfig` to the type of the value it stores (and exposes in
 * `params`). `null` is included only when the filter has no `defaultValue` —
 * with one, the value is always at least the default.
 */
export type FilterValue<C extends FilterConfig, AF extends ArrayFormat = 'array'> =
  C extends SelectFilterConfig<infer V>
    ? MaybeNull<C, V>
    : C extends AsyncSelectFilterConfig<infer V>
      ? MaybeNull<C, V>
      : C extends AsyncMultiSelectFilterConfig<infer V>
        ? MaybeNull<C, ArrayValue<V[], AF>>
        : C extends MultiSelectFilterConfig<infer V>
          ? MaybeNull<C, ArrayValue<V[], AF>>
          : C extends TagsFilterConfig
            ? MaybeNull<C, ArrayValue<string[], AF>>
            : C extends NumberRangeFilterConfig
              ? MaybeNull<C, ArrayValue<[number, number], AF>>
              : C extends NumberFilterConfig
                ? MaybeNull<C, number>
                : C extends BooleanFilterConfig
                  ? MaybeNull<C, boolean>
                  : C extends DateRangeFilterConfig
                    ? MaybeNull<C, ArrayValue<[string, string], AF>>
                    : C extends TimeRangeFilterConfig
                      ? MaybeNull<C, ArrayValue<[string, string], AF>>
                      : MaybeNull<C, string>; // text, date, time

/**
 * The strongly-typed `params` object derived from a config map (same keys),
 * plus the pagination params (`PP`, `{ page, per_page }` by default) for the
 * API request.
 */
export type FilterParams<
  T extends FilterConfigMap,
  PP = PaginationParams,
  AF extends ArrayFormat = 'array'
> = {
  [K in keyof T]: FilterValue<T[K], AF>;
} & PP;

/**
 * The `params` shape: exactly the API params type `P` when one is given (plus
 * pagination `PP`), otherwise computed per config from the inferred map.
 *
 * The explicit-`P` arm mirrors `P` **without** `Partial`: {@link FiltersFor}'s
 * obligations (required key -> filter declared; non-nullable param ->
 * `defaultValue` set) make `P`'s own shape hold at runtime, so `params` is
 * directly assignable to the API's params type — soundly.
 */
export type ParamsOf<
  P,
  T extends Record<string, FilterConfig | undefined>,
  PP,
  AF extends ArrayFormat = 'array'
> = [P] extends [never]
  ? FilterParams<{ [K in keyof T]-?: NonNullable<T[K]> }, PP, AF>
  : Omit<P, keyof PP> & PP;

/**
 * Filter keys/values only (pagination stripped) — the domain of `setFilter`.
 * Bound to `Record<string, FilterConfig | undefined>` for the same reason as
 * `FilterMapOf` — see its doc comment.
 */
export type FilterValues<P, T extends Record<string, FilterConfig | undefined>, PP> = Omit<
  ParamsOf<P, T, PP>,
  keyof PP
>;
