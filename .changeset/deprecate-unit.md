---
'@mbsatimov/use-filters': minor
---

### Deprecated (removal in 1.0)

- **`unit` on `f.number` / `f.numberRange`** — like `FilterOption.icon` /
  `leftSlot` / `rightSlot` and the per-filter `className`, this is a rendering
  hint that doesn't belong on a headless core. Declare a `unit` field on
  `NumberFilterMeta` / `NumberRangeFilterMeta` in your app and pass it via
  `meta` instead (same data, typed by you). Behavior is unchanged until 1.0.
