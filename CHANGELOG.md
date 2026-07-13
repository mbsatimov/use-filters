# Changelog

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
