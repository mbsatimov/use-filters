# Contributing

Thanks for helping improve `use-filters`! Issues and PRs are welcome — this
guide covers everything you need to get productive.

## Project philosophy

Before proposing a feature, it helps to know what this package is trying to be:

- **One problem:** URL-synced filter state for list/table views (pagination
  included). Adjacent concerns (sorting UIs, rendered components, data
  fetching) are deliberately out of scope.
- **Headless:** configs are **data** — JSON-serializable except `loadOptions`.
  Rendering hints belong in the augmentable `meta` interfaces, never as
  first-class config fields.
- **Lightweight:** zero runtime dependencies (only `react` + `nuqs` peers), and
  a CI-enforced size budget (`npm run size`).
- **Type-safe:** inference is a feature. Changes to the type machinery must
  keep the type-level tests (`test/types.test.tsx`) passing.

## Setup

```bash
nvm use        # Node version from .nvmrc — tests need >= 20.19 (require(esm))
npm install    # also installs the lefthook git hooks
```

## Scripts

| Command                   | What it does                                                 |
| ------------------------- | ------------------------------------------------------------ |
| `npm run typecheck`       | `tsc` over `src` + `test` (includes the type-level tests)    |
| `npm run test`            | Vitest suite                                                 |
| `npm run build`           | `tsup` → `dist/` (ESM + CJS + `.d.ts`)                       |
| `npm run check:exports`   | `attw` — validates published types under every module system |
| `npm run size`            | `size-limit` budget check on `dist`                          |
| `npm run lint` / `format` | ESLint / Prettier (also run automatically by the git hooks)  |
| `npm run playground`      | Vite dev server for the live demo (`playground/`)            |

## Making a change

1. Branch off `main`.
2. Make the change; add or update tests next to the behavior they cover.
   Bug fixes should come with a regression test that fails before the fix.
3. If the public behavior changed, update `README.md` and the relevant JSDoc —
   the JSDoc _is_ documentation (it shows in editors).
4. Add a changeset: `npx changeset` (pick `patch`/`minor`, describe the change
   from a consumer's point of view — it becomes the CHANGELOG entry).
5. Open the PR. CI runs lint, format, typecheck, tests (React 18 + 19), build,
   `attw`, and the size budget.

Pre-commit hooks (lefthook) auto-fix lint/format on staged files; pre-push runs
typecheck + tests.

## Releasing (maintainers)

Merging to `main` with pending changesets opens/updates a **"Version Packages"**
PR. Merging that PR publishes to npm (with provenance) and tags the release —
see the [Publishing](./README.md#publishing) section of the README.

## Reporting bugs

Use the bug-report issue template. The fastest path to a fix is a minimal
reproduction: your filter config, the URL you start from, and what you expected
`params` / the URL to be. Check whether it reproduces in the
[live playground](https://use-filters.vercel.app) first — that rules out
app-specific setup.
