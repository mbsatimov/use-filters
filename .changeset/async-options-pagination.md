---
'@mbsatimov/use-filters': major
---

**Breaking:** async filters (`f.asyncSelect` / `f.asyncMultiSelect`) now load options a page at a time, so pickers can "load more".

- `loadOptions` takes a single context object and returns a page: `({ search, signal, cursor }) => Promise<{ options, nextCursor? }>`. `cursor` is `null` for the first page, then whatever the previous page returned as `nextCursor` (a page number, an offset, or an API token). Return `nextCursor: null` (or omit it) on the last page.
- `useFilters` no longer debounces `loadOptions`. The old debounce merged calls with different arguments, which would swallow a "load more" request fired during a search. Debounce the search input in your UI instead; `searchDebounceMs` stays as the per-filter hint for how long. The resolved `filter.loadOptions` keeps a stable identity across renders.
- New exported types: `LoadOptions`, `LoadOptionsContext`, `OptionsPage`, `OptionsCursor`.

Migration:

```diff
- loadOptions: (search, signal) => api.search(search, { signal })
+ loadOptions: async ({ search, signal }) => ({ options: await api.search(search, { signal }) })
```

The registry kits (filter bar, facet panel, filter controls) ship an updated `useAsyncOptions` hook and `OptionList` with infinite scroll; re-add them with the shadcn CLI to pick it up.
