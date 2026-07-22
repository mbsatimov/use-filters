import type { makeResolveFilterParams } from './resolve-filter-params';
import type { RawSearchParams } from './search';
import type {
  FiltersFor,
  FiltersForBound,
  ParamsOf,
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
   * Pass your API's params type as `<P>` to validate `configs` against it —
   * the same contract `useFilters<P>` enforces (required keys declared,
   * non-null params defaulted) — and both the bound hook and loader return
   * `params` typed as exactly `P`. The strict contract is enforced at the
   * `configs` parameter, never as `T`'s bound (checker blowup — see
   * `FiltersForBound` in types.ts).
   */
  return function defineFilters<
    P = never,
    const T extends FiltersForBound<P, PP> = FiltersForBound<P, PP>
  >(
    configs: T & ([P] extends [never] ? unknown : FiltersFor<P, PP>),
    options: SharedFilterCallOptions = {}
  ) {
    return {
      /** The bound config map, for reference (e.g. building UI metadata from it). */
      configs,
      /** `resolveFilterParams`, with `configs` and the shared options already applied. */
      resolveFilterParams: (raw: RawSearchParams): ParamsOf<P, T, PP> =>
        resolveFilterParamsBound<P, T>(configs, raw, options),
      /** `useFilters` with `configs` + shared options applied. Still takes hook-only options per call. */
      useFilters: (
        extra: Omit<UseFiltersOptions<P, PP, T>, keyof SharedFilterCallOptions> = {}
      ): UseFiltersReturn<P, PP, T> => useFiltersBound<P, T>(configs, { ...extra, ...options })
    };
  };
}
