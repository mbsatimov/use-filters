# @mbsatimov/use-filters

[![npm version](https://img.shields.io/npm/v/%40mbsatimov%2Fuse-filters?color=cb3837)](https://www.npmjs.com/package/@mbsatimov/use-filters)
[![CI](https://github.com/mbsatimov/use-filters/actions/workflows/ci.yml/badge.svg)](https://github.com/mbsatimov/use-filters/actions/workflows/ci.yml)
[![bundle size](https://img.shields.io/bundlephobia/minzip/%40mbsatimov%2Fuse-filters?label=min%2Bgzip)](https://bundlephobia.com/package/@mbsatimov/use-filters)
[![license](https://img.shields.io/npm/l/%40mbsatimov%2Fuse-filters)](./LICENSE)

Headless, URL-synced filter state for React. You declare your filters once as a
plain object; the hook keeps their state in the URL query string and hands back
a typed `params` object for fetching data plus ready-to-render filter state. It
ships **no UI** — you render your own controls against your own design system.

**📖 [Full documentation](https://use-filters.vercel.app/docs)** — concepts, every
filter type, guides, and the API reference, with live interactive examples.

```ts
const { params, filters, isFiltered, reset } = useFilters({
  search: f.text({ label: 'Search' }),
  status: f.select({ label: 'Status', valueType: 'string', options: statusOptions })
});
//  ?search=acme&status=open   <->   params = { search: 'acme', status: 'open', page: 1, per_page: 10 }
```

## Install

```bash
npm install @mbsatimov/use-filters nuqs
```

`react` (>=18) and `nuqs` (>=2) are peer dependencies — install them in your app
if they aren't already there. State is stored in the URL via [nuqs](https://nuqs.dev),
which needs its adapter mounted once at your app root — see
[Installation](https://use-filters.vercel.app/docs/installation) for the adapter
that matches your router.

## Why the URL?

The URL becomes the single source of truth for "what is the user looking at".
Refreshes, back/forward, bookmarks, and shared links all just work, and your
data-fetching cache keys stay in sync for free. See
[How it works](https://use-filters.vercel.app/docs/concepts/how-it-works) for
the full mental model.

## What's in here vs. what isn't

This package is the **headless core only**: `createFilters`, `useFilters`, the
`f.*` builders, `resolveFilterParams`, `defineFilters`, and the types. It has
**zero runtime dependencies** — just the `react` and `nuqs` peers.

The rendered toolbar, popovers, chips, option lists, etc. are intentionally
**not** included — those live in your project, built against your design system,
using this hook underneath.

## Development

This package lives in a [pnpm](https://pnpm.io) workspace under
[`packages/use-filters`](https://github.com/mbsatimov/use-filters/tree/main/packages/use-filters).
From the repo root:

```bash
pnpm install
pnpm typecheck     # tsc (src + tests — includes the type-level tests)
pnpm test          # vitest
pnpm build         # tsup -> dist/ (ESM + CJS + .d.ts)
pnpm check:exports # attw — published types resolve under every module system
pnpm size          # size-limit budget for dist
pnpm docs          # Next.js dev server for the docs site, with live demos
```

The docs site ([`packages/docs`](https://github.com/mbsatimov/use-filters/tree/main/packages/docs))
is dev-only and never reaches the published package — `package.json#files`
ships only `dist`. See
[CONTRIBUTING.md](https://github.com/mbsatimov/use-filters/blob/main/CONTRIBUTING.md)
for the full contributor guide.

## Publishing

Releases are automated with
[Changesets](https://github.com/changesets/changesets): land a change with
`pnpm changeset`, and merging the generated **"Version Packages"** PR publishes
to npm with provenance and tags the release. `prepublishOnly` typechecks,
tests, builds, and verifies the published types (`attw`) and the size budget
first. Requires an `NPM_TOKEN` repository secret with publish rights to the
`@mbsatimov` scope.
