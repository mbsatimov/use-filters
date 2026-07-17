---
'@mbsatimov/use-filters': minor
---

### Added

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
