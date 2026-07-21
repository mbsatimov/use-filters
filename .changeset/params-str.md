---
'@mbsatimov/use-filters': minor
---

### Added

- **`paramsStr`** on the `useFilters` return — `params` serialized to a
  deterministic, sorted string, for use as a stable cache key or memo
  dependency when comparing a string is handier than an object:

  ```ts
  const { params, paramsStr } = useFilters(configs);
  // params { page: 1, per_page: 10, search: 'acme', status: 'open' }
  // paramsStr "page=1&per_page=10&search=acme&status=open"

  const { data } = useQuery({ queryKey: [paramsStr], queryFn: () => fetchList(params) });
  ```

  Keys are sorted (so config/key order never changes it), unset/empty filters
  are dropped (so equivalent states produce the same string), and values are
  URL-encoded (so special characters can't collide). Array values join with the
  call's `arraySeparator`.
