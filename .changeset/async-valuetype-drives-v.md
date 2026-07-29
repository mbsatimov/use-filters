---
'@mbsatimov/use-filters': patch
---

`f.asyncSelect` / `f.asyncMultiSelect`: `valueType` now drives the value type. Previously the value type was inferred only from `loadOptions`, so a callback that could resolve to `undefined` (e.g. `list?.results.map(...)` without a `?? []` fallback) silently widened `params.<key>` to `string | number | null` even with `valueType: 'number'`. Now `valueType: 'number'` pins the param to `number | null`, and a `loadOptions` that resolves to anything other than `FilterOption<V>[]` is a compile error at its own line. Internally the four choice builders now share `ChoiceInput` / `ChoiceResult` helper types instead of repeating their `Omit`/conditional shapes.
