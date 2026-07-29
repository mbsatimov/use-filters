import type { FilterCommitMode } from './config';
import type { FiltersForBound } from './contract';
import type { PaginationParams, SharedFilterCallOptions } from './factory';
import type { FiltersMeta } from './meta';
import type { ArrayFormat } from './primitives';
import type { FilterMapOf, ResolvedFilter } from './resolved';
import type { FilterValues, ParamsOf } from './values';

/**
 * What triggered a committed `params` change, passed to `onParamsChange`:
 *
 * - `'change'` — a filter value changed (`onChange`, `setFilter`, `apply`, or a
 *   debounced commit).
 * - `'reset'` — filters were cleared to defaults (`reset` or `instantReset`).
 * - `'external'` — the change came from outside the hook: a back/forward
 *   navigation, another URL consumer, or a pagination write you own.
 */
export type ParamsChangeCause = 'change' | 'external' | 'reset';

/** Context passed to {@link UseFiltersListeners.onParamsChange}. */
export interface ParamsChangeContext<
  P = never,
  PP extends Record<string, number> = PaginationParams,
  T extends FiltersForBound<P, PP> = FiltersForBound<P, PP>,
  AF extends ArrayFormat = ArrayFormat
> {
  /** The whole `useFilters` return — read state and call methods from here. */
  api: UseFiltersReturn<P, PP, T, AF>;
  /** What triggered this change. See {@link ParamsChangeCause}. */
  cause: ParamsChangeCause;
  /** The new committed params. */
  params: ParamsOf<P, T, PP, AF>;
  /** The committed params before this change (for diffing). */
  prev: ParamsOf<P, T, PP, AF>;
}

/**
 * Side-effect listeners for `useFilters`, à la TanStack Form. Each fires in an
 * effect (never during render), so calling side-effects — or even the hook's
 * own methods via `ctx.api` — is safe. Note: calling a *mutating* method inside
 * `onParamsChange` triggers another change; guard against loops with `cause`.
 */
export interface UseFiltersListeners<
  P = never,
  PP extends Record<string, number> = PaginationParams,
  T extends FiltersForBound<P, PP> = FiltersForBound<P, PP>,
  AF extends ArrayFormat = ArrayFormat
> {
  /** Fires whenever committed `params` change (respects debounce/manual commit). */
  onParamsChange?: (ctx: ParamsChangeContext<P, PP, T, AF>) => void;
}

/**
 * `useFilters`' per-call options. Extends {@link SharedFilterCallOptions}
 * (`arraySeparator`, `pagination`) — the two fields `resolveFilterParams`
 * also takes, and must agree with for their `params` to match — with
 * hook-only UI behavior that has no loader counterpart.
 */
export interface UseFiltersOptions<
  P = never,
  PP extends Record<string, number> = PaginationParams,
  T extends FiltersForBound<P, PP> = FiltersForBound<P, PP>,
  AF extends ArrayFormat = ArrayFormat
> extends SharedFilterCallOptions {
  /** Remove a param from the URL when it is cleared. Defaults to `true`. */
  clearOnDefault?: boolean;
  /** Default `commit` mode for this call's filters (per-filter `commit` wins). Defaults to `'instant'`. */
  defaultCommit?: FilterCommitMode;
  /** How URL updates affect history. Defaults to `'replace'`. */
  history?: 'push' | 'replace';
  /** Side-effect listeners — e.g. `onParamsChange`. See {@link UseFiltersListeners}. */
  listeners?: UseFiltersListeners<P, PP, T, AF>;
  /** Whole-set UI hints, echoed back on the return. Augment {@link FiltersMeta} to type it. */
  meta?: FiltersMeta;
  /** Keep navigation client-side. Defaults to `true`. */
  shallow?: boolean;
}

export interface UseFiltersReturn<
  P = never,
  PP extends Record<string, number> = PaginationParams,
  T extends FiltersForBound<P, PP> = FiltersForBound<P, PP>,
  AF extends ArrayFormat = ArrayFormat
> {
  /** Same filters as `filters`, keyed by config key (includes hidden ones). */
  filterMap: FilterMapOf<T>;
  /** Resolved filters (config + value + handlers) — pass to your filter UI. Excludes hidden. */
  filters: ResolvedFilter[];
  /** `true` when at least one filter has an uncommitted change (debounce pending or manual). */
  isDirty: boolean;
  /** `true` when at least one visible filter is active. */
  isFiltered: boolean;
  /** The `meta` passed to `useFilters` (or `{}`). */
  meta: FiltersMeta;
  /** Current committed values + pagination. Pass straight to your fetcher / use as a query key. */
  params: ParamsOf<P, T, PP, AF>;
  /**
   * `params` serialized to a deterministic, sorted string — a stable cache key
   * (same state always produces the same string). Handy as a React Query key or
   * memo dependency when you'd rather compare a string than an object.
   */
  paramsStr: string;
  /** Commit every pending change at once (the "Apply" action). No-op when nothing is pending. */
  apply: () => void;
  /** Discard every pending change, reverting to committed values. */
  cancel: () => void;
  /**
   * Reset every filter to its default, **bypassing** commit modes — one batched
   * URL write. The whole-set twin of a filter's `instantReset()`; use for "Clear all".
   */
  instantReset: () => void;
  /**
   * Reset every filter to its default, **respecting** each one's commit mode
   * (manual/debounced stage a draft until `apply()`). For immediate, use `instantReset`.
   */
  reset: () => void;
  /** Imperatively set one filter's value (resets to the first page, bypasses `commit`). */
  setFilter: <K extends keyof FilterValues<P, T, PP>>(
    key: K,
    value: FilterValues<P, T, PP>[K] | null
  ) => void;
}

/**
 * The return of *any* `useFilters` call, for pass-through components (a shared
 * toolbar, debug panel, mobile sheet) that take a `useFilters` return as a prop
 * without generics. Every concrete return is assignable to this.
 *
 * Config-independent fields are inherited from {@link UseFiltersReturn} (one
 * source of truth — a new field there shows up here for free); only the three
 * key/value-typed fields are erased below.
 */
export interface AnyUseFiltersReturn extends Omit<
  UseFiltersReturn,
  'filterMap' | 'params' | 'setFilter'
> {
  /** Same as the concrete return's `filterMap`, keyed by `string`. Includes hidden filters. */
  filterMap: Record<string, ResolvedFilter>;
  /** Current values (plus pagination) — `unknown` since the keys aren't known here. */
  params: Record<string, unknown>;
  /** Uncallable (`never` keys): a pass-through component doesn't know the config's keys. */
  setFilter: (key: never, value: never) => void;
}
