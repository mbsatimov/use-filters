# Changelog

## 1.0.0-beta.0

### Major Changes

- 795f562: ### Changed

  - **`useFilters<P>` now enforces a contract derived from `P`'s own shape — and
    `params` is typed as exactly `P`** (was `Partial<P>`, which was unsound: unset
    filters are `null` at runtime, never `undefined`). The same `<P>` works
    identically on `resolveFilterParams<P>` and `defineFilters<P>` (both
    previously inference-only), so a shared config can be validated once and
    produce `P`-shaped params in the hook and the loader alike.

    The obligations mirror the type:
    - a **required** key in `P` must have a filter declared; optional (`?:`) keys
      may omit one (the key is then absent from `params`).
    - a **non-nullable** param must set `defaultValue` (its value can never be
      `null`); a `| null` param may leave it unset.

    ```ts
    interface ProductListParams {
      status: 'open' | 'closed' | null; // filter required, default optional
      sort: 'date' | 'price'; //           filter AND defaultValue required
      search?: string | null; //           filter optional, default optional
      page: number;
      per_page: number;
    }

    const { params } = useFilters<ProductListParams>({
      status: f.select({ label: 'Status', valueType: 'string', options: statusOptions }),
      sort: f.select({
        label: 'Sort',
        valueType: 'string',
        options: sortOptions,
        defaultValue: 'date'
      }),
      search: f.text({ label: 'Search' })
    });

    productApi.getAll(params); // ✓ compiles — soundly: every claim `P` makes is true at runtime
    ```

    **Migration**: params your API allows to be absent/unset should be declared
    optional and/or `| null` (`search?: string | null`); non-nullable params need
    a `defaultValue` on their filter; every required key needs a filter. Configs
    that previously compiled against a `P` with plain optionals (`search?: string`)
    now error until one of those is applied — each error names the missing key or
    the missing `defaultValue`.

    For validation **with** full per-config inference (precise literal types,
    non-null defaulted params), check the config with `satisfies FiltersFor<P>`
    and call `useFilters(configs)` without the type argument.

- 08265b3: ### Removed

  - **`FilterOption.icon` / `leftSlot` / `rightSlot`, and the per-filter `className`** —
    rendering hints don't belong on a headless core. Declare what you need on
    `FilterOptionMeta` / `FilterMeta` and pass it via `meta` instead (same data, typed
    by you). See [UI metadata](https://use-filters.vercel.app/docs/guides/ui-metadata).
  - **`unit` on `f.number` / `f.numberRange`** — same reasoning; declare a `unit` field
    on `NumberFilterMeta` / `NumberRangeFilterMeta` and pass it via `meta`.

  ### Changed
  - **`valueType` is now required** on `f.select`, `f.multiSelect`, `f.asyncSelect`,
    and `f.asyncMultiSelect` — `'number' | 'string'`, checked against `options` (a
    mismatched option is a compile error on that option).

    ```ts
    // before
    status: f.select({ label: 'Status', options: statusOptions });
    // after
    status: f.select({ label: 'Status', valueType: 'string', options: statusOptions });
    ```

    Previously the value type was inferred from `options`/`defaultValue` when
    present, and fell back to a runtime sniff with a dev-mode warning when it
    couldn't be determined (e.g. options fetched at runtime and not yet loaded) —
    a sniff that could disagree between the hook (options loaded) and
    `resolveFilterParams` in a route loader (options empty), silently splitting a
    query key. Requiring `valueType` makes that class of bug a compile error
    instead of a runtime footgun, and removes the sniffing/indeterminate-warning
    machinery entirely — simpler internals, one way to declare a choice filter's
    value type.

- c7e7cf5: ### Removed

  - **`onClear` on resolved filters** — it was a deprecated alias for `reset` (the
    same function reference). Call `reset()` instead.

  ### Changed
  - **The hook's whole-set `reset()` now respects each filter's `commit` mode**,
    matching how each filter's own `reset()` already behaved. Previously the
    whole-set `reset()` bypassed commit modes and wrote to the URL immediately;
    now `'instant'` filters commit right away while `'manual'` / `{ debounce }`
    filters stage the cleared value as a draft and wait for `apply()`, exactly
    like any other change. This removes the surprise of `reset()` and a filter's
    own `reset()` doing two different things.

    For the previous "clear everything immediately, whatever the commit mode"
    behavior, use the new `instantReset()` (below) — e.g. a toolbar "Clear all"
    button:

    ```ts
    // before — reset() always cleared immediately
    <button onClick={reset}>Clear all</button>

    // after — instantReset() is the immediate, mode-bypassing clear
    const { instantReset } = useFilters(configs);
    <button onClick={instantReset}>Clear all</button>
    ```

  ### Added
  - **`instantReset()` on the hook** — clears every filter to its default in one
    batched URL write, bypassing commit modes and cancelling any pending drafts /
    debounce timers. The whole-set twin of each resolved filter's own
    `instantReset()`, and the mode-bypassing counterpart to the hook's `reset()`
    (the same relationship `setFilter` has to a filter's `onChange`).

### Minor Changes

- 8301085: ### Added

  - **`listeners`** on `useFilters` options — declarative side-effect hooks, à la
    TanStack Form. `onParamsChange` fires (in an effect) whenever the committed
    `params` change, with the new params, the previous params, what triggered the
    change, and the whole hook API:

    ```ts
    useFilters(configs, {
      listeners: {
        onParamsChange: ({ params, prev, cause, api }) => {
          if (cause === 'reset') void api.post?.('/reset-event', params);
        }
      }
    });
    ```

    `cause` is `'change' | 'reset' | 'external'` (`'external'` = a back/forward
    navigation, another URL consumer, or a pagination write you own). `params`,
    `prev`, and `api` are fully typed from your config. It fires only on
    **committed** changes — never on mount, on a draft edit before commit, or when
    a change resolves to the same value. Exports the `UseFiltersListeners`,
    `ParamsChangeContext`, and `ParamsChangeCause` types.

- 61c174f: ### Added

  - **`paramsStr`** on the `useFilters` return — `params` serialized to a
    deterministic, sorted string, for use as a stable cache key or memo
    dependency when comparing a string is handier than an object:

    ```ts
    const { params, paramsStr } = useFilters(configs);
    // params { page: 1, per_page: 10, search: 'acme', status: 'open' }
    // paramsStr "page=1&per_page=10&search=acme&status=open"

    const { data } = useQuery({ queryKey: [paramsStr], queryFn: () => fetchList(params) });
    ```

    Keys are sorted (so config/key order never changes it), unset/empty filters
    are dropped (so equivalent states produce the same string), and values are
    URL-encoded (so special characters can't collide). Array values join with the
    call's `arraySeparator`.

### Patch Changes

- 9aac5c6: ### Fixed

  - **`params.<key>` is now non-null when the filter declares a `defaultValue`.**
    A filter with a default can never resolve to `null` at runtime (nuqs
    `withDefault`, and reset/clear fall back to the default), but the type still
    included `| null`. The `f.*` builders now capture whether a `defaultValue` was
    given and drop `| null` from that key's value type — everywhere `params` is
    derived (the hook, `resolveFilterParams`, and the resolved filter's
    `value` / `committedValue`):

    ```ts
    const { params } = useFilters({
      search: f.text({ label: 'Search' }), // string | null  (no default)
      per_page: f.number({ label: 'Per page', defaultValue: 25 }), // number  (never null)
      status: f.select({ label: 'Status', valueType: 'string', options, defaultValue: 'open' }) // Status  (never null)
    });
    ```

    Filters without a default are unchanged (`V | null`). A defaulted filter is
    still clearable — its `onChange` still accepts `null`, which resets it to the
    default. Works across every builder (`text`, `number`, `boolean`, ranges,
    dates/times, `select`/`multiSelect`, `asyncSelect`/`asyncMultiSelect`, `tags`).

## 0.9.0

### Minor Changes

- 485fcbc: ### Added

  - **`defineFilters`** — bind one screen's config map and its shared
    `{ arraySeparator, pagination }` call option **once**, for both `useFilters`
    and `resolveFilterParams`, so the two can't drift out of sync:

    ```ts
    export const loanFilters = defineFilters(
      { search: f.text({ label: 'Search' }) },
      { arraySeparator: '|' }
    );

    // component:
    const { params } = loanFilters.useFilters({ defaultCommit: 'manual' });
    // route loader — same arraySeparator, guaranteed:
    const params = loanFilters.resolveFilterParams(new URL(request.url).searchParams);
    ```

    Previously, passing the same `{ configs, options }` to both calls by hand had
    no guard against one side being updated (say, a new `arraySeparator`) and the
    other forgotten — silently splitting the query key between the hook and the
    loader. `defineFilters` returns a bound `useFilters`/`resolveFilterParams`
    pair where `arraySeparator`/`pagination` can only be set in one place;
    hook-only options (`defaultCommit`, `meta`, `history`, `shallow`,
    `clearOnDefault`) still vary per `useFilters()` call, since they can't affect
    `resolveFilterParams` either way. Available on every `createFilters(...)`
    instance and the default export. Exports the `SharedFilterCallOptions` type.

## 0.8.0

### Minor Changes

- 722ba8d: ### Added

  - **`AnyUseFiltersReturn`** — the return of _any_ `useFilters` call, whatever
    config produced it. For pass-through components (a shared filter toolbar, a
    debug panel, a mobile filter sheet) that receive a `useFilters` return as a
    prop and read it opaquely: previously typing that prop required being
    generic over both the config map and the pagination shape (and understanding
    parameter contravariance to see why); now it's one non-generic type. Reads
    stay typed (`filters` is the usual `ResolvedFilter[]`); only what a
    key-agnostic component can't use anyway loosens (`params` values are
    `unknown`, `setFilter` is uncallable).

  ### Fixed
  - **A narrowly-typed resolved filter is now assignable to the wide
    `ResolvedFilter`** — e.g. `filterMap.status` (with `'open' | 'closed'`
    options) can be passed to a component prop typed `ResolvedFilter` without a
    cast. The value-taking handlers (`onChange`, `onSelectOption`,
    `onSetOptions`, `onToggleOption`) are now declared with method syntax, whose
    bivariant parameter checking permits exactly this widening; the unsafe
    reverse direction (wide where narrow is expected) is still rejected via the
    covariant `value` property.

- 722ba8d: Packaging, correctness, and headless-purity hardening.

  ### Fixed
  - **CJS consumers no longer get mismatched (ESM-flavored) type declarations.**
    The `exports` map now ships per-condition types (`import` →
    `dist/index.d.ts`, `require` → `dist/index.d.cts`), fixing the
    "Masquerading as ESM" resolution error under `moduleResolution: node16`
    from CJS. Verified with `@arethetypeswrong/cli`, which now runs in CI and
    before every publish (`npm run check:exports`).
  - **Dynamic `select` / `multiSelect` filters now re-parse correctly when
    options arrive after mount.** Previously a backend-driven filter whose
    options started `[]` and later loaded numeric values kept its string parse
    forever — `?ids=1,2` stayed `['1','2']` and never matched what
    `resolveFilterParams` computes in a route loader. Two-part fix: the
    structural parser fingerprint now includes the options' value family
    (numeric vs. string) so the parser map re-keys, and already-committed values
    are normalized through the current parser (nuqs caches parsed state per
    query string, so re-keying alone never re-parses an unchanged param).
    Content changes to a filter's per-filter `nuqs` options are now
    fingerprinted too (previously only their presence/absence was).
  - Removed a false JSDoc claim that async `loadOptions` results "are cached per
    search string" — they are debounced and abortable, not cached.

  ### Added
  - **`valueType` on `select` / `multiSelect`.** Choice filters now take an
    optional `valueType: 'number' | 'string'` — a static declaration of how the
    value round-trips through the URL. The token is the declaration: when set it
    drives the value type (empty options still give a `number | null` param
    under `valueType: 'number'`), and `options` are type-checked against it — a
    mismatched option is a compile error on that option. With static options and
    no token the type is still inferred, so nothing changes for the common case. It matters when **options are fetched at runtime**: the same
    config is then also used somewhere the options aren't loaded (a route loader
    calling `resolveFilterParams`), where the previous approach — sniffing the
    option values — had nothing to read and the hook and loader could parse the
    same URL to different types (`5` vs `'5'`), splitting the query key.
    `valueType` is the shared source of truth that keeps them identical.
    `resolveFilterParams` now warns (dev only) when it meets an options-less
    choice filter without a `valueType`, catching the divergence at its source.
    Exports the `ChoiceValueType` type.
  - **`resolveFilterParams` accepts `URLSearchParams` and raw query strings** in
    addition to plain objects — pass `new URL(request.url).searchParams`
    (React Router) or `location.search` directly. Exports the `RawSearchParams`
    type.
  - **`FilterOption.meta` + augmentable `FilterOptionMeta`** — the per-option
    counterpart to `FilterMeta`, for project-specific option UI hints (icons,
    swatches, shortcut labels) without baking rendering concerns into the core.
  - **Dev-mode `valueType` mismatch warning.** An async filter whose
    `loadOptions` resolves options contradicting its `valueType` (e.g. string
    UUID ids under the numeric default) now warns once per filter in
    development — previously such values silently parsed back from the URL as
    `null`.
  - Type-level tests (`expectTypeOf`) locking in `params` inference, explicit
    `<P>` validation, renamed-pagination-key typing, and resolved-filter
    narrowing.

  ### Deprecated (removal in 1.0)
  - `FilterOption.icon` / `leftSlot` / `rightSlot` and the per-filter
    `className` — rendering hints don't belong on a headless core. Declare the
    fields you need on `FilterOptionMeta` / `FilterMeta` and pass them via
    `meta`; behavior is unchanged until 1.0.

  ### Changed
  - `engines.node` is now `>=20` (Node 18 is end-of-life). The library code is
    unchanged — this only affects tooling expectations.

- 722ba8d: ### Added

  - **`resetPageOnFilterChange` pagination option.** By default, changing any
    filter resets the page to `firstPage` (a changed filter invalidates the old
    result window). Set it to `false` — in `createFilters`'s `pagination`, or per
    call via the `pagination` object on `useFilters`' options — when pagination
    is driven entirely outside the hook and it should never write the page
    param. Applies to the whole-set `reset()` too.

## 0.7.0

### Minor Changes

- 014be90: `asyncSelect`/`asyncMultiSelect` now actually debounce `loadOptions`. Previously the option was documented but never read, so a search box calling `onChange` on every keystroke fired `loadOptions` once per keystroke. Calls within the debounce window (default `300`) of each other now collapse into a single underlying call, using the last call's arguments — every caller in that window resolves/rejects together with that call's outcome. `loadOptions` is wrapped internally; no change to the function you pass in.

  **Breaking:** the option is renamed from `debounceMs` to `searchDebounceMs`, to distinguish it from a filter's `commit: { debounce }` delay now that it actually does something.

## 0.6.0

### Added

- **Configurable array separator.** The delimiter joining/splitting an
  array-shaped param's items in the URL (`multiSelect`, `asyncMultiSelect`,
  `tags`, and the range kinds) defaults to `','` as before, but is now
  overridable: `createFilters({ arraySeparator: '|' })` sets a project-wide
  default, `useFilters(configs, { arraySeparator: '|' })` overrides it per
  call, and `resolveFilterParams`'s matching option keeps route-loader parity.
  An async multi-select's label sidecar uses the same separator as its value.
  Exports the `DEFAULT_ARRAY_SEPARATOR` constant (`','`).

## 0.5.0

### Fixed

- **`onClear`/`onChange` no longer mark a `debounce`/`manual` filter dirty when
  the change is a no-op** — clearing an already-empty (or already-at-default)
  filter, undoing a pending change back to its committed value, or toggling a
  multi-select option on then off all now leave `isDirty` `false`, matching
  what's actually committed. Previously any non-`instant` change queued a
  pending entry unconditionally, so e.g. clicking "Clear" on an untouched
  filter incorrectly enabled the Apply button.

### Changed (breaking)

- **`useFilters`'s per-page override moved under `pagination`.** The flat
  `defaultPerPage` option is gone; pass it inside the `pagination` object so the
  hook's options mirror the `createFilters` config and override it per call:

  ```ts
  // before
  useFilters(configs, { defaultPerPage: 25 });
  // after
  useFilters(configs, { pagination: { defaultPerPage: 25 } });
  ```

  `pagination: false` / `true` are unchanged. Only `defaultPerPage` is
  overridable per call — the page/per-page **keys** and `firstPage` stay
  factory-only (`createFilters`) so the hook's `params` still matches
  `resolveFilterParams`. `resolveFilterParams`'s options take the same shape
  (its `defaultPerPage` also moves under `pagination`). Exports the
  `PaginationOverride` type.

### Added

- **Default `commit` mode.** Set a fallback `commit` at the factory
  (`createFilters({ defaultCommit })`) or per call (`useFilters(configs, {
defaultCommit })`) instead of repeating it on every filter. Precedence:
  per-filter `commit` → `useFilters` `defaultCommit` → `createFilters`
  `defaultCommit` → `'instant'`. Each resolved filter now exposes its effective
  mode as `filterMap[key].commit`.
- **Per-filter state, exposed directly on every resolved filter** — no more
  cross-referencing `params` by key or re-deriving `commit` mode yourself:
  `isInstant` / `isDebounced` / `isManual`, `debounceMs`, `isDirty` (this
  filter specifically has an uncommitted change), `committedValue` (its actual
  value in `params`/the URL, independent of any pending draft), `isFiltered`
  (this filter's own active/inactive state, based on its committed value), and
  `isFilteredDraft` (the same check against the _draft_ value — use it for a
  "Clear" button that should react instantly, since `isFiltered` still shows
  the old committed state until a `commit: 'manual'` change is applied).
  `commit` is now typed as always-present on a resolved filter (it was
  previously typed optional, inherited from the config).
- **Per-filter `apply()` / `cancel()` / `reset()` / `instantReset()`** — the
  same trio as the hook's whole-set versions, scoped to one filter, plus a
  fourth: `apply()`/`cancel()` commit or discard just that filter's pending
  change (a no-op if it isn't `isDirty`); `reset()` sets it back to
  `defaultValue` (or empty), respecting its `commit` mode like any other
  change — on a manual filter it lands in the draft and waits for `apply()`;
  `instantReset()` does the same but **bypasses `commit`** and writes straight
  to `params`/the URL now, mirroring how `setFilter` relates to `onChange` at
  the hook level. (The hook's whole-set `reset()` also bypasses `commit`
  entirely — it's the multi-filter equivalent of `instantReset()`, not
  `reset()`.) `onClear` is now a **deprecated alias** for `reset` (identical
  function) — existing code keeps working unchanged.
- The [playground](https://use-filters.vercel.app) demo now uses Tailwind CSS
  v4 and [shadcn/ui](https://ui.shadcn.com) components, and demonstrates the
  new per-filter `apply`/`cancel`/`reset` UI. Dev-only — not part of the
  published package.

## 0.4.0

### Added

- **Deferred commits — per-filter `commit` mode.** Each filter takes a `commit`
  option controlling _when_ its change reaches `params`/the URL: `'instant'`
  (default, unchanged behavior), `{ debounce: ms }` (commit `ms` after the last
  change), or `'manual'` (commit only on `apply()`). `useFilters` keeps a local
  draft so the control stays responsive while the committed value waits — no
  extra state to wire up for a debounced search box or a mobile "Apply filters"
  sheet. Adds `apply()`, `cancel()`, and `isDirty` to the hook's return, and
  exports the `FilterCommitMode` type. `setFilter` bypasses the draft and commits
  immediately.
- **Interactive playground / live demo** covering every filter kind and all three
  commit modes. Dev-only (`npm run playground`, deployed to Vercel) — not part of
  the published package.

## 0.3.0

### Changed (breaking)

- **`createFilters` config is now grouped by concern.** Pagination options move
  under a `pagination` object and date options under a `date` object. Flat
  top-level keys are no longer accepted:

  ```ts
  // before
  createFilters({ pageKey: 'page', pageSizeKey: 'per_page', serializeDate, parseDate });
  // after
  createFilters({
    pagination: { pageKey: 'page', perPageKey: 'per_page' },
    date: { serialize, parse }
  });
  ```

  The date hooks are also renamed (`serializeDate`/`parseDate` →
  `date.serialize`/`date.parse`; the `*DateTime` pair keeps its name under
  `date`).

- **Pagination params now mirror the URL keys.** Previously `params` always used
  `{ limit, offset }` regardless of `pageKey` / `pageSizeKey`. Now `pageKey` /
  `perPageKey` name both the URL query params **and** the pagination keys in
  `params` — the default `page` / `per_page` keys yield
  `params = { …filters, page, per_page }`, and renaming them updates `params` to
  match (typed from the literal key names).

- **`page_size` → `per_page`, and the pagination config identifiers were renamed.**
  The default per-page URL/param key is now `per_page` (was `page_size`). The
  config options are renamed to match: `pageSizeKey` → `perPageKey` and
  `defaultPageSize` → `defaultPerPage` (on both `createFilters` and the
  `useFilters` options).

- **Removed `mapPagination` / `toParams`.** With keys mirroring into `params`,
  the value-transform hook is gone. APIs whose pagination shape differs from the
  URL keys (e.g. offset-based) derive it at the fetch call from `params`:
  `{ limit: params.per_page, offset: (params.page - 1) * params.per_page }`.

- **`defaultPage` → `firstPage`.** Renamed and repurposed: it's the number the
  first page is counted from (the value when the URL has none, what reset writes,
  and the base the API pages from). Defaults to `1`; set `firstPage: 0` for a
  0-indexed API.

### Added

- **`f.time` / `f.timeRange`** — time-of-day filters with no date. Values are
  24-hour clock strings (`HH:mm`, or `HH:mm:ss` with `precision: 'second'`) —
  what an `<input type="time">` reads/writes, so no converters and no timezone.
  `timeRange` may wrap midnight (`from > to`). Exports `TimeFilterConfig`,
  `TimeRangeFilterConfig`, `TimeFilterMeta`, `TimeRangeFilterMeta`.
- **`pagination.firstPage`** — control 0-based vs 1-based page numbering.
- Exported `PaginationConfig` and `DateConfig` types.

## 0.2.0

First public release on npm. Bug fixes, a smaller dependency footprint, three
new filter capabilities, and substantially expanded docs.

### Added

- **`f.numberRange`** — numeric from–to filter (`[number, number] | null`), e.g.
  price/age "between". Supports `precision: 'float' | 'int'` and `unit`.
- **`f.tags`** — freeform multi-value string filter (`string[] | null`) with no
  predefined options and no server lookup.
- **Datetime support** — `f.date` / `f.dateRange` accept `precision: 'datetime'`
  to capture a time component. Adds `dateTimeFormat`, `serializeDateTime`,
  `parseDateTime` config, and `toDateTimeValue` / `fromDateTimeValue` converters
  (plus the `DATE_TIME_FORMAT` export).
- **Overridable date (de)serialization** — dates use a fixed `yyyy-MM-dd`
  default (datetime `yyyy-MM-ddTHH:mm:ss`); override `serializeDate` /
  `parseDate` (and their `*DateTime` counterparts) on `createFilters` to store
  dates in any shape or date library.
- Test suite (Vitest) covering parsers, `resolveFilterParams` parity, async
  label sidecars, and the new kinds.

### Fixed

- **Number filters no longer truncate decimals.** `f.number` parses floats by
  default; opt into integers with `precision: 'int'`.
- **Dates round-trip correctly with a custom `dateFormat`.** `fromDateValue` now
  parses with the configured format instead of the native `Date` constructor
  (which misread e.g. `dd.MM.yyyy`), and `createFilters` binds it to that format.
- **`resolveFilterParams` produces the same values as the hook.** Raw search
  params are coerced through the same parsers (and page/size to integers), so a
  route loader's query key matches the hook's and the prefetch is reused.
- Numeric select/multiSelect detection scans all options and falls back to
  `defaultValue` instead of sniffing only the first option.
- `buildParser` now has an ergonomic single return type (no `never`-typed
  `parse`/`serialize` at call sites).

### Changed

- **Zero runtime dependencies.** Removed `lodash` (replaced the single `isEqual`
  use with a small internal deep-equal) and `date-fns` (replaced `format` /
  `parse` with fixed `yyyy-MM-dd` (de)serializers, overridable via
  `serializeDate` / `parseDate`). The package now needs only the `react` and
  `nuqs` peers.
- Inline config objects passed to `useFilters` are fingerprinted structurally,
  so URL state is no longer re-initialized on every render.
- Publishing moved to the **public npm registry**; licensed **MIT**.
- Docs rewritten as a full guide (setup, quickstart, filter-kinds reference,
  rendering, async/label sidecar, dynamic filters, API reference, gotchas), with
  expanded JSDoc across the public API.

## 0.1.0

- Initial (internal) release: `createFilters`, `useFilters`, the `f.*` builders,
  `resolveFilterParams`, `meta` augmentation, and nuqs-backed URL sync.
