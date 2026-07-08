# @mbsatimov/use-filters

Headless, URL-synced filter state for React. Declare filters as a plain config
map and get back typed `params`, resolved filter state, and nuqs-backed URL
sync — no UI included. Bring your own components (or copy the reference ones
from the app this was extracted from).

## Install

```bash
npm install @mbsatimov/use-filters nuqs
```

`react` and `nuqs` are peer dependencies — install them in the consuming app
if they aren't already there. `nuqs` needs its adapter set up once per app
(see the [nuqs docs](https://nuqs.dev)).

## Usage

```ts
import { f, useFilters } from '@mbsatimov/use-filters';

const { params, filters, isFiltered, reset } = useFilters<ListParams>({
  search: f.text({ label: 'Search' }),
  status: f.select({ label: 'Status', options: statusOptions }),
  customer_id: f.asyncSelect({
    label: 'Customer',
    loadOptions: (search) =>
      customerApi.getAll({ params: { search, limit: 20 } })
        .then((list) => list.map((c) => ({ value: c.id, label: c.full_name })))
  })
});

const { data } = useQuery(listQueryOptions(params));

// `filters` is what you hand to your own <FilterToolbar /> — this package
// has no opinion on how that renders.
```

The top-level `useFilters` / `resolveFilterParams` above use built-in defaults:
`page` / `page_size` URL keys, `{ limit, offset }` params (`offset = (page - 1) *
page_size`), and `yyyy-MM-dd` dates.

## Per-project configuration (`createFilters`)

Pagination param names, defaults, date format, and the API pagination shape
vary between projects. Bind them once with `createFilters` and export the
result — every consumer shares the same constants:

```ts
// src/lib/filters.ts
import { createFilters } from '@mbsatimov/use-filters';

export const { useFilters, resolveFilterParams, f, toDateValue } = createFilters({
  pageKey: 'page',
  pageSizeKey: 'per_page',
  defaultPageSize: 25,
  dateFormat: 'dd.MM.yyyy'
});
```

`mapPagination` controls how the URL's human `page` / `pageSize` become the
params your API expects — and `params` is typed from its return shape:

```ts
export const { useFilters } = createFilters({
  // params.page / params.page_size instead of limit / offset
  mapPagination: (page, pageSize) => ({ page, page_size: pageSize })
});
```

A factory rather than a React provider on purpose: the same constants have to
reach `resolveFilterParams`, which runs in route loaders **outside** React and
can't read context. Closing over them keeps the hook and the loader helper in
lockstep (so their query keys match), with no runtime context lookup and full
type-safety.

### Route loader

```ts
loader: ({ context: { queryClient }, location: { search } }) =>
  queryClient.ensureQueryData(
    loansQueryOptions(resolveFilterParams(loanFilterConfigs, search))
  )
```

## Project-specific UI hints (`meta`)

Every filter kind has its own augmentable `meta` type (`SelectFilterMeta`,
`NumberFilterMeta`, etc., all extending the shared `FilterMeta`), plus a
hook-level `FiltersMeta` for the whole filter set. They're empty by default —
augment them once per consuming project to attach whatever your custom filter
UI needs, fully type-checked, with zero changes to this package:

```ts
// e.g. src/app/types/filters.ts in the consuming app
declare module '@mbsatimov/use-filters' {
  interface FilterMeta {
    variant?: 'flex' | 'list'; // available on every filter kind
  }
  interface SelectFilterMeta {
    group?: 'primary' | 'advanced'; // only on select filters
  }
  interface FiltersMeta {
    layout?: 'toolbar' | 'sidebar'; // whole filter set
  }
}
```

```ts
status: f.select({ label: 'Status', options, meta: { group: 'primary' } })
useFilters(configs, { meta: { layout: 'sidebar' } })
```

This package never reads `meta` itself — it only carries it through to
`filters` / `filterMap` / the hook's return value so your project's own UI
layer can branch on it.

## What's in here vs. what isn't

This package is the **headless core only**: `createFilters`, `useFilters`, the
`f.*` filter builders, `resolveFilterParams` (for route loaders), and all the
types. It has no UI framework dependency beyond `react` itself.

The actual rendered toolbar, popovers, chips, option lists, etc. are
intentionally **not** part of this package — those live in each consuming
project, built against its own design system, using this hook underneath.

## Development

```bash
npm install
npm run typecheck
npm run build     # tsup -> dist/ (ESM + CJS + .d.ts)
```

## Publishing

This repo publishes to GitHub Packages via `.github/workflows/publish.yml` on
every GitHub Release. To cut a release:

1. Bump `version` in `package.json`.
2. Commit, push, then create a GitHub Release with a matching tag (e.g. `v0.2.0`).
3. The workflow builds and runs `npm publish` automatically.

To publish locally instead, see `.npmrc.publish.example`.
