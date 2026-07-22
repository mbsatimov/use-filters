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

```bash
nvm use               # Node version from .nvmrc (tests need >= 20.19 for require(esm))
npm install
npm run typecheck     # tsc (src + tests — includes the type-level tests)
npm run test          # vitest
npm run build         # tsup -> dist/ (ESM + CJS + .d.ts)
npm run check:exports # attw — published types resolve under every module system
npm run size          # size-limit budget for dist
npm run docs          # next dev server for the docs site (apps/docs/), with live interactive demos throughout
```

See [CONTRIBUTING.md](./CONTRIBUTING.md) for the full contributor guide.

This is an npm workspaces monorepo: the library lives at the repo root and
publishes as usual, while [`apps/docs/`](apps/docs/) is a dev-only Next.js app —
the docs site, with live interactive demos embedded throughout — that exercises
the live `src`. It never reaches the published package (`package.json#files`
ships only `dist`, and the library build bundles only `src/index.ts`). It
deploys to Vercel via [`vercel.json`](vercel.json).

## Publishing

Releases are automated with [Changesets](https://github.com/changesets/changesets)
via [`.github/workflows/release.yml`](.github/workflows/release.yml):

1. Land your change with a changeset: run `npx changeset`, pick the bump level,
   describe the change, and commit the generated `.changeset/*.md` with your PR.
2. On push to `main`, the workflow opens (or updates) a **"Version Packages"**
   PR that bumps `package.json` and rewrites `CHANGELOG.md` from the pending
   changesets.
3. Merging that PR publishes to npm with provenance and tags the release.
   `prepublishOnly` typechecks, tests, builds, and verifies the published types
   (`attw`) and the size budget first.

Requires an `NPM_TOKEN` repository secret (an npm automation token with publish
rights to the `@mbsatimov` scope).
