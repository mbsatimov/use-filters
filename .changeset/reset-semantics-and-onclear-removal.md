---
'@mbsatimov/use-filters': major
---

### Removed

- **`onClear` on resolved filters** — it was a deprecated alias for `reset` (the
  same function reference). Call `reset()` instead.

### Changed

- **The hook's whole-set `reset()` now respects each filter's `commit` mode**,
  matching how each filter's own `reset()` already behaved. Previously the
  whole-set `reset()` bypassed commit modes and wrote to the URL immediately;
  now `'instant'` filters commit right away while `'manual'` / `{ debounce }`
  filters stage the cleared value as a draft and wait for `apply()`, exactly
  like any other change. This removes the surprise of `reset()` and a filter's
  own `reset()` doing two different things.

  For the previous "clear everything immediately, whatever the commit mode"
  behavior, use the new `instantReset()` (below) — e.g. a toolbar "Clear all"
  button:

  ```ts
  // before — reset() always cleared immediately
  <button onClick={reset}>Clear all</button>

  // after — instantReset() is the immediate, mode-bypassing clear
  const { instantReset } = useFilters(configs);
  <button onClick={instantReset}>Clear all</button>
  ```

### Added

- **`instantReset()` on the hook** — clears every filter to its default in one
  batched URL write, bypassing commit modes and cancelling any pending drafts /
  debounce timers. The whole-set twin of each resolved filter's own
  `instantReset()`, and the mode-bypassing counterpart to the hook's `reset()`
  (the same relationship `setFilter` has to a filter's `onChange`).
