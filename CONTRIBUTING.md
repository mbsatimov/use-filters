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
  a CI-enforced size budget (`pnpm size`).
- **Type-safe:** inference is a feature. Changes to the type machinery must
  keep the type-level tests (`test/types.test.tsx`) passing.

## Setup

This is a [pnpm](https://pnpm.io) workspace — the library lives in
`packages/use-filters`, the docs site in `packages/docs`. Run all commands from
the repo root.

```bash
nvm use        # Node version from .nvmrc — tests need >= 20.19 (require(esm))
pnpm install   # also installs the lefthook git hooks
```

## Scripts

| Command                | What it does                                                                       |
| ---------------------- | ---------------------------------------------------------------------------------- |
| `pnpm typecheck`       | `tsc` over `src` + `test` (includes the type-level tests)                          |
| `pnpm test`            | Vitest suite                                                                       |
| `pnpm build`           | `tsup` → `dist/` (ESM + CJS + `.d.ts`)                                             |
| `pnpm check:exports`   | `attw` — validates published types under every module system                       |
| `pnpm size`            | `size-limit` budget check on `dist`                                                |
| `pnpm lint` / `format` | ESLint / Prettier (also run automatically by the git hooks)                        |
| `pnpm docs`            | Next.js dev server for the docs site (`packages/docs`), with live demos throughout |

## Making a change

1. Branch off `main`.
2. Make the change; add or update tests next to the behavior they cover.
   Bug fixes should come with a regression test that fails before the fix.
3. If the public behavior changed, update `README.md` and the relevant JSDoc —
   the JSDoc _is_ documentation (it shows in editors).
4. Add a changeset: `pnpm changeset` (pick `patch`/`minor`, describe the change
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
`params` / the URL to be.
