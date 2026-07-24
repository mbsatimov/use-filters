---
'@mbsatimov/use-filters': minor
---

Add `request.arrayFormat` to `createFilters` — control how array-shaped params (`multiSelect`, `tags`, `numberRange`, date/time ranges, `asyncMultiSelect`) appear in `params`.

Most backends expect array values as a comma-separated string, but `params` always exposed a JS array — forcing a manual join before every request. Set `request.arrayFormat: 'string'` and `params` hands you the joined string directly (using `arraySeparator`), fully typed as `string`. The request shape is now a per-API constant alongside `pagination` and `date`. The default stays `'array'`, so this is non-breaking.

Only `params` is affected — `filters` / `filterMap` still expose arrays for your UI, and `paramsStr` is unchanged. Applies to both `useFilters` and `resolveFilterParams`.

```ts
const { useFilters } = createFilters({ request: { arrayFormat: 'string' } });
// tags: ['a', 'b']  →  params.tags === 'a,b'  (typed as string)
```
