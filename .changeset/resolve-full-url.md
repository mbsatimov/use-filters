---
'@mbsatimov/use-filters': patch
---

`resolveFilterParams` now accepts a full URL or path such as `request.url`. Previously a string was always read as a bare query string, so `https://site/products?status=open&page=2` folded `status` into a key named `https://site/products?status` and that filter was silently dropped.
