---
'@mbsatimov/use-filters': minor
---

`asyncSelect`/`asyncMultiSelect` now actually debounce `loadOptions`. Previously the option was documented but never read, so a search box calling `onChange` on every keystroke fired `loadOptions` once per keystroke. Calls within the debounce window (default `300`) of each other now collapse into a single underlying call, using the last call's arguments — every caller in that window resolves/rejects together with that call's outcome. `loadOptions` is wrapped internally; no change to the function you pass in.

**Breaking:** the option is renamed from `debounceMs` to `searchDebounceMs`, to distinguish it from a filter's `commit: { debounce }` delay now that it actually does something.
