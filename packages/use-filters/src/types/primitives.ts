/**
 * The one place the choice families are listed: token → the primitive it names.
 * {@link FilterPrimitive}, {@link ChoiceToken} and {@link ChoiceBase} are all
 * derived from it, so adding a family here is a single edit.
 */
interface ChoiceFamilies {
  number: number;
  string: string;
}

/** Primitive types a `select` / `multiSelect` option's value can hold. */
export type FilterPrimitive = ChoiceFamilies[ChoiceToken];

/** Every non-null value one of our nuqs parsers can produce/serialize. */
export type FilterParserValue = boolean | number | string | number[] | string[];

/** Any value nuqs can serialize for our parsers, or `null` for "unset". */
export type ParamValue = FilterParserValue | null;

/**
 * How array-shaped params (`multiSelect`, `tags`, ranges, …) appear in the
 * `params` object handed to your API:
 *
 * - `'array'` (default) — a real JS array (`['a', 'b']`), the value the URL
 *   parser produces.
 * - `'string'` — the items joined with `arraySeparator` (`'a,b'`), the
 *   comma-separated shape most backends expect, so you never hand-join.
 *
 * Set it once on `createFilters` via `request.arrayFormat`. See
 * {@link RequestConfig}.
 */
export type ArrayFormat = 'array' | 'string';

/** An array-shaped param's `params` type under `AF`: joined `string`, or the array `A` itself. */
export type ArrayValue<A, AF extends ArrayFormat> = [AF] extends ['string'] ? string : A;

/**
 * The `valueType` token every choice filter declares: which family its option
 * values belong to. The inverse of {@link ChoiceBase}.
 */
export type ChoiceToken = keyof ChoiceFamilies;

/**
 * The primitive a `valueType` token names — `options` and `defaultValue` are
 * checked against it. The inverse of {@link ChoiceToken}, and the widening
 * counterpart to {@link ChoiceValueType}: this maps a token to its *base* type,
 * that maps a value type back to its token.
 */
export type ChoiceBase<VT extends ChoiceToken> = ChoiceFamilies[VT];

/**
 * The URL value-type token for a choice filter, constrained to match the option
 * type `V` (number → `'number'`, string → `'string'`). Unlike {@link ChoiceBase}
 * this cannot be an indexed access: it maps *subtypes* back to their family, so
 * a literal union like `'open' | 'closed'` still resolves to `'string'`. The
 * tuple wrappers stop the conditional distributing over a union (so `1 | 2`
 * resolves to `'number'`, not `'number' | 'number'`).
 */
export type ChoiceValueType<V extends FilterPrimitive> = [V] extends [number]
  ? 'number'
  : [V] extends [string]
    ? 'string'
    : ChoiceToken;
