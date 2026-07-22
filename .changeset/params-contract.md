---
'@mbsatimov/use-filters': major
---

### Changed

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
