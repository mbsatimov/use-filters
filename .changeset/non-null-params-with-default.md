---
'@mbsatimov/use-filters': patch
---

### Fixed

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
