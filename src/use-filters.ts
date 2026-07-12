import type { ParserMap } from 'nuqs';

import { parseAsArrayOf, parseAsInteger, parseAsString, useQueryStates } from 'nuqs';
import * as React from 'react';

import type {
  FilterCommitMode,
  FilterConfig,
  FilterOption,
  FilterParams,
  FilterPrimitive,
  FiltersFor,
  FiltersMeta,
  PaginationOverride,
  PaginationParams,
  ResolvedFilter,
  ResolvedFiltersConfig,
  SelectedOption
} from './types';

import { asyncKindOf, buildParser, hasFilterValue, labelKeyOf, valuesEqual } from './lib';

/** Any value nuqs can serialize for our parsers. */
type ParamValue = boolean | number | string | number[] | string[] | null;

/**
 * A change captured in local state before it's committed to the URL. Held
 * while a filter's `commit` mode delays the write — a `{ debounce: ms }` timer,
 * or `'manual'` waiting for `apply()`. The `value` / `labels` are what the
 * filter *shows* right now; `commit()` is the deferred URL write.
 */
interface PendingChange {
  labels: string | string[] | null;
  value: ParamValue;
  commit: () => void;
}

export interface UseFiltersOptions {
  /** Remove a param from the URL when it is cleared. Defaults to `true`. */
  clearOnDefault?: boolean;
  /**
   * Default `commit` mode for every filter in this call, unless a filter sets
   * its own `commit`. Overrides the `createFilters` default and is itself
   * overridden per filter. Defaults to the factory default (`'instant'`).
   * See {@link FilterCommitMode}.
   */
  defaultCommit?: FilterCommitMode;
  /** How URL updates affect history. Defaults to `'replace'`. */
  history?: 'push' | 'replace';
  /**
   * Project-specific UI hints for the whole filter set — untyped (`{}`) until
   * your app augments `FiltersMeta`. Echoed back on the return value so a
   * custom filter UI can read it without prop-drilling from the call site.
   */
  meta?: FiltersMeta;
  /**
   * Pagination for this call, overriding the `createFilters` config: `false`
   * turns it off, `true` (default) keeps the factory's, and an object overrides
   * the per-call-safe field (`defaultPerPage`). The page/per-page keys and
   * `firstPage` stay factory-only. See {@link PaginationOverride}.
   */
  pagination?: PaginationOverride;
  /** Keep navigation client-side. Defaults to `true`. */
  shallow?: boolean;
}

/**
 * The `params` shape: derived from the API params type `P` when one is given
 * (plus pagination `PP`), otherwise computed per config from the inferred map.
 */
type ParamsOf<P, T extends Record<string, FilterConfig | undefined>, PP> = [P] extends [never]
  ? FilterParams<{ [K in keyof T]-?: NonNullable<T[K]> }, PP>
  : Partial<Omit<P, keyof PP>> & PP;

/**
 * Filter keys/values only (pagination stripped) — the domain of `setFilter`.
 * Bound to `Record<string, FilterConfig | undefined>` for the same reason as
 * `FilterMapOf` below — see its doc comment.
 */
type FilterValues<P, T extends Record<string, FilterConfig | undefined>, PP> = Omit<
  ParamsOf<P, T, PP>,
  keyof PP
>;

/**
 * The `filterMap` shape: each key resolves to *its own* config's specific
 * `ResolvedFilter` variant (e.g. an `asyncSelect` key gets `onSelectOption` /
 * `selectedOption` typed to that filter's value type) rather than the general
 * `ResolvedFilter` union — a plain `Record<keyof T, ResolvedFilter>` collapses
 * `onChange`'s parameter to the union's common denominator (`null`), since a
 * union of functions is called contravariantly on their parameters.
 *
 * Deliberately bound to a plain `Record<string, FilterConfig | undefined>`
 * rather than `T extends FiltersFor<P>` directly: using a conditional type
 * (`FiltersFor<P>`) as one generic's bound while it references a *sibling*
 * generic (`P`) sends the TypeScript checker into catastrophic, multi-GB
 * blowup the moment this alias is referenced — even with both type
 * parameters fully concrete. `T` is always structurally compatible with this
 * looser, non-conditional bound (the `-?`/`NonNullable` below do the same
 * "strip the optionality `FiltersFor<P>` can introduce" job a two-branch
 * version would), so nothing is lost.
 */
type FilterMapOf<T extends Record<string, FilterConfig | undefined>> = {
  [K in keyof T]-?: ResolvedFilter<NonNullable<T[K]>>;
};

export interface UseFiltersReturn<
  P = never,
  PP extends Record<string, number> = PaginationParams,
  T extends FiltersFor<P, PP> = FiltersFor<P, PP>
> {
  /**
   * Same resolved filters as `filters`, keyed by their config key instead of
   * listed as an array — for reaching a specific filter directly (e.g. to
   * render its control in a custom spot outside your filter toolbar).
   * Unlike `filters`, this also includes hidden ones.
   */
  filterMap: FilterMapOf<T>;
  /** Resolved filters (config + value + handlers) — pass to your filter UI. */
  filters: ResolvedFilter[];
  /**
   * `true` when at least one filter has a change that hasn't reached the URL
   * yet — a pending `commit: { debounce }` timer, or a `commit: 'manual'`
   * change awaiting `apply()`. Always `false` when every filter is the default
   * `commit: 'instant'`. Use it to enable an "Apply" button / show a dot.
   */
  isDirty: boolean;
  /** `true` when at least one filter is active. */
  isFiltered: boolean;
  /** The `meta` passed to `useFilters` (or `{}` when omitted) — see `FiltersMeta`. */
  meta: FiltersMeta;
  /**
   * Current values keyed by your config keys, plus the API pagination params
   * (`{ page, per_page }` by default). Unset filters are `null`. Pass this
   * straight to your query options / data fetcher — and use it as your query
   * key so caching updates when a filter changes.
   */
  params: ParamsOf<P, T, PP>;
  /**
   * Commit every pending change at once — including ones still waiting on a
   * `commit: { debounce }` timer — and cancel those timers. Wire it to a
   * "Apply filters" button for `commit: 'manual'` filters (e.g. a mobile
   * sheet). A no-op when nothing is pending. See {@link FilterCommitMode}.
   */
  apply: () => void;
  /**
   * Discard every pending change, reverting each filter to its last committed
   * (URL) value. Wire it to a "Cancel"/"Reset" button next to `apply`.
   */
  cancel: () => void;
  /** Clear every filter at once. */
  reset: () => void;
  /**
   * Imperatively set one filter's value — for custom UI (tab buttons, quick
   * presets) driving a filter outside your filter toolbar. Resets to the
   * first page like any filter change.
   */
  setFilter: <K extends keyof FilterValues<P, T, PP>>(
    key: K,
    value: FilterValues<P, T, PP>[K] | null
  ) => void;
}

/**
 * Build a `useFilters` hook bound to a resolved per-project config. You don't
 * call this yourself — `createFilters` does, and re-exports the resulting hook
 * (plus a matching `resolveFilterParams`) so both share the same constants.
 * The top-level `useFilters` export is one such hook, bound to the defaults.
 *
 * ---
 *
 * `useFilters` gives you declarative, URL-synced filtering. You describe your
 * filters once as a `key -> f.*()` map; the hook keeps their state in the URL
 * query string (the URL is the source of truth, so refreshes and shared links
 * just work) and hands back everything you need:
 *
 * - `params`   — current values keyed like your configs, plus pagination —
 *                pass straight to your data fetcher / query options.
 * - `filters`  — an array of resolved filters (config + value + handlers) to
 *                render your own toolbar from. This package ships no UI.
 * - `filterMap`, `isFiltered`, `reset`, `setFilter`, `meta` — see below.
 *
 * Requires a nuqs adapter mounted once at your app root (see the nuqs docs).
 *
 * Pass your API's list-params type as `<P>` to get key autocomplete, config
 * checking against that type, and an API-shaped `params`:
 *
 * @example
 * const { params, filters, isFiltered, reset } = useFilters<ListParams>({
 *   search: f.text({ label: 'Search' }),
 *   status: f.select({ label: 'Status', options: statusOptions })
 * });
 *
 * const { data } = useQuery(listQueryOptions(params));
 *
 * // Render your own UI from `filters` — each carries `value` + `onChange`:
 * // filters.map((filter) => <MyControl key={filter.key} {...filter} />)
 *
 * Without a type argument the config map is inferred as-is and `params` is
 * typed per config. (Supplying `<P>` turns off that per-config inference —
 * TypeScript can't do both at once — but you rarely need both.)
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
      // Precedence: per-filter `commit` > this call's `defaultCommit` > the
      // factory's `defaultCommit` (`cfg.defaultCommit`, already `'instant'`).
      defaultCommit = cfg.defaultCommit,
      meta = {} as FiltersMeta
    } = options;

    // `pagination` is `false` (off), `true`/omitted (factory as-is), or an
    // object overriding the per-call-safe `defaultPerPage`. Keys / `firstPage`
    // always come from the factory so `params` matches `resolveFilterParams`.
    const paginationEnabled = pagination !== false;
    const defaultPerPage =
      typeof pagination === 'object'
        ? (pagination.defaultPerPage ?? cfg.defaultPerPage)
        : cfg.defaultPerPage;

    const entries = React.useMemo(
      // `T` may be an all-optional map when `P` is given; runtime only ever sees
      // the concrete configs that were actually passed.
      () => Object.entries(configs) as [string, FilterConfig][],
      [configs]
    );

    // Structural fingerprint of everything that affects parser construction
    // (keys, types, defaults, value/precision, per-filter nuqs opts). Consumers
    // routinely pass an inline config literal — a new object every render — so
    // memoizing `parsers` on the `configs`/`entries` *reference* would rebuild
    // them (and re-key `useQueryStates`) on every render. Keying on this
    // fingerprint instead keeps URL state stable regardless of config identity.
    const parserSignature = React.useMemo(
      () =>
        entries
          .map(
            ([key, config]) =>
              `${key}:${config.type}:${(config as { valueType?: string }).valueType ?? ''}:${
                (config as { precision?: string }).precision ?? ''
              }:${JSON.stringify(config.defaultValue ?? null)}:${config.nuqs ? '1' : '0'}`
          )
          .join('|'),
      [entries]
    );

    const parsers = React.useMemo(() => {
      // nuqs's own heterogeneous parser-map type: values are parsers over
      // different value types, so it is intentionally `any`-valued (see nuqs's
      // `ParserMap`). Our own value typing is recovered downstream via `params`.
      const map: ParserMap = {};
      for (const [key, config] of entries) {
        if (process.env.NODE_ENV !== 'production' && key.endsWith('_label')) {
          console.warn(
            `[useFilters] "${key}" ends with the reserved "_label" suffix used by async filter label sidecars — rename it to avoid collisions.`
          );
        }
        const parser = buildParser(config);
        // Per-filter nuqs options take precedence over the hook-level ones
        // passed to `useQueryStates` below (nuqs resolves call > parser > hook).
        map[key] = config.nuqs ? parser.withOptions(config.nuqs) : parser;

        // Async filters carry a `<key>_label` sidecar so selected labels survive
        // a refresh without a by-id endpoint. Display-only: never sent to the API.
        const asyncKind = asyncKindOf(config);
        if (asyncKind) {
          const labelParser = asyncKind === 'multi' ? parseAsArrayOf(parseAsString) : parseAsString;
          map[labelKeyOf(key)] = config.nuqs ? labelParser.withOptions(config.nuqs) : labelParser;
        }
      }
      if (paginationEnabled) {
        // `page` / `per_page` are mirrored straight into `params` (see `params`),
        // starting from `firstPage`.
        map[pageKey] = parseAsInteger.withDefault(firstPage);
        map[perPageKey] = parseAsInteger.withDefault(defaultPerPage);
      }
      return map;
      // `entries` is read through the stable `parserSignature` fingerprint (see
      // its comment above), so depending on it directly would rebuild the parsers
      // — and re-key `useQueryStates` — on every render.
      // eslint-disable-next-line react/exhaustive-deps
    }, [parserSignature, paginationEnabled, defaultPerPage]);

    const [values, setValues] = useQueryStates(parsers, { history, shallow, clearOnDefault });

    // Draft layer: changes for non-`instant` filters land here first and only
    // reach `values`/the URL once their `commit` mode fires (a debounce timer,
    // or `apply()`). `instant` filters never touch this — they write straight
    // through, so an all-instant config behaves exactly like plain URL state.
    const [pending, setPending] = React.useState<Record<string, PendingChange>>({});
    const timersRef = React.useRef<Record<string, ReturnType<typeof setTimeout>>>({});

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

    // Cancel any in-flight debounce timers on unmount so they can't fire a
    // URL write against a torn-down component.
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
        // Keep the label sidecar in sync — cleared together, written together.
        if (config && asyncKindOf(config)) updates[labelKeyOf(key)] = labels;
        // Changing any filter returns to the first page.
        if (paginationEnabled) updates[pageKey] = null;
        void setValues(updates);
      },
      [setValues, paginationEnabled, configByKey]
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
        setPending((current) => ({ ...current, [key]: { commit, labels, value } }));
        if (mode === 'manual') return;
        timersRef.current[key] = setTimeout(() => {
          delete timersRef.current[key];
          dropPending(key);
          commit();
        }, mode.debounce);
      },
      [clearTimer, dropPending, setFilterValue]
    );

    const resolveFilter = React.useCallback(
      (key: string, config: FilterConfig): ResolvedFilter => {
        // Per-filter `commit` wins; otherwise the resolved default (call option,
        // then factory config, then `'instant'`).
        const mode = config.commit ?? defaultCommit;
        // Draft overlay: while a change is pending, the filter shows the pending
        // value/labels; otherwise it shows what's committed in the URL.
        const change = pending[key];
        const draftValue = change ? change.value : (values[key] ?? null);
        const draftLabels = change
          ? change.labels
          : ((values[labelKeyOf(key)] as string | string[] | null) ?? null);

        const resolved: Record<string, unknown> = {
          ...config,
          key,
          // Expose the *effective* commit mode (after applying the defaults),
          // not just the per-filter override, so UIs can read it uniformly.
          commit: mode,
          value: draftValue,
          onChange: (value: ParamValue) => schedule(key, value ?? null, null, mode),
          // Clearing returns to the default (or empty when there is none).
          onClear: () => schedule(key, (config.defaultValue ?? null) as ParamValue, null, mode)
        };

        // Async filters: pair values with their labels and expose option-aware
        // setters that write both in one atomic update (via the draft layer).
        const asyncKind = asyncKindOf(config);
        if (asyncKind === 'single') {
          const value = draftValue as FilterPrimitive | null;
          const label = draftLabels as string | null;
          resolved.selectedOption = value === null ? null : ({ value, label } as SelectedOption);
          resolved.onSelectOption = (option: FilterOption | null) => {
            schedule(key, option?.value ?? null, option?.label ?? null, mode);
          };
        } else if (asyncKind === 'multi') {
          const selected = (draftValue ?? []) as FilterPrimitive[];
          const labels = (draftLabels ?? []) as string[];
          resolved.selectedOptions = selected.map<SelectedOption>((value, index) => ({
            value,
            label: labels[index] ?? null
          }));
          resolved.onSetOptions = (options: FilterOption[]) => {
            schedule(
              key,
              options.length ? (options.map((option) => option.value) as ParamValue) : null,
              options.length ? options.map((option) => option.label) : null,
              mode
            );
          };
          resolved.onToggleOption = (option: FilterOption) => {
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
          };
        }

        // Static choice filters: expose the full selected option(s) resolved
        // from `options`, so callers read `.label` without a value→option lookup.
        if (config.type === 'select') {
          resolved.selectedOption =
            config.options.find((option) => option.value === draftValue) ?? null;
        } else if (config.type === 'multiSelect') {
          const selected = (draftValue ?? []) as FilterPrimitive[];
          resolved.selectedOptions = config.options.filter((option) =>
            selected.includes(option.value)
          );
        }

        return resolved as unknown as ResolvedFilter;
      },
      [values, pending, schedule, defaultCommit]
    );

    // Keyed lookup — includes hidden filters, since a caller reaching for one by
    // key (rather than iterating `filters`) may still want a hidden one's state.
    const filterMap = React.useMemo(
      () =>
        Object.fromEntries(
          entries.map(([key, config]) => [key, resolveFilter(key, config)])
        ) as FilterMapOf<T>,
      [entries, resolveFilter]
    );

    // Hidden filters keep their value in `params` but are not rendered.
    const filters = React.useMemo<ResolvedFilter[]>(
      () =>
        entries
          .filter(([, config]) => !config.hidden)
          // Cast away `keyof T` here rather than `filterMap[key as keyof T]` — indexing a
          // `FilterMapOf<T>` by an asserted `keyof T` is what was blowing up the checker
          // (see `FilterMapOf`'s doc comment); a plain `Record<string, ResolvedFilter>`
          // read is exactly as safe at runtime and doesn't re-touch the generic.
          .map(([key]) => (filterMap as Record<string, ResolvedFilter>)[key]),
      [entries, filterMap]
    );

    const params = React.useMemo(() => {
      const result: Record<string, unknown> = {};
      for (const [key] of entries) result[key] = values[key] ?? null;
      if (paginationEnabled) {
        // `params` mirrors the URL keys: the page / per_page values pass
        // straight through under `pageKey` / `perPageKey`.
        result[pageKey] = (values[pageKey] as number | null) ?? firstPage;
        result[perPageKey] = (values[perPageKey] as number | null) ?? defaultPerPage;
      }
      return result as ParamsOf<P, T, PP>;
    }, [entries, values, paginationEnabled, defaultPerPage]);

    // A visible filter is "active" when it differs from its default (or, with no
    // default, when it simply holds a non-empty value).
    const isFiltered = React.useMemo(
      () =>
        entries.some(([key, config]) => {
          if (config.hidden) return false;
          const value = values[key];
          return config.defaultValue !== undefined
            ? !valuesEqual(value, config.defaultValue)
            : hasFilterValue(value);
        }),
      [entries, values]
    );

    // A change is "dirty" until it reaches the URL — i.e. a `debounce` timer is
    // still pending or a `manual` filter is waiting for `apply()`.
    const isDirty = Object.keys(pending).length > 0;

    // Flush every pending change to the URL at once (the "Apply" action),
    // cancelling their debounce timers so none fires a second, stale write.
    const apply = React.useCallback(() => {
      const changes = Object.values(pending);
      if (changes.length === 0) return;
      for (const key of Object.keys(pending)) clearTimer(key);
      for (const change of changes) change.commit();
      setPending({});
    }, [pending, clearTimer]);

    // Drop every pending change — the filters snap back to their committed URL
    // values on the next render.
    const cancel = React.useCallback(() => {
      for (const key of Object.keys(pending)) clearTimer(key);
      setPending({});
    }, [pending, clearTimer]);

    // Imperative set: bypass the draft layer (and clear any pending draft for
    // this key) so it lands in the URL immediately, whatever the commit mode.
    const setFilter = React.useCallback(
      (key: string, value: ParamValue) => {
        clearTimer(key);
        dropPending(key);
        setFilterValue(key, value);
      },
      [clearTimer, dropPending, setFilterValue]
    );

    const reset = React.useCallback(() => {
      for (const timer of Object.values(timersRef.current)) clearTimeout(timer);
      timersRef.current = {};
      setPending({});
      const cleared: Record<string, ParamValue> = {};
      for (const [key, config] of entries) {
        cleared[key] = (config.defaultValue ?? null) as ParamValue;
        if (asyncKindOf(config)) cleared[labelKeyOf(key)] = null;
      }
      if (paginationEnabled) cleared[pageKey] = null;
      void setValues(cleared);
    }, [paginationEnabled, setValues, entries]);

    return {
      params,
      filters,
      filterMap,
      isDirty,
      isFiltered,
      meta,
      apply,
      cancel,
      reset,
      setFilter: setFilter as UseFiltersReturn<P, PP, T>['setFilter']
    };
  };
}
