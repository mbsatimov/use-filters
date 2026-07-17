---
'@mbsatimov/use-filters': minor
---

### Added

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
