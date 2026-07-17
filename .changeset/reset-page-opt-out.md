---
'@mbsatimov/use-filters': minor
---

### Added

- **`resetPageOnFilterChange` pagination option.** By default, changing any
  filter resets the page to `firstPage` (a changed filter invalidates the old
  result window). Set it to `false` — in `createFilters`'s `pagination`, or per
  call via the `pagination` object on `useFilters`' options — when pagination
  is driven entirely outside the hook and it should never write the page
  param. Applies to the whole-set `reset()` too.
