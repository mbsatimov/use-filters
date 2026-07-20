---
'@mbsatimov/use-filters': major
---

### Removed

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
