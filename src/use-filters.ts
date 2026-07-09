import type { ParserMap } from 'nuqs';

import { parseAsArrayOf, parseAsInteger, parseAsString, useQueryStates } from 'nuqs';
import * as React from 'react';

import type {
  FilterConfig,
  FilterOption,
  FilterParams,
  FilterPrimitive,
  FiltersFor,
  FiltersMeta,
  PaginationParams,
  ResolvedFilter,
  ResolvedFiltersConfig,
  SelectedOption
} from './types';

import { asyncKindOf, buildParser, hasFilterValue, labelKeyOf, valuesEqual } from './lib';

/** Any value nuqs can serialize for our parsers. */
type ParamValue = boolean | number | string | number[] | string[] | null;

export interface UseFiltersOptions {
  /** Remove a param from the URL when it is cleared. Defaults to `true`. */
  clearOnDefault?: boolean;
  /** Initial page size when none is in the URL. Defaults to the factory's `defaultPageSize`. */
  defaultPageSize?: number;
  /** How URL updates affect history. Defaults to `'replace'`. */
  history?: 'push' | 'replace';
  /**
   * Project-specific UI hints for the whole filter set — untyped (`{}`) until
   * your app augments `FiltersMeta`. Echoed back on the return value so a
   * custom filter UI can read it without prop-drilling from the call site.
   */
  meta?: FiltersMeta;
  /**
   * Sync `page` / `page_size` in the URL, expose them as the API-shaped
   * pagination params (`mapPagination`) in `params`, and reset to the first
   * page whenever a filter changes. Defaults to `true`.
   */
  pagination?: boolean;
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
  /** `true` when at least one filter is active. */
  isFiltered: boolean;
  /** The `meta` passed to `useFilters` (or `{}` when omitted) — see `FiltersMeta`. */
  meta: FiltersMeta;
  /**
   * Current values keyed by your config keys, plus the API pagination params
   * (`{ limit, offset }` by default). Unset filters are `null`. Pass this
   * straight to your query options / data fetcher — and use it as your query
   * key so caching updates when a filter changes.
   */
  params: ParamsOf<P, T, PP>;
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
export function makeUseFilters<PP extends Record<string, number>>(cfg: ResolvedFiltersConfig<PP>) {
  const { pageKey, pageSizeKey, defaultPage, mapPagination } = cfg;

  return function useFilters<P = never, const T extends FiltersFor<P, PP> = FiltersFor<P, PP>>(
    configs: T,
    options: UseFiltersOptions = {}
  ): UseFiltersReturn<P, PP, T> {
    const {
      history = 'replace',
      shallow = true,
      clearOnDefault = true,
      pagination = true,
      defaultPageSize = cfg.defaultPageSize,
      meta = {} as FiltersMeta
    } = options;

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
      if (pagination) {
        // The URL always speaks human `page` / `page_size`; the API shape is
        // produced from them by `mapPagination` at read time (see `params`).
        map[pageKey] = parseAsInteger.withDefault(defaultPage);
        map[pageSizeKey] = parseAsInteger.withDefault(defaultPageSize);
      }
      return map;
      // eslint-disable-next-line react-hooks/exhaustive-deps -- `entries` is read
      // through the stable `parserSignature`; see its comment above.
    }, [parserSignature, pagination, defaultPageSize]);

    const [values, setValues] = useQueryStates(parsers, { history, shallow, clearOnDefault });

    const configByKey = React.useMemo(() => new Map(entries), [entries]);

    const setFilterValue = React.useCallback(
      (key: string, value: ParamValue, labels: string | string[] | null = null) => {
        const config = configByKey.get(key);
        const updates: Record<string, ParamValue> = { [key]: value ?? null };
        // Keep the label sidecar in sync — cleared together, written together.
        if (config && asyncKindOf(config)) updates[labelKeyOf(key)] = labels;
        // Changing any filter returns to the first page.
        if (pagination) updates[pageKey] = null;
        void setValues(updates);
      },
      [setValues, pagination, configByKey]
    );

    const resolveFilter = React.useCallback(
      (key: string, config: FilterConfig): ResolvedFilter => {
        const resolved: Record<string, unknown> = {
          ...config,
          key,
          value: values[key] ?? null,
          onChange: (value: ParamValue) => setFilterValue(key, value),
          // Clearing returns to the default (or empty when there is none).
          onClear: () => setFilterValue(key, (config.defaultValue ?? null) as ParamValue)
        };

        // Async filters: pair values with their URL-stored labels and expose
        // option-aware setters that write both params in one atomic update.
        const asyncKind = asyncKindOf(config);
        if (asyncKind === 'single') {
          const value = (values[key] ?? null) as FilterPrimitive | null;
          const label = (values[labelKeyOf(key)] ?? null) as string | null;
          resolved.selectedOption = value === null ? null : ({ value, label } as SelectedOption);
          resolved.onSelectOption = (option: FilterOption | null) => {
            setFilterValue(key, option?.value ?? null, option?.label ?? null);
          };
        } else if (asyncKind === 'multi') {
          const selected = (values[key] ?? []) as FilterPrimitive[];
          const labels = (values[labelKeyOf(key)] ?? []) as string[];
          resolved.selectedOptions = selected.map<SelectedOption>((value, index) => ({
            value,
            label: labels[index] ?? null
          }));
          resolved.onSetOptions = (options: FilterOption[]) => {
            setFilterValue(
              key,
              options.length ? (options.map((option) => option.value) as ParamValue) : null,
              options.length ? options.map((option) => option.label) : null
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
            setFilterValue(
              key,
              nextValues.length ? (nextValues as ParamValue) : null,
              nextValues.length ? nextLabels : null
            );
          };
        }

        // Static choice filters: expose the full selected option(s) resolved
        // from `options`, so callers read `.label` without a value→option lookup.
        if (config.type === 'select') {
          resolved.selectedOption =
            config.options.find((option) => option.value === (values[key] ?? null)) ?? null;
        } else if (config.type === 'multiSelect') {
          const selected = (values[key] ?? []) as FilterPrimitive[];
          resolved.selectedOptions = config.options.filter((option) =>
            selected.includes(option.value)
          );
        }

        return resolved as unknown as ResolvedFilter;
      },
      [values, setFilterValue]
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
      if (pagination) {
        // URL speaks `page` / `page_size`; `mapPagination` turns them into the
        // API's pagination params (`{ limit, offset }` by default).
        const page = (values[pageKey] as number | null) ?? defaultPage;
        const pageSize = (values[pageSizeKey] as number | null) ?? defaultPageSize;
        Object.assign(result, mapPagination(page, pageSize));
      }
      return result as ParamsOf<P, T, PP>;
    }, [entries, values, pagination, defaultPageSize]);

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

    const reset = React.useCallback(() => {
      const cleared: Record<string, ParamValue> = {};
      for (const [key, config] of entries) {
        cleared[key] = (config.defaultValue ?? null) as ParamValue;
        if (asyncKindOf(config)) cleared[labelKeyOf(key)] = null;
      }
      if (pagination) cleared[pageKey] = null;
      void setValues(cleared);
    }, [pagination, setValues, entries]);

    return {
      params,
      filters,
      filterMap,
      isFiltered,
      meta,
      reset,
      setFilter: setFilterValue as UseFiltersReturn<P, PP, T>['setFilter']
    };
  };
}
