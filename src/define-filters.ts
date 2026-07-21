import type { makeResolveFilterParams } from './resolve-filter-params';
import type { RawSearchParams } from './search';
import type {
  FilterConfigMap,
  FilterParams,
  SharedFilterCallOptions,
  UseFiltersOptions,
  UseFiltersReturn
} from './types';
import type { makeUseFilters } from './use-filters';

export function makeDefineFilters<PP extends Record<string, number>>(
  useFiltersBound: ReturnType<typeof makeUseFilters<PP>>,
  resolveFilterParamsBound: ReturnType<typeof makeResolveFilterParams<PP>>
) {
  /**
   * Bind one screen's `configs` and shared `{ arraySeparator, pagination }`
   * once, for both the hook and the loader helper — so they can't drift.
   * Hook-only options (`defaultCommit`, `meta`, `history`, …) still vary per
   * `useFilters()` call, since they can't affect `resolveFilterParams`.
   *
   * `T` is bound to plain `FilterConfigMap`, not a fresh `<P>` generic: an
   * abstract `FiltersFor<P, PP>` bound here sends the checker into a multi-GB
   * blowup (see `FilterMapOf` in types.ts), and the loader never supported
   * `<P>` anyway.
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
      /** `useFilters` with `configs` + shared options applied. Still takes hook-only options per call. */
      useFilters: (
        extra: Omit<UseFiltersOptions, keyof SharedFilterCallOptions> = {}
      ): UseFiltersReturn<never, PP, T> =>
        useFiltersBound<never, T>(configs, { ...extra, ...options })
    };
  };
}
