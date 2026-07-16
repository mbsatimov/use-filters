---
'@mbsatimov/use-filters': minor
---

Packaging, correctness, and headless-purity hardening.

### Fixed

- **CJS consumers no longer get mismatched (ESM-flavored) type declarations.**
  The `exports` map now ships per-condition types (`import` →
  `dist/index.d.ts`, `require` → `dist/index.d.cts`), fixing the
  "Masquerading as ESM" resolution error under `moduleResolution: node16`
  from CJS. Verified with `@arethetypeswrong/cli`, which now runs in CI and
  before every publish (`npm run check:exports`).
- **Dynamic `select` / `multiSelect` filters now re-parse correctly when
  options arrive after mount.** Previously a backend-driven filter whose
  options started `[]` and later loaded numeric values kept its string parse
  forever — `?ids=1,2` stayed `['1','2']` and never matched what
  `resolveFilterParams` computes in a route loader. Two-part fix: the
  structural parser fingerprint now includes the options' value family
  (numeric vs. string) so the parser map re-keys, and already-committed values
  are normalized through the current parser (nuqs caches parsed state per
  query string, so re-keying alone never re-parses an unchanged param).
  Content changes to a filter's per-filter `nuqs` options are now
  fingerprinted too (previously only their presence/absence was).
- Removed a false JSDoc claim that async `loadOptions` results "are cached per
  search string" — they are debounced and abortable, not cached.

### Added

- **`valueType` on `select` / `multiSelect`.** Choice filters now take an
  optional `valueType: 'number' | 'string'` — a static declaration of how the
  value round-trips through the URL, type-checked against the option values.
  With static options the type is still inferred, so nothing changes for the
  common case. It matters when **options are fetched at runtime**: the same
  config is then also used somewhere the options aren't loaded (a route loader
  calling `resolveFilterParams`), where the previous approach — sniffing the
  option values — had nothing to read and the hook and loader could parse the
  same URL to different types (`5` vs `'5'`), splitting the query key.
  `valueType` is the shared source of truth that keeps them identical.
  `resolveFilterParams` now warns (dev only) when it meets an options-less
  choice filter without a `valueType`, catching the divergence at its source.
  Exports the `ChoiceValueType` type.
- **`resolveFilterParams` accepts `URLSearchParams` and raw query strings** in
  addition to plain objects — pass `new URL(request.url).searchParams`
  (React Router) or `location.search` directly. Exports the `RawSearchParams`
  type.
- **`FilterOption.meta` + augmentable `FilterOptionMeta`** — the per-option
  counterpart to `FilterMeta`, for project-specific option UI hints (icons,
  swatches, shortcut labels) without baking rendering concerns into the core.
- **Dev-mode `valueType` mismatch warning.** An async filter whose
  `loadOptions` resolves options contradicting its `valueType` (e.g. string
  UUID ids under the numeric default) now warns once per filter in
  development — previously such values silently parsed back from the URL as
  `null`.
- Type-level tests (`expectTypeOf`) locking in `params` inference, explicit
  `<P>` validation, renamed-pagination-key typing, and resolved-filter
  narrowing.

### Deprecated (removal in 1.0)

- `FilterOption.icon` / `leftSlot` / `rightSlot` and the per-filter
  `className` — rendering hints don't belong on a headless core. Declare the
  fields you need on `FilterOptionMeta` / `FilterMeta` and pass them via
  `meta`; behavior is unchanged until 1.0.

### Changed

- `engines.node` is now `>=20` (Node 18 is end-of-life). The library code is
  unchanged — this only affects tooling expectations.
