import type { ParserMap } from 'nuqs';

import { parseAsArrayOf, parseAsInteger, parseAsString, useQueryStates } from 'nuqs';
import * as React from 'react';

import type {
  AsyncMultiSelectFilterConfig,
  AsyncSelectFilterConfig,
  FilterCommitMode,
  FilterConfig,
  FilterMapOf,
  FilterOption,
  FilterPrimitive,
  FiltersFor,
  FiltersMeta,
  ParamsOf,
  ParamValue,
  ResolvedFilter,
  ResolvedFilterBase,
  ResolvedFiltersConfig,
  SelectedOption,
  UseFiltersOptions,
  UseFiltersReturn
} from './types';

import { debounceAsync, DEFAULT_ASYNC_DEBOUNCE_MS } from './debounce';
import {
  asyncKindOf,
  hasFilterValue,
  isLabelKey,
  LABEL_SUFFIX,
  labelKeyOf,
  valuesEqual
} from './filter-utils';
import { resolvePaginationOverride } from './pagination';
import { buildParser, fingerprintNuqsOptions } from './parsers';
import { serializeParamsKey } from './search';

/** Read a filter's committed URL value + label sidecar, normalized to `null`. */
const readCommitted = (
  values: Record<string, unknown>,
  key: string
): { value: ParamValue; labels: string | string[] | null } => ({
  value: (values[key] ?? null) as ParamValue,
  labels: (values[labelKeyOf(key)] ?? null) as string | string[] | null
});

/**
 * A change held in local state while its `commit` mode delays the URL write.
 * `value`/`labels` are what the filter shows now; `commit()` is the deferred write.
 */
interface PendingChange {
  labels: string | string[] | null;
  value: ParamValue;
  commit: () => void;
}

/** Whether a value counts as "filtered": differs from `defaultValue`, or (no default) is non-empty. */
const differsFromDefault = (config: FilterConfig, value: ParamValue): boolean =>
  config.defaultValue !== undefined
    ? !valuesEqual(value, config.defaultValue)
    : hasFilterValue(value);

/**
 * Dev-only guard: warn once per filter when `loadOptions` returns ids of a type
 * that contradicts `valueType` (URL values wouldn't round-trip). Pass-through in prod.
 */
const withValueTypeCheck = (
  key: string,
  config: AsyncMultiSelectFilterConfig | AsyncSelectFilterConfig,
  warned: Set<string>
): ((search: string, signal: AbortSignal) => Promise<FilterOption[]>) => {
  if (process.env.NODE_ENV === 'production') return config.loadOptions;
  return async (search, signal) => {
    const options = await config.loadOptions(search, signal);
    const expected = config.valueType;
    const sample = options.find((option) => option.value != null);
    const actual = typeof sample?.value === 'number' ? 'number' : 'string';
    if (sample && actual !== expected && !warned.has(key)) {
      warned.add(key);
      console.warn(
        `[useFilters] "${key}": loadOptions returned ${actual}-valued options, but its valueType is '${expected}' — URL values won't round-trip${
          expected === 'number' ? ' (string ids parse back as null)' : ''
        }. Set valueType: '${actual}' on this filter.`
      );
    }
    return options;
  };
};

/** Async filters' `selectedOption(s)` + option-aware setters (`onSelectOption`, `onToggleOption`, …). */
const resolveAsyncFields = (
  asyncKind: 'multi' | 'single',
  key: string,
  draftValue: ParamValue,
  draftLabels: string | string[] | null,
  mode: FilterCommitMode,
  schedule: (
    key: string,
    value: ParamValue,
    labels: string | string[] | null,
    mode: FilterCommitMode
  ) => void
): Record<string, unknown> => {
  if (asyncKind === 'single') {
    const value = draftValue as FilterPrimitive | null;
    const label = draftLabels as string | null;
    return {
      selectedOption: value === null ? null : ({ value, label } as SelectedOption),
      onSelectOption: (option: FilterOption | null) => {
        schedule(key, option?.value ?? null, option?.label ?? null, mode);
      }
    };
  }
  const selected = (draftValue ?? []) as FilterPrimitive[];
  const labels = (draftLabels ?? []) as string[];
  return {
    selectedOptions: selected.map<SelectedOption>((value, index) => ({
      value,
      label: labels[index] ?? null
    })),
    onSetOptions: (options: FilterOption[]) => {
      schedule(
        key,
        options.length ? (options.map((option) => option.value) as ParamValue) : null,
        options.length ? options.map((option) => option.label) : null,
        mode
      );
    },
    onToggleOption: (option: FilterOption) => {
      const index = selected.indexOf(option.value);
      const nextValues = [...selected];
      const nextLabels = selected.map((value, i) => labels[i] ?? String(value));
      if (index === -1) {
        nextValues.push(option.value);
        nextLabels.push(option.label);
      } else {
        nextValues.splice(index, 1);
        nextLabels.splice(index, 1);
      }
      schedule(
        key,
        nextValues.length ? (nextValues as ParamValue) : null,
        nextValues.length ? nextLabels : null,
        mode
      );
    }
  };
};

/** Static choice filters' `selectedOption(s)` — the full option object(s) resolved from `options`. */
const resolveStaticSelectFields = (
  config: FilterConfig,
  draftValue: ParamValue
): Record<string, unknown> => {
  if (config.type === 'select') {
    return { selectedOption: config.options.find((option) => option.value === draftValue) ?? null };
  }
  if (config.type === 'multiSelect') {
    const selected = (draftValue ?? []) as FilterPrimitive[];
    return {
      selectedOptions: config.options.filter((option) => selected.includes(option.value))
    };
  }
  return {};
};

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
export function makeUseFilters<PP extends Record<string, number>>(cfg: ResolvedFiltersConfig) {
  const { pageKey, perPageKey, firstPage } = cfg;

  return function useFilters<P = never, const T extends FiltersFor<P, PP> = FiltersFor<P, PP>>(
    configs: T,
    options: UseFiltersOptions = {}
  ): UseFiltersReturn<P, PP, T> {
    const {
      history = 'replace',
      shallow = true,
      clearOnDefault = true,
      pagination = true,
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

    const entries = React.useMemo(
      () => Object.entries(configs) as [string, FilterConfig][],
      [configs]
    );

    // Structural fingerprint of everything affecting parser construction. Keying
    // `parsers` on this (not the `entries` reference) keeps URL state stable when
    // consumers pass an inline config literal — a new object every render.
    const parserSignature = React.useMemo(
      () =>
        entries
          .map(([key, config]) => {
            const valueFamily = (config as { valueType?: string }).valueType ?? '';
            return `${key}:${config.type}:${valueFamily}:${
              (config as { precision?: string }).precision ?? ''
            }:${JSON.stringify(config.defaultValue ?? null)}:${fingerprintNuqsOptions(config.nuqs)}`;
          })
          .join('|'),
      [entries]
    );

    const parsers = React.useMemo(() => {
      // `ParserMap` is intentionally `any`-valued (nuqs); our typing is recovered via `params`.
      const map: ParserMap = {};
      for (const [key, config] of entries) {
        if (process.env.NODE_ENV !== 'production' && isLabelKey(key)) {
          console.warn(
            `[useFilters] "${key}" ends with the reserved "${LABEL_SUFFIX}" suffix used by async filter label sidecars — rename it to avoid collisions.`
          );
        }
        const parser = buildParser(config, arraySeparator);
        map[key] = config.nuqs ? parser.withOptions(config.nuqs) : parser;

        // Async filters carry a `<key>_label` sidecar (display-only, same separator).
        const asyncKind = asyncKindOf(config);
        if (asyncKind) {
          const labelParser =
            asyncKind === 'multi' ? parseAsArrayOf(parseAsString, arraySeparator) : parseAsString;
          map[labelKeyOf(key)] = config.nuqs ? labelParser.withOptions(config.nuqs) : labelParser;
        }
      }
      if (paginationEnabled) {
        map[pageKey] = parseAsInteger.withDefault(firstPage);
        map[perPageKey] = parseAsInteger.withDefault(defaultPerPage);
      }
      return map;
      // `entries` is read via the stable `parserSignature`; depending on it
      // directly would rebuild parsers (and re-key `useQueryStates`) every render.
      // eslint-disable-next-line react/exhaustive-deps
    }, [parserSignature, paginationEnabled, defaultPerPage, arraySeparator]);

    const [values, setValues] = useQueryStates(parsers, { history, shallow, clearOnDefault });

    // Draft layer: non-`instant` changes land here until their `commit` mode
    // fires. `instant` filters skip it and write straight to the URL.
    const [pending, setPending] = React.useState<Record<string, PendingChange>>({});
    const timersRef = React.useRef<Record<string, ReturnType<typeof setTimeout>>>({});

    // Debounced `loadOptions` wrappers cached per key, so the timer/queued callers
    // persist across renders. Rebuilt only when `loadOptions`/`searchDebounceMs` change.
    const debouncedLoadOptionsRef = React.useRef<
      Record<
        string,
        {
          debounceMs: number;
          loadOptions: (search: string, signal: AbortSignal) => Promise<FilterOption[]>;
          wrapped: (search: string, signal: AbortSignal) => Promise<FilterOption[]>;
        }
      >
    >({});

    // Keys already warned about a loadOptions/valueType mismatch (once per filter).
    const warnedValueTypesRef = React.useRef<Set<string>>(new Set());

    const clearTimer = React.useCallback((key: string) => {
      const timer = timersRef.current[key];
      if (timer !== undefined) {
        clearTimeout(timer);
        delete timersRef.current[key];
      }
    }, []);

    const dropPending = React.useCallback((key: string) => {
      setPending((current) => {
        if (!(key in current)) return current;
        const next = { ...current };
        delete next[key];
        return next;
      });
    }, []);

    // Single-key apply/cancel — shared by the whole-set and per-filter versions.
    const applyKey = React.useCallback(
      (key: string) => {
        const change = pending[key];
        if (!change) return;
        clearTimer(key);
        change.commit();
        dropPending(key);
      },
      [pending, clearTimer, dropPending]
    );

    const cancelKey = React.useCallback(
      (key: string) => {
        if (!(key in pending)) return;
        clearTimer(key);
        dropPending(key);
      },
      [pending, clearTimer, dropPending]
    );

    // Cancel in-flight timers on unmount so they can't write to a torn-down component.
    React.useEffect(
      () => () => {
        for (const timer of Object.values(timersRef.current)) clearTimeout(timer);
      },
      []
    );

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

    // Route a change through its filter's `commit` mode. `instant` writes to the
    // URL immediately; `debounce` shows it right away but delays the write and
    // resets the timer on each call; `manual` shows it and waits for `apply()`.
    const schedule = React.useCallback(
      (
        key: string,
        value: ParamValue,
        labels: string | string[] | null,
        mode: FilterCommitMode
      ) => {
        clearTimer(key);
        const commit = () => setFilterValue(key, value, labels);
        if (mode === 'instant') {
          dropPending(key);
          commit();
          return;
        }
        // No-op guard: a change matching the committed value drops the draft
        // instead of going dirty (compares committed, not pending, so undoing clears isDirty).
        const { value: committedValue, labels: committedLabels } = readCommitted(values, key);
        if (valuesEqual(value, committedValue) && valuesEqual(labels, committedLabels)) {
          dropPending(key);
          return;
        }
        setPending((current) => ({ ...current, [key]: { commit, labels, value } }));
        if (mode === 'manual') return;
        timersRef.current[key] = setTimeout(() => {
          delete timersRef.current[key];
          dropPending(key);
          commit();
        }, mode.debounce);
      },
      [clearTimer, dropPending, setFilterValue, values]
    );

    const resolveFilter = React.useCallback(
      (key: string, config: FilterConfig): ResolvedFilter => {
        const mode = config.commit ?? defaultCommit;
        const isInstant = mode === 'instant';
        const isManual = mode === 'manual';
        const isDebounced = typeof mode === 'object';

        // Draft overlay: show the pending value if one exists, else the committed URL value.
        const change = pending[key];
        const { value: committedValue, labels: committedLabels } = readCommitted(values, key);
        const draftValue = change ? change.value : committedValue;
        const draftLabels = change ? change.labels : committedLabels;
        const doReset = () =>
          schedule(key, (config.defaultValue ?? null) as ParamValue, null, mode);
        const doInstantReset = () => {
          clearTimer(key);
          dropPending(key);
          setFilterValue(key, (config.defaultValue ?? null) as ParamValue);
        };

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
          value: draftValue,
          committedValue,
          isDirty: change !== undefined,
          // Per-filter active state; `isFiltered` tracks the committed value, `isFilteredDraft` the draft.
          isFiltered: differsFromDefault(config, committedValue),
          isFilteredDraft: differsFromDefault(config, draftValue),
          onChange: (value: ParamValue) => schedule(key, value ?? null, null, mode),
          reset: doReset,
          instantReset: doInstantReset,
          apply: () => applyKey(key),
          cancel: () => cancelKey(key)
        };

        const asyncKind = asyncKindOf(config);
        if (asyncKind) {
          // Debounce `loadOptions`, cached per key so the timer/queued callers survive renders.
          const asyncConfig = config as AsyncMultiSelectFilterConfig | AsyncSelectFilterConfig;
          const debounceMs = asyncConfig.searchDebounceMs ?? DEFAULT_ASYNC_DEBOUNCE_MS;
          const cached = debouncedLoadOptionsRef.current[key];
          const wrapped =
            cached &&
            cached.loadOptions === asyncConfig.loadOptions &&
            cached.debounceMs === debounceMs
              ? cached.wrapped
              : debounceAsync(
                  withValueTypeCheck(key, asyncConfig, warnedValueTypesRef.current),
                  debounceMs
                );
          debouncedLoadOptionsRef.current[key] = {
            debounceMs,
            loadOptions: asyncConfig.loadOptions,
            wrapped
          };
          resolved.loadOptions = wrapped;
          Object.assign(
            resolved,
            resolveAsyncFields(asyncKind, key, draftValue, draftLabels, mode, schedule)
          );
        }

        // Static choice filters: expose the full selected option(s) from `options`.
        Object.assign(resolved, resolveStaticSelectFields(config, draftValue));

        return resolved as unknown as ResolvedFilter;
      },
      [
        values,
        pending,
        schedule,
        defaultCommit,
        applyKey,
        cancelKey,
        clearTimer,
        dropPending,
        setFilterValue
      ]
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
          // (see `FilterMapOf` in types.ts). Same runtime result.
          .map(([key]) => (filterMap as Record<string, ResolvedFilter>)[key]),
      [entries, filterMap]
    );

    const params = React.useMemo(() => {
      const result: Record<string, unknown> = {};
      for (const [key] of entries) result[key] = values[key] ?? null;
      if (paginationEnabled) {
        result[pageKey] = (values[pageKey] as number | null) ?? firstPage;
        result[perPageKey] = (values[perPageKey] as number | null) ?? defaultPerPage;
      }
      return result as ParamsOf<P, T, PP>;
    }, [entries, values, paginationEnabled, defaultPerPage]);

    // Deterministic, sorted serialization of `params` — a stable cache key.
    const paramsStr = React.useMemo(
      () => serializeParamsKey(params as Record<string, unknown>, arraySeparator),
      [params, arraySeparator]
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
      (key: string, value: ParamValue) => {
        clearTimer(key);
        dropPending(key);
        setFilterValue(key, value);
      },
      [clearTimer, dropPending, setFilterValue]
    );

    // Reset every filter to its default, respecting each one's commit mode (the
    // whole-set twin of a filter's own `reset()`): instant commits now,
    // manual/debounced stage a draft. nuqs coalesces the same-tick writes.
    const reset = React.useCallback(() => {
      for (const [key, config] of entries) {
        schedule(
          key,
          (config.defaultValue ?? null) as ParamValue,
          null,
          config.commit ?? defaultCommit
        );
      }
    }, [entries, schedule, defaultCommit]);

    // Mode-bypassing counterpart to `reset`: wipe to defaults and commit in one
    // batched write, cancelling all pending drafts/timers.
    const instantReset = React.useCallback(() => {
      for (const timer of Object.values(timersRef.current)) clearTimeout(timer);
      timersRef.current = {};
      setPending({});
      const cleared: Record<string, ParamValue> = {};
      for (const [key, config] of entries) {
        cleared[key] = (config.defaultValue ?? null) as ParamValue;
        if (asyncKindOf(config)) cleared[labelKeyOf(key)] = null;
      }
      if (paginationEnabled && resetPageOnFilterChange) cleared[pageKey] = null;
      void setValues(cleared);
    }, [paginationEnabled, resetPageOnFilterChange, setValues, entries]);

    return {
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
      setFilter: setFilter as UseFiltersReturn<P, PP, T>['setFilter']
    };
  };
}
