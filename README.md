# @mbsatimov/use-filters

[![npm version](https://img.shields.io/npm/v/%40mbsatimov%2Fuse-filters?color=cb3837)](https://www.npmjs.com/package/@mbsatimov/use-filters)
[![CI](https://github.com/mbsatimov/use-filters/actions/workflows/ci.yml/badge.svg)](https://github.com/mbsatimov/use-filters/actions/workflows/ci.yml)
[![bundle size](https://img.shields.io/bundlephobia/minzip/%40mbsatimov%2Fuse-filters?label=min%2Bgzip)](https://bundlephobia.com/package/@mbsatimov/use-filters)
[![license](https://img.shields.io/npm/l/%40mbsatimov%2Fuse-filters)](./LICENSE)

Headless, URL-synced filter state for React. You declare your filters once as a
plain object; the hook keeps their state in the URL query string and hands back
a typed `params` object for fetching data plus ready-to-render filter state. It
ships **no UI** — you render your own controls against your own design system.

**[▶ Live demo](https://use-filters.vercel.app)** — every filter kind and all
three [commit modes](#deferred-commits-debounce--apply) (instant / debounce /
manual Apply), with `params`, the URL, and `isDirty` shown live.

**Why the URL?** The URL becomes the single source of truth for "what is the
user looking at". Refreshes, back/forward, bookmarks, and shared links all just
work, and your data-fetching cache keys stay in sync for free.

```ts
const { params, filters, isFiltered, reset } = useFilters({
  search: f.text({ label: 'Search' }),
  status: f.select({ label: 'Status', options: statusOptions })
});
//  ?search=acme&status=open   <->   params = { search: 'acme', status: 'open', page: 1, per_page: 10 }
```

- [Install](#install)
- [One-time setup: the nuqs adapter](#one-time-setup-the-nuqs-adapter)
- [Quickstart](#quickstart)
- [Rendering your own filter UI](#rendering-your-own-filter-ui)
- [Filter kinds](#filter-kinds)
- [Typing `params` from your API](#typing-params-from-your-api)
- [Per-project setup: `createFilters`](#per-project-setup-createfilters)
- [Route loaders: `resolveFilterParams`](#route-loaders-resolvefilterparams)
- [Async (server-searched) filters](#async-server-searched-filters)
- [Deferred commits: debounce & Apply](#deferred-commits-debounce--apply)
- [Dates](#dates)
- [Project-specific UI hints: `meta`](#project-specific-ui-hints-meta)
- [API reference](#api-reference)
- [Gotchas](#gotchas)

## Install

```bash
npm install @mbsatimov/use-filters nuqs
```

`react` (>=18) and `nuqs` (>=2) are peer dependencies — install them in your app
if they aren't already there.

## One-time setup: the nuqs adapter

This package stores filter state in the URL via [nuqs](https://nuqs.dev), which
needs its adapter mounted **once** at your app root. Pick the adapter for your
router — the import is the only thing that differs:

```tsx
// Next.js App Router
import { NuqsAdapter } from 'nuqs/adapters/next/app';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <NuqsAdapter>{children}</NuqsAdapter>
      </body>
    </html>
  );
}
```

Adapters also exist for the Next Pages Router, React Router, Remix, TanStack
Router, and plain React — see the [nuqs adapter docs](https://nuqs.dev/docs/adapters).
Without an adapter mounted, `useFilters` will throw.

## Quickstart

```tsx
import { f, useFilters } from '@mbsatimov/use-filters';
import { useQuery } from '@tanstack/react-query';

const statusOptions = [
  { label: 'Open', value: 'open' },
  { label: 'Closed', value: 'closed' }
];

function LoansPage() {
  const { params, filters, isFiltered, reset } = useFilters({
    search: f.text({ label: 'Search' }),
    status: f.select({ label: 'Status', options: statusOptions })
  });

  // `params` = { search, status, page, per_page } — use it to fetch, and as the
  // query key so results refetch/cache correctly when a filter changes.
  const { data } = useQuery({
    queryKey: ['loans', params],
    queryFn: () => loanApi.getAll(params)
  });

  return (
    <>
      <FilterToolbar filters={filters} />
      {isFiltered && <button onClick={reset}>Clear filters</button>}
      <LoanTable rows={data} />
    </>
  );
}
```

That's the whole loop: **declare filters → fetch with `params` → render
`filters`.** The `useFilters` imported above uses built-in defaults (`page` /
`per_page` URL keys mirrored straight into `params`, `yyyy-MM-dd` dates). To
change those, bind your own with [`createFilters`](#per-project-setup-createfilters).

## Rendering your own filter UI

`filters` is an array of **resolved filters** — each is your original config
plus a live `value` and handlers. You decide how to render them. The essentials
every filter has:

| Field          | What it is                                                                                                        |
| -------------- | ----------------------------------------------------------------------------------------------------------------- |
| `key`          | The config key (also the URL param name).                                                                         |
| `label`        | Your human label (and `placeholder`, defaulting to `label`).                                                      |
| `value`        | Current value, or `null` when unset.                                                                              |
| `onChange`     | `(value) => void` — set this filter's value.                                                                      |
| `reset`        | `() => void` — set this filter back to its `defaultValue` (or empty). Respects `commit`, like any change.         |
| `instantReset` | `() => void` — same, but **bypasses `commit`** and writes it straight to `params`/the URL now, whatever the mode. |
| `apply`        | `() => void` — commit just this filter's pending change now. No-op if not `isDirty`.                              |
| `cancel`       | `() => void` — discard just this filter's pending change. No-op if not `isDirty`.                                 |

> `onClear` still works — it's a **deprecated alias** for `reset` (identical
> function). New code should use `reset`.

Choice filters also expose the resolved option object(s) so you can show the
selected label without a lookup: `selectedOption` (select / asyncSelect) and
`selectedOptions` (multiSelect / asyncMultiSelect).

Every filter also carries its own **state**, so a component never has to
cross-reference `params` or re-derive `commit` mode itself:

| Field             | What it is                                                                                                                                                                                                                                                             |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `commit`          | This filter's **effective** commit mode (after defaults) — `'instant'`, `{ debounce: ms }`, or `'manual'`.                                                                                                                                                             |
| `isInstant`       | `true` when `commit` is `'instant'`.                                                                                                                                                                                                                                   |
| `isDebounced`     | `true` when `commit` is `{ debounce }`.                                                                                                                                                                                                                                |
| `isManual`        | `true` when `commit` is `'manual'`.                                                                                                                                                                                                                                    |
| `debounceMs`      | The configured delay when `isDebounced`, else `null`.                                                                                                                                                                                                                  |
| `isDirty`         | `true` while this filter has an uncommitted change (debounce pending, or manual awaiting `apply()`). Always `false` for instant.                                                                                                                                       |
| `committedValue`  | What's actually in `params`/the URL right now — independent of any pending draft. Equals `value` unless `isDirty`.                                                                                                                                                     |
| `isFiltered`      | `true` when this filter's **committed** value differs from its default (or, with no default, is non-empty). Right for a "N filters applied" badge — reflects what's actually fetched.                                                                                  |
| `isFilteredDraft` | Same check, but against the **draft** `value`. Use this to show/hide a "Clear" button — it flips the instant the control empties, even before a `commit: 'manual'` change is applied (unlike `isFiltered`, which still shows the old committed state until `apply()`). |

```tsx
function Field({ filter }: { filter: ResolvedFilter }) {
  return (
    <div>
      {filter.isDebounced && <span>debounce {filter.debounceMs}ms</span>}
      {filter.isManual && <span>manual</span>}
      {filter.isDirty && (
        <span>
          pending — draft: {String(filter.value)}, committed: {String(filter.committedValue)}
        </span>
      )}
      {/* ...render the control */}
    </div>
  );
}
```

```tsx
function FilterToolbar({ filters }: { filters: ResolvedFilter[] }) {
  return (
    <div className='toolbar'>
      {filters.map((filter) => {
        switch (filter.type) {
          case 'text':
            return (
              <input
                key={filter.key}
                placeholder={filter.placeholder ?? filter.label}
                value={filter.value ?? ''}
                onChange={(e) => filter.onChange(e.target.value || null)}
              />
            );
          case 'select':
            return (
              <select
                key={filter.key}
                value={filter.value ?? ''}
                onChange={(e) => filter.onChange(e.target.value || null)}
              >
                <option value=''>{filter.label}</option>
                {filter.options.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            );
          // ...one case per kind you use
          default:
            return null;
        }
      })}
    </div>
  );
}
```

Need a single filter outside the toolbar (a preset button, a tab bar)? Reach for
it by key via `filterMap.<key>`, or set it imperatively with
`setFilter('status', 'open')`.

### Rendering filters elsewhere (search, sort, mobile)

Declaring a filter puts its value in the URL/`params` — it says nothing about
_where_ you render it. The `filters` array is just a convenience list for "the
default toolbar"; `filterMap.<key>` and `setFilter` are your escape hatch for
anything shown somewhere else (a persistent search box, a mobile header beside a
Filters button, a preset chip).

**Search** is a filter like any other — keep it in your `useFilters` config so it
flows into `params`, the query key, and the loader — but render it wherever it
belongs and mark it `hidden`:

```tsx
const { filterMap, filters } = useFilters({
  search: f.text({ label: 'Search', hidden: true }), // in params, not in `filters`
  status: f.select({ label: 'Status', options: statusOptions })
});

// Render it yourself, in the header / next to the Filters button:
const search = filterMap.search;
<input value={search.value ?? ''} onChange={(e) => search.onChange(e.target.value || null)} />

// `filters` contains only `status`, and `isFiltered` ignores the search box.
<FilterToolbar filters={filters} />
```

`hidden` keeps the value in `params` but leaves it out of the `filters` list
**and** out of `isFiltered` — usually what you want for a search box (a search
term shouldn't light up a "3 filters applied" badge). Want it to count? Don't set
`hidden`; just skip it when you map `filters`. To flag placement declaratively,
add a `meta` hint you own (`interface FilterMeta { slot?: 'toolbar' | 'header' }`)
and branch on `filter.meta.slot`.

**Sort** is a different concern (a compound `sort_by` + `sort_order`, rendered in
table headers), so it's intentionally **not** an `f.*` filter. Either drive it
with nuqs directly and spread it into your query key next to `params`, or ask for
a `useSort` companion bound to the same `createFilters` config — open an issue if
you'd like that built in.

### Pass-through components: `AnyUseFiltersReturn`

A shared component that receives a whole `useFilters` return as a prop — a
design-system filter toolbar, a mobile filter sheet, a debug panel — doesn't
know which config produced it, so its prop can't name the concrete return
type. Type it `AnyUseFiltersReturn` and skip the generics:

```tsx
import type { AnyUseFiltersReturn } from '@mbsatimov/use-filters';

interface FilterSheetProps {
  filters: AnyUseFiltersReturn; // the return of ANY useFilters call
}

function FilterSheet({ filters }: FilterSheetProps) {
  return (
    <>
      {filters.filters.map((f) => (
        <MyControl key={f.key} filter={f} />
      ))}
      <button disabled={!filters.isDirty} onClick={filters.apply}>
        Apply
      </button>
    </>
  );
}

// Any call site just passes its (fully typed) return:
const filters = useFilters({ status: f.select({ label: 'Status', options }) });
<FilterSheet filters={filters} />;
```

Reads stay typed — `filters.filters` is the usual `ResolvedFilter[]`, and
`filterMap` is the same map keyed by `string`. What loosens is only what a
key-agnostic component couldn't use anyway: `params` values are `unknown`, and
`setFilter` is uncallable (change values through each resolved filter's own
typed handlers instead). The call site's return stays fully typed — this type
only describes the prop.

## Filter kinds

Build every filter with an `f.*` helper. The builder decides how the value is
parsed and what type appears in `params`.

| Builder              | Use for                               | `params.<key>` type        | Notable options                                |
| -------------------- | ------------------------------------- | -------------------------- | ---------------------------------------------- |
| `f.text`             | Search boxes, free text               | `string \| null`           | —                                              |
| `f.number`           | Amounts, counts, rates                | `number \| null`           | `precision: 'float' \| 'int'`, `unit`          |
| `f.numberRange`      | Numeric from–to (price/age "between") | `[number, number] \| null` | `precision: 'float' \| 'int'`, `unit`          |
| `f.boolean`          | Toggles, on/off                       | `boolean \| null`          | `trueLabel`, `falseLabel`                      |
| `f.date`             | A single date (or date + time)        | `string \| null`           | `precision: 'date' \| 'datetime'`              |
| `f.dateRange`        | A from–to range (date or date + time) | `[string, string] \| null` | `precision: 'date' \| 'datetime'`              |
| `f.time`             | A time of day (no date)               | `string \| null`           | `precision: 'minute' \| 'second'`              |
| `f.timeRange`        | A from–to time-of-day range (no date) | `[string, string] \| null` | `precision: 'minute' \| 'second'`              |
| `f.select`           | One choice from a fixed list          | `V \| null`                | `options`, `valueType`                         |
| `f.multiSelect`      | Many choices from a fixed list        | `V[] \| null`              | `options`, `valueType`                         |
| `f.tags`             | Freeform string list (no options)     | `string[] \| null`         | —                                              |
| `f.asyncSelect`      | One choice, **server-searched** by id | `V \| null`                | `loadOptions`, `valueType`, `searchDebounceMs` |
| `f.asyncMultiSelect` | Many choices, **server-searched**     | `V[] \| null`              | `loadOptions`, `valueType`, `searchDebounceMs` |

`V` is inferred from your `options` (or `valueType` for async): number-valued
options give `number | null`, a status enum gives `Status | null`, and so on —
no annotations needed.

> **Fetching `select` / `multiSelect` options at runtime?** Add
> `valueType: 'number' | 'string'`. The value type is normally inferred from
> `options`, but if the same config is also used where the options aren't loaded
> — a route loader calling `resolveFilterParams` — that inference has nothing to
> read and the two sites can parse the URL to **different types** (`5` vs `'5'`),
> splitting your query key. `valueType` is the static source of truth that keeps
> them identical; it's type-checked against your option values, and dev builds
> warn if a loader hits an options-less choice filter without it. See
> [Choosing a value type](#choosing-a-value-type-for-fetched-options).

Every kind also accepts the shared options `label` (required), `placeholder`,
`defaultValue`, `hidden`, `meta`, and `nuqs` (see
[API reference](#per-filter-options-shared-by-every-kind)).

## Typing `params` from your API

Pass your list endpoint's params type as `useFilters<ListParams>` to get key
autocomplete, validation that each filter produces the right type, and a
`params` shaped like your API expects:

```ts
interface LoanListParams {
  search?: string;
  status?: 'open' | 'closed';
  customer_id?: number;
  page: number; // pagination keys are owned by the hook — exclude these
  per_page: number; // from what you validate against
}

const { params } = useFilters<LoanListParams>({
  search: f.text({ label: 'Search' }),
  status: f.select({ label: 'Status', options: statusOptions }),
  customer_id: f.asyncSelect({ label: 'Customer', loadOptions })
});
// A key not in LoanListParams, or a filter whose value doesn't fit it, is a
// compile error.
```

## Per-project setup: `createFilters`

Pagination param names, page defaults, and date format differ between projects.
Bind them **once** and export the result so every screen shares the same
constants. Config is grouped by concern: `pagination` (URL keys, page defaults,
and where numbering starts) and `date` (date (de)serialization).

```ts
// src/lib/filters.ts
import { createFilters } from '@mbsatimov/use-filters';

export const { useFilters, resolveFilterParams, f, toDateValue, fromDateValue } = createFilters({
  pagination: {
    pageKey: 'page',
    perPageKey: 'per_page',
    defaultPerPage: 25
  }
});
// params: { ...filters, page, per_page }
```

Then import `useFilters` / `f` from `src/lib/filters` instead of the package.

**Pagination keys mirror straight into `params`.** `pageKey` / `perPageKey`
name the URL query params **and** the pagination keys in `params`. They default
to `page` / `per_page`, so `params` is `{ page, per_page }` out of the box;
rename either and both the URL (e.g. `?page=2&page_size=25`) and `params`
(`{ page, page_size }`) follow, typed to match. There's no separate API mapping
to keep in sync.

**`firstPage` sets where numbering starts.** It defaults to `1`; set it to `0`
for a 0-indexed API, so the first page is `page=0` in both the URL and `params`:

```ts
export const { useFilters } = createFilters({
  pagination: { firstPage: 0 }
});
```

**Managing the page entirely yourself?** By default, changing any filter resets
the page to `firstPage` (a changed filter invalidates the old result window).
If pagination is driven outside the hook and it should never write the page
param, opt out — factory-wide or per call:

```ts
createFilters({ pagination: { resetPageOnFilterChange: false } });
// or for one screen:
useFilters(configs, { pagination: { resetPageOnFilterChange: false } });
```

**Offset-based API?** There's no built-in mapping — derive `limit` / `offset`
where you fetch, straight from `params`:

```ts
const { params } = useFilters({/* ... */}); // { ...filters, page, per_page }

const { page, per_page, ...filters } = params;
useQuery({
  queryKey: ['loans', params],
  queryFn: () =>
    loanApi.getAll({
      ...filters,
      limit: per_page,
      offset: (page - 1) * per_page
    })
});
```

See the [config reference](#createfilters-config) for every option.

> **Why a factory and not a React provider?** The same constants must also reach
> `resolveFilterParams`, which runs in route loaders **outside** React and can't
> read context. Closing over them keeps the hook and the loader helper in lockstep
> (so their query keys match), with no runtime context lookup and full type safety.

### Multiple APIs, multiple conventions: one factory each

In a large project, different backends often page differently — one uses
`page` / `per_page` (1-based), another `page` / `page_size` (0-based). The
pagination keys and `firstPage` are deliberately **not** overridable per
`useFilters` call: if they were, every call site and its paired
`resolveFilterParams` loader would have to repeat the same override, and the
moment one drifted, the hook and loader would silently disagree (wrong query
keys, wrong page resets). Instead, create **one factory per API convention**
and name the exports:

```ts
// src/lib/filters/crm.ts — 1-based, page/per_page
export const {
  useFilters: useCrmFilters,
  resolveFilterParams: resolveCrmParams,
  f
} = createFilters({
  pagination: { pageKey: 'page', perPageKey: 'per_page' }
});

// src/lib/filters/billing.ts — 0-based, page/page_size
export const { useFilters: useBillingFilters, resolveFilterParams: resolveBillingParams } =
  createFilters({
    pagination: { perPageKey: 'page_size', firstPage: 0 }
  });
```

Each factory is a self-documenting statement of one API's conventions, each
hook's `params` is typed to its own keys, and the hook/loader pairing is
guaranteed by construction — it's impossible to use billing pagination on a
CRM route by accident. (`defaultPerPage` **is** per-call overridable, because
it changes no keys and no shape — just a default number.)

## Route loaders: `resolveFilterParams`

If you prefetch data in a route loader (TanStack Router, React Router), you need
the loader to compute the **exact same** `params` object the hook will compute
on mount — otherwise the prefetch lands under a different query key and gets
thrown away. `resolveFilterParams` is that framework-agnostic twin:

```ts
// TanStack Router — search is already a parsed object
loader: ({ context: { queryClient }, location: { search } }) =>
  queryClient.ensureQueryData(loanQueryOptions(resolveFilterParams(loanFilterConfigs, search)));
```

```ts
// React Router — pass the URLSearchParams straight in
export async function loader({ request }: LoaderFunctionArgs) {
  const params = resolveFilterParams(loanFilterConfigs, new URL(request.url).searchParams);
  return queryClient.ensureQueryData(loanQueryOptions(params));
}
```

It accepts the raw search in whatever shape your router provides — a parsed
object, a `URLSearchParams`, or the raw `location.search` string — applies the
same defaults and pagination mapping as the hook, coerces values to the same
types (so `?status=5` becomes `5`, not `'5'`), and drops extras like async
`_label` sidecars. Share the same config map object between the loader and the
hook.

## Async (server-searched) filters

Use `f.asyncSelect` / `f.asyncMultiSelect` when the choices live on the server
and are too many to load up front — e.g. "pick a customer" out of thousands.
Options are fetched (debounced) as the user types:

```ts
customer_id: f.asyncSelect({
  label: 'Customer',
  // called on each keystroke; return a small page. `signal` aborts stale requests.
  loadOptions: (search, signal) =>
    customerApi
      .getAll({ params: { search, limit: 20 }, signal })
      .then((list) => list.map((c) => ({ value: c.id, label: c.full_name })))
});
```

**The label sidecar.** The URL only stores the chosen id — but after a refresh
or on a shared link there's nothing in memory to turn that id back into a name.
So async filters also store the selected label in a companion param,
`<key>_label`, and give you the pair back ready to render:

```
?customer_id=42&customer_id_label=Acme+Corp
```

Because of this, async resolved filters expose option-aware handlers that write
value and label together, so you never have to manage the sidecar yourself:

| Kind               | Read              | Write                                          |
| ------------------ | ----------------- | ---------------------------------------------- |
| `asyncSelect`      | `selectedOption`  | `onSelectOption(option \| null)`               |
| `asyncMultiSelect` | `selectedOptions` | `onToggleOption(option)`, `onSetOptions(list)` |

The `_label` params are display-only and never appear in `params` sent to your
API. (One rule: don't name a filter `something_label` — that suffix is reserved.)

**String ids?** Async values round-trip through the URL as **numbers by
default** — a string id (UUID, slug) would parse back as `null`. Set
`valueType: 'string'` on the filter to match. Development builds warn when
`loadOptions` resolves options whose values contradict the configured
`valueType`, so this can't fail silently.

### Choosing a value type for fetched options

A `select` / `multiSelect` stores either numbers or strings in the URL, and it
has to parse them back to the **same** runtime type everywhere the config is
used — otherwise `params` from the hook and `params` from a route loader are
different objects and their query keys don't match. With static `options` the
type is inferred from them. But a very common setup breaks that inference:

```tsx
// The options are fetched, so the loader and the component build the config
// with DIFFERENT options — the loader has none.
const configs = {
  // ❌ no valueType: the component (numeric options loaded) parses `?customer_id=5`
  //    as the number 5; the loader (no options) parses it as the string '5'.
  customer_id: f.select({ label: 'Customer', options: fetchedCustomerOptions })
};
```

Declare `valueType` once and both sides agree, regardless of whether options are
present:

```tsx
customer_id: f.select({
  label: 'Customer',
  valueType: 'number', // ← the static source of truth for parsing
  options: fetchedCustomerOptions // (component) — omit / [] in the loader config
});
```

`valueType` is the declaration: when set, it drives the value type — `params`
comes out as `number | null` even with empty options — and your `options` are
type-checked against it (a string-valued option under `valueType: 'number'` is
a compile error on that option), so the two can't drift out of sync. In
development, `resolveFilterParams` **warns** if it meets a `select` /
`multiSelect` that has no options and no `valueType` — the exact shape of this
bug — so a loader can't quietly disagree with the hook. Static-options filters
need none of this; they keep inferring as before.

> This is also why async filters (`asyncSelect` / `asyncMultiSelect`) have
> always taken `valueType` (defaulting to `'number'`) — their options are
> _never_ in memory up front, so the type has to be declared, not sniffed.

## Dynamic / backend-driven filters

A config map is just **data** — it doesn't have to be a static literal. For
e-commerce faceted search and similar cases where the backend describes which
filters exist, build the map at runtime and pass it straight in:

```tsx
function ProductFilters() {
  const { data: facets } = useQuery(facetsQueryOptions()); // backend describes the filters

  // Map backend facets -> a config map. Memoize on the response so `filters`
  // stays referentially stable between renders.
  const configs = useMemo(
    () =>
      Object.fromEntries(
        (facets ?? []).map((facet) => {
          switch (facet.type) {
            case 'checkbox':
              return [
                facet.key,
                f.multiSelect({
                  label: facet.label,
                  options: facet.values.map((v) => ({
                    label: v.label,
                    value: v.value,
                    count: v.count // facet counts are first-class on FilterOption
                  }))
                })
              ];
            case 'range':
              return [facet.key, f.numberRange({ label: facet.label, unit: facet.unit })];
            case 'toggle':
              return [facet.key, f.boolean({ label: facet.label })];
            default:
              return [facet.key, f.text({ label: facet.label })];
          }
        })
      ),
    [facets]
  );

  const { params, filters } = useFilters(configs);
  const { data } = useQuery(productsQueryOptions(params));
  // render `filters`, fetch with `params` — same as static filters
}
```

This works because the hook subscribes to the URL **once** (a single
`useQueryStates` call with a parser map, not one hook per filter), so a changing
number of filters is fine. The only thing you give up is compile-time typing of
`params` — you can't pass `useFilters<P>` for a shape unknown until runtime, so
`params` comes back as a loose record, which is fine to feed to your query.

A few things to keep in mind: **memoize** the mapped config (as above) or
`filters` gets a new array each render; when you reach a filter by key and set it
(`filterMap[key].onChange(...)`), **narrow on `filter.type` first** — without a
compile-time shape, the loose union types `onChange` as `(value: null)`, so a
`switch (filter.type)` (as in [rendering](#rendering-your-own-filter-ui)) recovers
the real value type; and a URL param for a filter that later disappears (e.g.
facets change with the selected category) lingers in the URL but drops out of
`params` — clean it up if that matters to you.

## Deferred commits: debounce & Apply

By default every `onChange` writes straight to `params`/the URL — great for a
`select`, wasteful for a text box that would refetch on every keystroke, and
wrong for a mobile sheet where nothing should move until the user taps "Apply".
Set a per-filter **`commit`** mode and `useFilters` keeps a local draft of that
filter, so the control stays responsive while the committed value waits:

| `commit`              | The control shows the change… | …and `params`/URL update…                 |
| --------------------- | ----------------------------- | ----------------------------------------- |
| `'instant'` (default) | immediately                   | immediately                               |
| `{ debounce: ms }`    | immediately                   | `ms` after the last change (timer resets) |
| `'manual'`            | immediately                   | only when you call `apply()`              |

```tsx
const { filterMap, filters, params, isDirty, apply, cancel } = useFilters({
  search: f.text({ label: 'Search', commit: { debounce: 400 } }),
  status: f.select({ label: 'Status', options: statusOptions, commit: 'manual' }),
  city: f.select({ label: 'City', options: cityOptions, commit: 'manual' })
});

// `params.search` only changes 400ms after typing stops — so your query key
// (and refetch) settles once, not per keystroke. No extra state to manage:
<input value={filterMap.search.value ?? ''}
       onChange={(e) => filterMap.search.onChange(e.target.value || null)} />

// `status` / `city` update the UI instantly but stay out of `params` until Apply:
<FilterSheet filters={filters} />
<button disabled={!isDirty} onClick={apply}>Apply filters</button>
<button disabled={!isDirty} onClick={cancel}>Cancel</button>
```

- **`isDirty`** — `true` while any filter has a change that hasn't reached
  `params` yet (a pending debounce timer, or a manual change awaiting `apply()`).
  Always `false` when every filter is `'instant'`.
- **`apply()`** — commit every pending change at once, including ones mid-debounce.
- **`cancel()`** — drop every pending change; filters snap back to their
  committed (`params`) values.
- **`setFilter(key, value)`** bypasses the draft entirely and commits now,
  whatever the filter's `commit` mode — it's the imperative escape hatch.
- **`reset()`** clears drafts and committed values together — a hard,
  immediate reset of every filter, bypassing `commit` (unlike a single
  filter's `reset`, below, which respects it).

Modes are per filter, so a debounced search and a batch of manual selects can
live in the same panel (as above). `params` always reflects only committed
values, so it stays safe to use directly as your data-fetching query key.

Each resolved filter also carries this state directly — `isDirty`,
`committedValue`, `isInstant`/`isDebounced`/`isManual`, `debounceMs` — so a
component never needs `params` passed in separately to know its own state.
It also gets its **own** `apply()` / `cancel()` / `reset()` — the same trio as
the hook, scoped to just that filter (handy for a per-row "apply this one" or
"undo" affordance instead of one global Apply button):

```tsx
function Field({ filter }: { filter: ResolvedFilter }) {
  return (
    <div>
      {/* ...render the control */}
      {filter.isDirty && (
        <>
          <button onClick={filter.apply}>✓</button>
          <button onClick={filter.cancel}>✕</button>
        </>
      )}
    </div>
  );
}
```

Unlike the hook-wide `reset()`, a filter's own `reset()` **respects its
`commit` mode** — on a manual filter it lands in the draft and waits for
`apply()`, same as any other change. Need it to act instantly instead — the
same relationship `setFilter` has to `onChange` at the hook level — use
`instantReset()`. See
[Rendering your own filter UI](#rendering-your-own-filter-ui) for the full
per-filter state reference.

### Setting a default mode

Rather than repeating `commit` on every filter, set a **default** at the call or
factory level. Precedence (most specific wins):

**per-filter `commit`** → **`useFilters` `defaultCommit` option** → **`createFilters` `defaultCommit`** → `'instant'`

```tsx
// Every filter in this app defaults to manual-commit ("Apply" UX)…
export const { useFilters, f } = createFilters({ defaultCommit: 'manual' });

// …override for one screen, and again for one filter:
const { filterMap, apply, isDirty } = useFilters(
  {
    q: f.text({ label: 'Search', commit: { debounce: 400 } }), // this filter: debounced
    status: f.select({ label: 'Status', options }) // inherits the call default…
  },
  { defaultCommit: 'instant' } // …which is instant here (overriding the factory's manual)
);
```

Each resolved filter exposes its **effective** mode as `filterMap[key].commit`
(after the defaults are applied), so a UI can badge it without re-deriving.

> This is unrelated to a filter's `nuqs: { limitUrlUpdates: debounce(ms) }`
> option, which throttles the browser history write **after** a value is already
> committed. `commit` controls when it's committed at all.

## Dates

`date` / `dateRange` values are stored as strings, using a **fixed** default
format: `yyyy-MM-dd` (and `yyyy-MM-ddTHH:mm:ss` for datetime). Convert to/from
`Date` with the `toDateValue` / `fromDateValue` returned from `createFilters` —
they're exact inverses and reject malformed / out-of-range input:

```ts
filter.onChange(toDateValue(pickedDate)); // Date  -> stored string
const date = fromDateValue(filter.value); // string -> Date | undefined
```

**Date + time.** Declare a `date` or `dateRange` filter with
`precision: 'datetime'` to capture a time component too. The value type is
unchanged (still a string / `[string, string]`); use the datetime converters
(`toDateTimeValue` / `fromDateTimeValue`) and read `filter.precision` in your UI
to decide whether to render a time picker:

```ts
export const { toDateTimeValue, fromDateTimeValue } = createFilters();

starts_at: f.date({ label: 'Starts at', precision: 'datetime' });
window: f.dateRange({ label: 'Window', precision: 'datetime' });

// in your control:
const [toValue, fromValue] =
  filter.precision === 'datetime'
    ? [toDateTimeValue, fromDateTimeValue]
    : [toDateValue, fromDateValue];
```

**Want a different representation?** There's no format-string option — instead,
override the (de)serialization directly. Supply `date.serialize` / `date.parse`
(and their `*DateTime` counterparts) to `createFilters` to store dates in any
shape or date library — a `dd.MM.yyyy` UI, month names, timezone-aware or
non-Gregorian dates. `toDateValue` / `fromDateValue` then use your functions:

```ts
createFilters({
  date: {
    serialize: (date) => dayjs(date).format('DD.MM.YYYY'),
    parse: (value) => {
      const d = dayjs(value, 'DD.MM.YYYY', true);
      return d.isValid() ? d.toDate() : undefined;
    }
  }
});
```

## Times

`time` / `timeRange` capture a **time of day** with no date. Unlike `date`,
there are **no converters** and no timezone: the value is just a 24-hour clock
string — `HH:mm` by default, `HH:mm:ss` with `precision: 'second'` — which is
exactly what an `<input type="time">` reads and writes, so you store it straight
through.

```ts
opens_at: f.time({ label: 'Opens at' });                 // params.opens_at -> "09:30" | null
hours:    f.timeRange({ label: 'Business hours' });       // params.hours    -> ["09:00","17:00"] | null

// in your control — no conversion needed:
<input type="time" value={filter.value ?? ''} onChange={(e) => filter.onChange(e.target.value || null)} />
```

A `timeRange` may **wrap midnight** (`from > to`, e.g. `['22:00', '02:00']` for a
night shift). It's stored as-is; your API/UI decides what an overnight range
means.

## Project-specific UI hints: `meta`

Your custom UI often needs extra per-filter hints (a layout variant, a group, a
step). Attach them via `meta` — fully typed, with zero changes to this package.
Augment the interfaces once in your app; each filter kind has its own so a hint
can be specific to just one, and options have their own too:

```ts
// e.g. src/app/types/filters.ts in your app
declare module '@mbsatimov/use-filters' {
  interface FilterMeta {
    variant?: 'flex' | 'list'; // available on EVERY filter kind
  }
  interface SelectFilterMeta {
    group?: 'primary' | 'advanced'; // only on select filters
  }
  interface FilterOptionMeta {
    icon?: React.ComponentType; // on every FilterOption
  }
  interface FiltersMeta {
    layout?: 'toolbar' | 'sidebar'; // the whole filter set
  }
}
```

```ts
status: f.select({
  label: 'Status',
  options: [{ label: 'Open', value: 'open', meta: { icon: OpenIcon } }],
  meta: { group: 'primary' }
});
useFilters(configs, { meta: { layout: 'sidebar' } });
```

This package never reads `meta` — it only carries it through to `filters` /
`filterMap` / the return value for your UI to branch on.

> The old `FilterOption.icon` / `leftSlot` / `rightSlot` fields and the
> per-filter `className` are **deprecated** — they were rendering concerns baked
> into a headless core. Declare the fields you need on `FilterOptionMeta` /
> `FilterMeta` instead (same data, typed by you). They keep working until 1.0.

## API reference

### Hook return value

| Property     | Type                   | Description                                                                                                   |
| ------------ | ---------------------- | ------------------------------------------------------------------------------------------------------------- |
| `params`     | object                 | Filter values + pagination (`{ page, per_page }` by default). Your fetch input & query key.                   |
| `filters`    | `ResolvedFilter[]`     | Visible filters to render. Excludes `hidden` ones.                                                            |
| `filterMap`  | `Record<key, ...>`     | Same filters keyed by config key. **Includes** hidden ones.                                                   |
| `isFiltered` | `boolean`              | `true` when at least one visible filter differs from its default.                                             |
| `isDirty`    | `boolean`              | `true` when a change hasn't reached `params` yet — see [Deferred commits](#deferred-commits-debounce--apply). |
| `apply`      | `() => void`           | Commit all pending (debounced/manual) changes now. See [Deferred commits](#deferred-commits-debounce--apply). |
| `cancel`     | `() => void`           | Discard all pending changes, reverting to committed values.                                                   |
| `reset`      | `() => void`           | Clear every filter back to its default (or empty).                                                            |
| `setFilter`  | `(key, value) => void` | Imperatively set one filter (resets to page 1, bypasses `commit` deferral).                                   |
| `meta`       | `FiltersMeta`          | The `meta` you passed (or `{}`).                                                                              |

### `useFilters` options (second argument)

These **override the `createFilters` config for this call** (precedence: per-filter

> `useFilters` option > `createFilters` config > default), plus a few call-only
> URL-behavior settings.

| Option           | Default       | Description                                                                                                                                                                                                                                  |
| ---------------- | ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pagination`     | `true`        | `false` disables pagination for this call; an object overrides the per-call-safe fields (`defaultPerPage`, `resetPageOnFilterChange`). Page/per-page **keys** and `firstPage` stay factory-only (so `params` matches `resolveFilterParams`). |
| `defaultCommit`  | factory value | Default `commit` mode for all filters this call, overridable per filter. See [Deferred commits](#deferred-commits-debounce--apply).                                                                                                          |
| `arraySeparator` | factory value | Delimiter for array-shaped params (`multiSelect`, `tags`, ranges) for this call. See below.                                                                                                                                                  |
| `history`        | `'replace'`   | `'push'` makes filter changes back-button navigable.                                                                                                                                                                                         |
| `shallow`        | `true`        | Keep navigation client-side (no server round-trip).                                                                                                                                                                                          |
| `clearOnDefault` | `true`        | Drop a param from the URL when it returns to its default.                                                                                                                                                                                    |
| `meta`           | `{}`          | Whole-set UI hints — see [`meta`](#project-specific-ui-hints-meta).                                                                                                                                                                          |

### Per-filter options (shared by every kind)

| Option         | Description                                                                                                                                                |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `label`        | Required. Human label for the control.                                                                                                                     |
| `placeholder`  | Optional placeholder (defaults to `label`).                                                                                                                |
| `defaultValue` | Value when the URL param is absent. A filter sitting at its default counts as inactive.                                                                    |
| `hidden`       | Keep the value in `params` but omit it from `filters` (still in `filterMap`).                                                                              |
| `className`    | **Deprecated** — declare a `className` on `FilterMeta` and pass it via `meta` instead. Removed in 1.0.                                                     |
| `meta`         | Per-filter UI hints — see [`meta`](#project-specific-ui-hints-meta).                                                                                       |
| `commit`       | When the change reaches `params`/URL: `'instant'` (default), `{ debounce: ms }`, or `'manual'`. See [Deferred commits](#deferred-commits-debounce--apply). |
| `nuqs`         | Per-filter nuqs options, e.g. `{ history: 'push' }` or `{ limitUrlUpdates: debounce(500) }`. Overrides the hook defaults.                                  |

### `createFilters` config

Top-level `defaultCommit` (default `'instant'`) sets the fallback `commit` mode
for every filter — see [Deferred commits](#deferred-commits-debounce--apply).
Top-level **`arraySeparator`** (default `','`) is the delimiter joining/splitting
an array-shaped param's items in the URL — `multiSelect`, `asyncMultiSelect`,
`tags`, and the range kinds (`numberRange`/`dateRange`/`timeRange`):

```ts
export const { useFilters, f } = createFilters({ arraySeparator: '|' });
// tags: ['a', 'b', 'c']  <->  ?tags=a|b|c   (instead of ?tags=a,b,c)
```

Change it if a comma can appear inside an item's own value, or your backend
expects a different delimiter. Overridable per `useFilters`/`resolveFilterParams`
call (their `arraySeparator` option) — same precedence as everything else
(call > factory > default). `resolveFilterParams` needs the same separator the
hook is using to parse a raw URL string correctly (see
[Route loaders](#route-loaders-resolvefilterparams)).

The rest is grouped into `pagination` and `date`.

**`pagination`**

| Option                    | Default      | Description                                                                                                                                                                                                            |
| ------------------------- | ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pageKey`                 | `'page'`     | URL key for the page number, and its key in `params`.                                                                                                                                                                  |
| `perPageKey`              | `'per_page'` | URL key for the per-page count, and its key in `params`.                                                                                                                                                               |
| `firstPage`               | `1`          | The number the first page is counted from — the value when the URL has none, what reset writes, and the base your API pages from. Set to `0` for a 0-indexed API.                                                      |
| `defaultPerPage`          | `10`         | Per-page count assumed when the URL has none.                                                                                                                                                                          |
| `resetPageOnFilterChange` | `true`       | Whether changing a filter resets the page to `firstPage`. Set `false` when pagination is driven entirely outside the hook — it then never writes the page param (applies to `reset()` too). Also per-call overridable. |

**`date`**

| Option              | Default                     | Description                                            |
| ------------------- | --------------------------- | ------------------------------------------------------ |
| `serialize`         | fixed `yyyy-MM-dd`          | Override date → string (store dates however you like). |
| `parse`             | fixed `yyyy-MM-dd`          | Override string → `Date` (pair with `serialize`).      |
| `serializeDateTime` | fixed `yyyy-MM-ddTHH:mm:ss` | Datetime counterpart of `serialize`.                   |
| `parseDateTime`     | fixed `yyyy-MM-ddTHH:mm:ss` | Datetime counterpart of `parse`.                       |

## Gotchas

- **Mount the nuqs adapter** once at your app root, or the hook throws. See
  [setup](#one-time-setup-the-nuqs-adapter).
- **Reserved suffix:** don't name a filter `*_label`; async filters use that
  suffix for their label sidecar. (A dev-mode warning fires if you do.)
- **String ids need `valueType: 'string'`:** async filters parse URL values as
  numbers by default, so a UUID id would come back `null`. Dev builds warn when
  `loadOptions` returns options that don't match the configured `valueType`.
- **Fetched `select` / `multiSelect` options need a `valueType`:** the value
  type is inferred from `options`, so a config used both with options (the
  component) and without (a route loader) can parse the URL to two different
  types. Set `valueType` to pin it. See
  [Choosing a value type](#choosing-a-value-type-for-fetched-options).
- **`params` includes `null`s** for unset filters. If your client can't send
  nulls, strip them before the request.
- **Explicit `<P>` vs. inferred:** passing `useFilters<ListParams>` validates
  against your type; omitting it infers `params` per config. TypeScript can't do
  both at once — pick whichever you need.
- Passing an **inline config object** to `useFilters` is fine — configs are
  fingerprinted structurally, so URL state is not re-initialized each render.

## What's in here vs. what isn't

This package is the **headless core only**: `createFilters`, `useFilters`, the
`f.*` builders, `resolveFilterParams`, and the types. It has **zero runtime
dependencies** — just the `react` and `nuqs` peers.

The rendered toolbar, popovers, chips, option lists, etc. are intentionally
**not** included — those live in your project, built against your design system,
using this hook underneath.

## Development

```bash
nvm use               # Node version from .nvmrc (tests need >= 20.19 for require(esm))
npm install
npm run typecheck     # tsc (src + tests — includes the type-level tests)
npm run test          # vitest
npm run build         # tsup -> dist/ (ESM + CJS + .d.ts)
npm run check:exports # attw — published types resolve under every module system
npm run size          # size-limit budget for dist
npm run playground    # vite dev server for the interactive demo (playground/)
```

See [CONTRIBUTING.md](./CONTRIBUTING.md) for the full contributor guide.

The [`playground/`](playground/) app exercises every filter kind and commit mode
against the live `src`, styled with Tailwind CSS v4 and [shadcn/ui](https://ui.shadcn.com)
components (`playground/components.json`; add more with `npx shadcn@latest add
<component> --cwd playground`). It's **dev-only** — `package.json#files` ships
only `dist`, and the library build bundles only `src/index.ts`, so nothing
there reaches the published package. It deploys to Vercel as the
[live demo](https://use-filters.vercel.app) via [`vercel.json`](vercel.json)
(`npm run build:playground` → `playground/dist`).

## Publishing

Releases are automated with [Changesets](https://github.com/changesets/changesets)
via [`.github/workflows/release.yml`](.github/workflows/release.yml):

1. Land your change with a changeset: run `npx changeset`, pick the bump level,
   describe the change, and commit the generated `.changeset/*.md` with your PR.
2. On push to `main`, the workflow opens (or updates) a **"Version Packages"**
   PR that bumps `package.json` and rewrites `CHANGELOG.md` from the pending
   changesets.
3. Merging that PR publishes to npm with provenance and tags the release.
   `prepublishOnly` typechecks, tests, builds, and verifies the published types
   (`attw`) and the size budget first.

Requires an `NPM_TOKEN` repository secret (an npm automation token with publish
rights to the `@mbsatimov` scope).
