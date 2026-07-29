/**
 * The type surface, grouped by concern. Import from `./types` — this barrel is
 * the single internal entry point, so the split below stays an implementation
 * detail (`src/index.ts` decides what consumers actually see).
 *
 * - `primitives` — the value vocabulary (`FilterPrimitive`, `ParamValue`, `ArrayFormat`, …)
 * - `meta`       — the `declare module` augmentation points
 * - `config`     — what you declare: `FilterOption` and the per-kind `*FilterConfig`s
 * - `values`     — config -> value mapping (`FilterValue`, `FilterParams`, `ParamsOf`)
 * - `resolved`   — what the UI receives (`ResolvedFilter` and its internal base)
 * - `contract`   — the `<P>` API-params contract (`FiltersFor`, `FiltersForBound`)
 * - `factory`    — per-project constants set on `createFilters`
 * - `hook`       — `useFilters`' own options/return surface
 */
export type * from './config';
export type * from './contract';
export type * from './factory';
export type * from './hook';
export type * from './meta';
export type * from './primitives';
export type * from './resolved';
export type * from './values';
