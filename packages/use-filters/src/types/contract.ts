import type {
  AsyncMultiSelectFilterConfig,
  AsyncSelectFilterConfig,
  BooleanFilterConfig,
  DateFilterConfig,
  DateRangeFilterConfig,
  FilterConfig,
  FilterConfigMap,
  MultiSelectFilterConfig,
  NumberFilterConfig,
  NumberRangeFilterConfig,
  SelectFilterConfig,
  TagsFilterConfig,
  TextFilterConfig,
  TimeFilterConfig,
  TimeRangeFilterConfig
} from './config';
import type { PaginationParams } from './factory';
import type { ArrayFormat, FilterPrimitive } from './primitives';

/** The filter kinds able to produce a value assignable to `V` (an API param's type). */
type ConfigFor<V, AF extends ArrayFormat = 'array'> = [V] extends [boolean]
  ? BooleanFilterConfig
  : [V] extends [number]
    ? number extends V
      ? AsyncSelectFilterConfig<number> | NumberFilterConfig | SelectFilterConfig<number>
      : AsyncSelectFilterConfig<V & FilterPrimitive> | SelectFilterConfig<V & FilterPrimitive>
    : [V] extends [[string, string]]
      ? DateRangeFilterConfig | TimeRangeFilterConfig
      : [V] extends [[number, number]]
        ? NumberRangeFilterConfig
        : [V] extends [readonly (infer E extends FilterPrimitive)[]]
          ? string extends E
            ? AsyncMultiSelectFilterConfig<E> | MultiSelectFilterConfig<E> | TagsFilterConfig
            : AsyncMultiSelectFilterConfig<E> | MultiSelectFilterConfig<E>
          : [V] extends [string]
            ? string extends V
              ? // Open `string`: the single-string kinds — plus, under
                // `arrayFormat: 'string'`, every array-shaped kind, since a
                // serialized array *is* a string (`multiSelect` -> `'a,b'`).
                | ([AF] extends ['string'] ? SerializedArrayConfig : never)
                | AsyncSelectFilterConfig<string>
                | DateFilterConfig
                | SelectFilterConfig<string>
                | TextFilterConfig
                | TimeFilterConfig
              : | AsyncSelectFilterConfig<V & FilterPrimitive>
                | SelectFilterConfig<V & FilterPrimitive> // closed union, e.g. LoanStatus
            : FilterConfig;

/**
 * The array-shaped configs that serialize to a plain `string` under
 * `arrayFormat: 'string'` — so an open-`string` API param may be satisfied by
 * any of them (its element type is erased by joining, so it's unconstrained).
 */
type SerializedArrayConfig =
  | AsyncMultiSelectFilterConfig<FilterPrimitive>
  | DateRangeFilterConfig
  | MultiSelectFilterConfig<FilterPrimitive>
  | NumberRangeFilterConfig
  | TagsFilterConfig
  | TimeRangeFilterConfig;

/**
 * Requires the config kind's own `defaultValue` field, made non-optional.
 * Distributes over the {@link ConfigFor} union so each member demands *its*
 * default shape (`V` for selects, `readonly V[]` for multi-selects, tuples for
 * ranges, …). The `f.*` builders capture `defaultValue` presence in their
 * return type, which is what makes this checkable.
 */
type RequireDefault<C> = C extends { defaultValue?: infer D }
  ? C & { defaultValue: NonNullable<D> }
  : never;

/**
 * The config constraint for one API param, derived from the param's
 * nullability: a nullable param (`null` in its type) may leave `defaultValue`
 * unset — `null` in `params` is representable. A non-nullable param **must**
 * set `defaultValue`, since without one an unset filter resolves to `null` at
 * runtime, which the param's type says is impossible.
 */
type ConfigForParam<V, AF extends ArrayFormat = 'array'> = null extends V
  ? ConfigFor<NonNullable<V>, AF>
  : RequireDefault<ConfigFor<NonNullable<V>, AF>>;

/**
 * Constrains a filter config map to an API's list-params type (pagination keys
 * excluded — `useFilters` owns those). Pass the params type to `useFilters` to
 * get key autocomplete and checking. The obligations mirror `P`'s own shape, so
 * `params` can be typed as exactly `P`:
 *
 * - a **required** key in `P` must have a filter declared; an optional (`?:`)
 *   key may omit one (the key is then absent from `params`).
 * - a **non-nullable** param must set `defaultValue` (it can never be `null`);
 *   a `| null` param may leave it unset.
 *
 * @example
 * interface LoanListParams {
 *   status: LoanStatus | null; // required + nullable -> filter required, default optional
 *   sort?: 'date' | 'price';   // optional + non-null -> filter optional; default required if declared
 *   page: number;
 *   per_page: number;
 * }
 * useFilters<LoanListParams>({
 *   status: f.select({ label: 'Holat', valueType: 'string', options: loanStatusLabelOptions })
 * });
 *
 * `[P] extends [never]` (no type argument given) falls back to any config map,
 * keeping full per-config inference.
 */
export type FiltersFor<P, PP = PaginationParams, AF extends ArrayFormat = 'array'> = [P] extends [
  never
]
  ? FilterConfigMap
  : [Exclude<keyof P, keyof PP>] extends [never]
    ? // `P` declares no filter params (only pagination): reject any config key
      // here, at the config. An empty mapped type would be `{}`, which accepts
      // anything and defers the error to `params.<key>`; the `never` index
      // value makes a declared filter a compile error instead.
      Record<string, never>
    : {
        [K in Exclude<keyof P, keyof PP> as undefined extends P[K] ? K : never]?: ConfigForParam<
          Exclude<P[K], undefined>,
          AF
        >;
      } & {
        [K in Exclude<keyof P, keyof PP> as undefined extends P[K] ? never : K]-?: ConfigForParam<
          P[K],
          AF
        >;
      };

/**
 * The **loose** config-map shape for `P` — optional keys, no default
 * requirement. This (not {@link FiltersFor}) is the generic *bound* and
 * default* for `T`: the strict contract in bound position makes the checker
 * expand its enriched config unions through every `ResolvedFilter` in the
 * return type — a multi-GB blowup (same hazard `FilterMapOf` documents). The
 * contract is instead enforced once, concretely, at the `configs` parameter
 * (`T & FiltersFor<P, PP>`); in the explicit-`P` path `T` is never inferred
 * (TS has no partial type-argument inference), so the loose bound costs
 * nothing.
 */
export type FiltersForBound<P, PP = PaginationParams> = [P] extends [never]
  ? FilterConfigMap
  : // Widest `ConfigFor` (`'string'`, whose open-string arm also admits the
    // array kinds) so this loose bound never rejects a config the strict
    // `FiltersFor<P, PP, AF>` (at the `configs` parameter) would accept.
    { [K in Exclude<keyof P, keyof PP>]?: ConfigFor<NonNullable<P[K]>, 'string'> };
