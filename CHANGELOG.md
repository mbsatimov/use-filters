# Changelog

All notable changes to this project are documented here. This project adheres to
[Semantic Versioning](https://semver.org/); while pre-1.0, minor versions may
include breaking changes.

## Unreleased

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
