import type { RawSearchParams } from './lib';
import type { makeResolveFilterParams } from './resolve-filter-params';
import type { FilterConfigMap, FilterParams, SharedFilterCallOptions } from './types';
import type { makeUseFilters, UseFiltersOptions, UseFiltersReturn } from './use-filters';

export function makeDefineFilters<PP extends Record<string, number>>(
  useFiltersBound: ReturnType<typeof makeUseFilters<PP>>,
  resolveFilterParamsBound: ReturnType<typeof makeResolveFilterParams<PP>>
) {
  /**
   * Bind one screen's `configs` and {@link SharedFilterCallOptions}
   * (`arraySeparator`, `pagination`) once, for both the hook and the loader
   * helper — the structural fix for "I pass the same `{ configs, options }`
   * to `useFilters` and `resolveFilterParams` by hand, and they drifted."
   * Everything else (`defaultCommit`, `meta`, `history`, `shallow`,
   * `clearOnDefault`) stays a per-`useFilters()`-call option, since it can't
   * affect `resolveFilterParams` either way.
   *
   * `T` is bound to plain `FilterConfigMap` — the inferred-per-config typing
   * style, not the explicit-`<P>` one. `resolveFilterParams` never supported
   * `<P>` either (it always infers `params` from `configs`), so this is the
   * same scope the two already shared, just enforced. (A fresh `<P>` generic
   * here would reintroduce `FiltersFor<P, PP>` as an abstract, unresolved
   * conditional bound, which sends the checker into a multi-GB blowup — the
   * same failure mode `FilterMapOf`'s doc comment in use-filters.ts warns
   * about. Binding straight to `FilterConfigMap` sidesteps it entirely.)
   *
   * @example
   * // src/features/loans/filters.ts
   * export const loanFilters = defineFilters(
   *   {
   *     search: f.text({ label: 'Search' }),
   *     status: f.select({ label: 'Status', options: statusOptions })
   *   },
   *   { arraySeparator: '|' }
   * );
   *
   * // component:
   * const { params, filters } = loanFilters.useFilters({ defaultCommit: 'manual' });
   *
   * // route loader — same arraySeparator, guaranteed:
   * const params = loanFilters.resolveFilterParams(new URL(request.url).searchParams);
   */
  return function defineFilters<const T extends FilterConfigMap>(
    configs: T,
    options: SharedFilterCallOptions = {}
  ) {
    return {
      /** The bound config map, for reference (e.g. building UI metadata from it). */
      configs,
      /** `resolveFilterParams`, with `configs` and the shared options already applied. */
      resolveFilterParams: (raw: RawSearchParams): FilterParams<T, PP> =>
        resolveFilterParamsBound(configs, raw, options),
      /**
       * `useFilters`, with `configs` and the shared options already applied.
       * Still takes hook-only options (`defaultCommit`, `meta`, `history`,
       * `shallow`, `clearOnDefault`) per call — those can't affect
       * `resolveFilterParams`, so they're safe to vary.
       */
      useFilters: (
        extra: Omit<UseFiltersOptions, keyof SharedFilterCallOptions> = {}
      ): UseFiltersReturn<never, PP, T> =>
        useFiltersBound<never, T>(configs, { ...extra, ...options })
    };
  };
}
