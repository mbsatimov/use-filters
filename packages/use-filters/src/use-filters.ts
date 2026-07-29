import { useQueryStates } from 'nuqs';
import * as React from 'react';

import type { CommittedValue, DebouncedLoadOptionsCache } from './resolved-fields';
import type {
  ArrayFormat,
  AsyncMultiSelectFilterConfig,
  AsyncSelectFilterConfig,
  FilterConfig,
  FilterEntry,
  FilterMapOf,
  FiltersFor,
  FiltersForBound,
  FiltersMeta,
  ParamsChangeCause,
  ParamsOf,
  ParamValue,
  ResolvedFilter,
  ResolvedFilterBase,
  ResolvedFiltersConfig,
  UseFiltersOptions,
  UseFiltersReturn
} from './types';

import { asyncKindOf, formatArrayParams, labelKeyOf } from './filter-utils';
import { resolvePaginationOverride } from './pagination';
import { buildParserMap, fingerprintFilterConfigs } from './parsers';
import {
  cachedDebouncedLoadOptions,
  defaultValueOf,
  differsFromDefault,
  readCommitted,
  resolveAsyncFields,
  resolveStaticSelectFields
} from './resolved-fields';
import { serializeParamsKey } from './search';
import { usePendingCommits } from './use-pending-commits';

/**
 * Build a `useFilters` hook bound to a resolved per-project config —
 * `createFilters`'s job, not called directly. The top-level `useFilters` export
 * is one such hook, bound to the defaults.
 *
 * The hook keeps a `key -> f.*()` config map's state in the URL and returns
 * `params` (for fetching) + resolved `filters` (to render your own UI). Requires
 * a nuqs adapter at your app root. Pass your API's params type as `<P>` to
 * validate the config against it (turns off per-config inference — you rarely
 * need both).
 *
 * @example
 * const { params, filters } = useFilters<ListParams>({
 *   search: f.text({ label: 'Search' }),
 *   status: f.select({ label: 'Status', valueType: 'string', options: statusOptions })
 * });
 * const { data } = useQuery(listQueryOptions(params));
 */
export function makeUseFilters<
  PP extends Record<string, number>,
  FAF extends ArrayFormat = 'array'
>(cfg: ResolvedFiltersConfig) {
  const { pageKey, perPageKey, firstPage } = cfg;

  return function useFilters<
    P = never,
    const T extends FiltersForBound<P, PP> = FiltersForBound<P, PP>
  >(
    // The strict `<P>` contract (required keys declared, non-null params
    // defaulted — see `FiltersFor`) is enforced here at the parameter, where
    // `P` and the argument are concrete. It must NOT live in `T`'s bound: the
    // checker would expand its enriched unions through every `ResolvedFilter`
    // in the return type (see `FiltersForBound`). With no `<P>` the extra arm
    // is `unknown` and inference is untouched. `FAF` (the factory's
    // `request.arrayFormat`) shapes `params`; it's fixed per factory, not a
    // per-call type argument.
    configs: T & ([P] extends [never] ? unknown : FiltersFor<P, PP, FAF>),
    options: UseFiltersOptions<P, PP, T, FAF> = {}
  ): UseFiltersReturn<P, PP, T, FAF> {
    const {
      history = 'replace',
      shallow = true,
      clearOnDefault = true,
      pagination = true,
      listeners,
      // Per-call defaults fall back to the factory's (per-filter `commit` still wins over `defaultCommit`).
      defaultCommit = cfg.defaultCommit,
      arraySeparator = cfg.arraySeparator,
      meta = {} as FiltersMeta
    } = options;

    // Keys / `firstPage` always come from the factory so `params` matches
    // `resolveFilterParams` (same `resolvePaginationOverride` helper).
    const {
      enabled: paginationEnabled,
      defaultPerPage,
      resetPageOnFilterChange
    } = resolvePaginationOverride(pagination, cfg);

    const entries = React.useMemo(() => Object.entries(configs) as FilterEntry[], [configs]);

    const parserSignature = React.useMemo(() => fingerprintFilterConfigs(entries), [entries]);

    const parsers = React.useMemo(
      () =>
        buildParserMap(
          entries,
          arraySeparator,
          paginationEnabled ? { defaultPerPage, firstPage, pageKey, perPageKey } : null
        ),
      // `entries` is read via the stable `parserSignature`; depending on it
      // directly would rebuild parsers (and re-key `useQueryStates`) every render.
      // eslint-disable-next-line react/exhaustive-deps
      [parserSignature, paginationEnabled, defaultPerPage, arraySeparator]
    );

    const [values, setValues] = useQueryStates(parsers, { history, shallow, clearOnDefault });

    // Backing store for `cachedDebouncedLoadOptions` — see it for the cache policy.
    const debouncedLoadOptionsRef = React.useRef<DebouncedLoadOptionsCache>({});

    // Keys already warned about a loadOptions/valueType mismatch (once per filter).
    const warnedValueTypesRef = React.useRef<Set<string>>(new Set());

    // What triggered the next committed change, for `onParamsChange`. Set right
    // before a committing action; the params-change effect reads and resets it.
    // Anything it doesn't set is an outside change — a back/forward, another URL
    // consumer — so it defaults back to 'external'.
    const causeRef = React.useRef<ParamsChangeCause>('external');

    const configByKey = React.useMemo(() => new Map(entries), [entries]);

    const setFilterValue = React.useCallback(
      (key: string, value: ParamValue, labels: string | string[] | null = null) => {
        const config = configByKey.get(key);
        const updates: Record<string, ParamValue> = { [key]: value ?? null };
        if (config && asyncKindOf(config)) updates[labelKeyOf(key)] = labels;
        // Any filter change returns to the first page, unless `resetPageOnFilterChange: false`.
        if (paginationEnabled && resetPageOnFilterChange) updates[pageKey] = null;
        void setValues(updates);
      },
      [setValues, paginationEnabled, resetPageOnFilterChange, configByKey]
    );

    // The draft layer (pending changes + debounce timers) lives here.
    const { applyKey, cancelKey, commitNow, discardAll, pending, schedule } = usePendingCommits(
      values,
      setFilterValue,
      causeRef
    );

    const resolveFilter = React.useCallback(
      (key: string, config: FilterConfig): ResolvedFilter => {
        const mode = config.commit ?? defaultCommit;
        const isInstant = mode === 'instant';
        const isManual = mode === 'manual';
        const isDebounced = typeof mode === 'object';

        // Draft overlay: a pending change shadows the committed URL value. A
        // `PendingChange` carries the same `value`/`labels` pair, so it stands in
        // for the committed one directly.
        const change = pending[key];
        const committed = readCommitted(values, key);
        const draft: CommittedValue = change ?? committed;
        const doReset = () =>
          schedule({ key, mode, value: defaultValueOf(config), cause: 'reset' });
        const doInstantReset = () => commitNow(key, defaultValueOf(config), 'reset');

        // Typed against `ResolvedFilterBase` so the common fields are
        // compile-checked here; the `Record` half admits the config spread and
        // the kind-specific extras assigned below.
        const resolved: ResolvedFilterBase & Record<string, unknown> = {
          ...config,
          key,
          // The *effective* commit mode (after defaults), so UIs read it uniformly.
          commit: mode,
          isInstant,
          isManual,
          isDebounced,
          debounceMs: isDebounced ? (mode as { debounce: number }).debounce : null,
          value: draft.value,
          committedValue: committed.value,
          isDirty: change !== undefined,
          // Per-filter active state; `isFiltered` tracks the committed value, `isFilteredDraft` the draft.
          isFiltered: differsFromDefault(config, committed.value),
          isFilteredDraft: differsFromDefault(config, draft.value),
          onChange: (value: ParamValue) => schedule({ key, mode, value: value ?? null }),
          reset: doReset,
          instantReset: doInstantReset,
          apply: () => applyKey(key),
          cancel: () => cancelKey(key)
        };

        const kind = asyncKindOf(config);
        if (kind) {
          const asyncConfig = config as AsyncMultiSelectFilterConfig | AsyncSelectFilterConfig;
          resolved.loadOptions = cachedDebouncedLoadOptions(
            debouncedLoadOptionsRef.current,
            key,
            asyncConfig,
            warnedValueTypesRef.current
          );
          Object.assign(resolved, resolveAsyncFields(kind, key, mode, draft, schedule));
        }

        // Static choice filters: expose the full selected option(s) from `options`.
        Object.assign(resolved, resolveStaticSelectFields(config, draft.value));

        return resolved as unknown as ResolvedFilter;
      },
      [values, pending, schedule, defaultCommit, applyKey, cancelKey, commitNow]
    );

    // Keyed lookup — includes hidden filters (a caller may reach one by key).
    const filterMap = React.useMemo(
      () =>
        Object.fromEntries(
          entries.map(([key, config]) => [key, resolveFilter(key, config)])
        ) as FilterMapOf<T>,
      [entries, resolveFilter]
    );

    // Hidden filters stay in `params` but are excluded from `filters`.
    const filters = React.useMemo<ResolvedFilter[]>(
      () =>
        entries
          .filter(([, config]) => !config.hidden)
          // Read as `Record` (not `filterMap[key as keyof T]`): indexing by an
          // asserted `keyof T` re-touches the generic and blows up the checker
          // (see `FilterMapOf` in types/resolved.ts). Same runtime result.
          .map(([key]) => (filterMap as Record<string, ResolvedFilter>)[key]),
      [entries, filterMap]
    );

    // Raw params — array-shaped values kept as arrays, before `arrayFormat`.
    // `paramsStr` derives from this so the cache key is identical whether arrays
    // are emitted as arrays or as joined strings (`arrayFormat` never re-keys).
    // `pageKey`/`perPageKey`/`firstPage` are absent from the deps on purpose:
    // they're factory constants (fixed for the life of this hook), so they can
    // never invalidate the memo. Same for `cfg.arrayFormat` in `params` below.
    const rawParams = React.useMemo(() => {
      const result: Record<string, unknown> = {};
      for (const [key] of entries) result[key] = values[key] ?? null;
      if (paginationEnabled) {
        result[pageKey] = (values[pageKey] as number | null) ?? firstPage;
        result[perPageKey] = (values[perPageKey] as number | null) ?? defaultPerPage;
      }
      return result;
    }, [entries, values, paginationEnabled, defaultPerPage]);

    // Public `params` — array values joined per the factory's `arrayFormat`
    // (identity-stable for the default `'array'`, where `formatArrayParams`
    // returns `rawParams` untouched).
    const params = React.useMemo(
      () =>
        formatArrayParams(rawParams, cfg.arrayFormat, arraySeparator) as ParamsOf<P, T, PP, FAF>,
      [rawParams, arraySeparator]
    );

    // Deterministic, sorted serialization of `params` — a stable cache key.
    const paramsStr = React.useMemo(
      () => serializeParamsKey(rawParams, arraySeparator),
      [rawParams, arraySeparator]
    );

    // Reuse each filter's own `isFiltered` (already excludes hidden, computed in resolveFilter).
    const isFiltered = React.useMemo(() => filters.some((filter) => filter.isFiltered), [filters]);

    const isDirty = Object.keys(pending).length > 0;

    // "Apply": flush every pending change, cancelling their timers.
    const apply = React.useCallback(() => {
      for (const key of Object.keys(pending)) applyKey(key);
    }, [pending, applyKey]);

    // "Cancel": drop every pending change, reverting to committed values.
    const cancel = React.useCallback(() => {
      for (const key of Object.keys(pending)) cancelKey(key);
    }, [pending, cancelKey]);

    // Imperative set: bypass the draft layer, land in the URL immediately.
    const setFilter = React.useCallback(
      (key: string, value: ParamValue) => commitNow(key, value, 'change'),
      [commitNow]
    );

    // Reset every filter to its default, respecting each one's commit mode (the
    // whole-set twin of a filter's own `reset()`): instant commits now,
    // manual/debounced stage a draft. nuqs coalesces the same-tick writes.
    const reset = React.useCallback(() => {
      for (const [key, config] of entries) {
        schedule({
          key,
          mode: config.commit ?? defaultCommit,
          value: defaultValueOf(config),
          cause: 'reset'
        });
      }
    }, [entries, schedule, defaultCommit]);

    // Mode-bypassing counterpart to `reset`: wipe to defaults and commit in one
    // batched write, cancelling all pending drafts/timers.
    const instantReset = React.useCallback(() => {
      discardAll();
      const cleared: Record<string, ParamValue> = {};
      for (const [key, config] of entries) {
        cleared[key] = defaultValueOf(config);
        if (asyncKindOf(config)) cleared[labelKeyOf(key)] = null;
      }
      if (paginationEnabled && resetPageOnFilterChange) cleared[pageKey] = null;
      causeRef.current = 'reset';
      void setValues(cleared);
    }, [paginationEnabled, resetPageOnFilterChange, setValues, entries, discardAll]);

    const result: UseFiltersReturn<P, PP, T, FAF> = {
      params,
      paramsStr,
      filters,
      filterMap,
      isDirty,
      isFiltered,
      meta,
      apply,
      cancel,
      reset,
      instantReset,
      setFilter: setFilter as UseFiltersReturn<P, PP, T, FAF>['setFilter']
    };

    // Keep the latest return + committed params for the `onParamsChange` effect,
    // which fires *after* render (so `apiRef` is already this render's value).
    const apiRef = React.useRef(result);
    apiRef.current = result;
    const prevParamsRef = React.useRef(params);
    const prevParamsStrRef = React.useRef(paramsStr);

    // Fire `onParamsChange` whenever committed params change. Keyed on
    // `paramsStr` (the canonical serialization) so it fires on real changes
    // only — not on mount, and not when an action produces the same params.
    React.useEffect(() => {
      if (paramsStr === prevParamsStrRef.current) return;
      const prev = prevParamsRef.current;
      const cause = causeRef.current;
      prevParamsRef.current = params;
      prevParamsStrRef.current = paramsStr;
      causeRef.current = 'external';
      listeners?.onParamsChange?.({ api: apiRef.current, cause, params, prev });
      // `params`/`listeners` are read fresh each time `paramsStr` changes; the
      // rest are refs. Depending on `params` too would re-fire on same-content
      // re-renders (a new `values` reference from nuqs).
      // eslint-disable-next-line react/exhaustive-deps
    }, [paramsStr]);

    return result;
  };
}
