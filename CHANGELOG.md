# Changelog

All notable changes to this project are documented here. This project adheres to
[Semantic Versioning](https://semver.org/); while pre-1.0, minor versions may
include breaking changes.

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
