# @mbsatimov/use-filters

Headless, URL-synced filter state for React. You declare your filters once as a
plain object; the hook keeps their state in the URL query string and hands back
a typed `params` object for fetching data plus ready-to-render filter state. It
ships **no UI** — you render your own controls against your own design system.

**Why the URL?** The URL becomes the single source of truth for "what is the
user looking at". Refreshes, back/forward, bookmarks, and shared links all just
work, and your data-fetching cache keys stay in sync for free.

```ts
const { params, filters, isFiltered, reset } = useFilters({
  search: f.text({ label: 'Search' }),
  status: f.select({ label: 'Status', options: statusOptions })
});
//  ?search=acme&status=open   <->   params = { search: 'acme', status: 'open', limit: 10, offset: 0 }
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

  // `params` = { search, status, limit, offset } — use it to fetch, and as the
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
`page_size` URL keys, `{ limit, offset }` API params, `yyyy-MM-dd` dates). To
change those, bind your own with [`createFilters`](#per-project-setup-createfilters).

## Rendering your own filter UI

`filters` is an array of **resolved filters** — each is your original config
plus a live `value` and handlers. You decide how to render them. The essentials
every filter has:

| Field       | What it is                                                        |
| ----------- | ----------------------------------------------------------------- |
| `key`       | The config key (also the URL param name).                         |
| `label`     | Your human label (and `placeholder`, defaulting to `label`).      |
| `value`     | Current value, or `null` when unset.                              |
| `onChange`  | `(value) => void` — set this filter's value.                      |
| `onClear`   | `() => void` — reset to its `defaultValue` (or empty).            |

Choice filters also expose the resolved option object(s) so you can show the
selected label without a lookup: `selectedOption` (select / asyncSelect) and
`selectedOptions` (multiSelect / asyncMultiSelect).

```tsx
function FilterToolbar({ filters }: { filters: ResolvedFilter[] }) {
  return (
    <div className="toolbar">
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
                <option value="">{filter.label}</option>
                {filter.options.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
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
*where* you render it. The `filters` array is just a convenience list for "the
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

## Filter kinds

Build every filter with an `f.*` helper. The builder decides how the value is
parsed and what type appears in `params`.

| Builder              | Use for                                  | `params.<key>` type      | Notable options                     |
| -------------------- | ---------------------------------------- | ------------------------ | ----------------------------------- |
| `f.text`             | Search boxes, free text                  | `string \| null`         | —                                   |
| `f.number`           | Amounts, counts, rates                   | `number \| null`         | `precision: 'float' \| 'int'`, `unit` |
| `f.numberRange`      | Numeric from–to (price/age "between")    | `[number, number] \| null` | `precision: 'float' \| 'int'`, `unit` |
| `f.boolean`          | Toggles, on/off                          | `boolean \| null`        | `trueLabel`, `falseLabel`           |
| `f.date`             | A single date (or date + time)           | `string \| null`         | `precision: 'date' \| 'datetime'`   |
| `f.dateRange`        | A from–to range (date or date + time)    | `[string, string] \| null` | `precision: 'date' \| 'datetime'` |
| `f.select`           | One choice from a fixed list             | `V \| null`              | `options`                           |
| `f.multiSelect`      | Many choices from a fixed list           | `V[] \| null`            | `options`                           |
| `f.tags`             | Freeform string list (no options)        | `string[] \| null`       | —                                   |
| `f.asyncSelect`      | One choice, **server-searched** by id    | `V \| null`              | `loadOptions`, `valueType`, `debounceMs` |
| `f.asyncMultiSelect` | Many choices, **server-searched**        | `V[] \| null`            | `loadOptions`, `valueType`, `debounceMs` |

`V` is inferred from your `options` (or `valueType` for async): number-valued
options give `number | null`, a status enum gives `Status | null`, and so on —
no annotations needed.

Every kind also accepts the shared options `label` (required), `placeholder`,
`defaultValue`, `hidden`, `className`, `meta`, and `nuqs` (see
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
  limit: number;   // pagination keys are owned by the hook — exclude these
  offset: number;  // from what you validate against
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

Pagination param names, page defaults, date format, and the API pagination
shape differ between projects. Bind them **once** and export the result so every
screen shares the same constants:

```ts
// src/lib/filters.ts
import { createFilters } from '@mbsatimov/use-filters';

export const { useFilters, resolveFilterParams, f, toDateValue, fromDateValue } =
  createFilters({
    pageKey: 'page',
    pageSizeKey: 'per_page',
    defaultPageSize: 25,
    dateFormat: 'dd.MM.yyyy'
  });
```

Then import `useFilters` / `f` from `src/lib/filters` instead of the package.

`mapPagination` controls how the URL's human `page` / `pageSize` turn into the
params your API wants — and `params` is typed from what it returns:

```ts
export const { useFilters } = createFilters({
  // params.page / params.page_size instead of the default limit / offset
  mapPagination: (page, pageSize) => ({ page, page_size: pageSize })
});
```

See the [config reference](#createfilters-config) for every option.

> **Why a factory and not a React provider?** The same constants must also reach
> `resolveFilterParams`, which runs in route loaders **outside** React and can't
> read context. Closing over them keeps the hook and the loader helper in lockstep
> (so their query keys match), with no runtime context lookup and full type safety.

## Route loaders: `resolveFilterParams`

If you prefetch data in a route loader (TanStack Router, React Router), you need
the loader to compute the **exact same** `params` object the hook will compute
on mount — otherwise the prefetch lands under a different query key and gets
thrown away. `resolveFilterParams` is that framework-agnostic twin:

```ts
// TanStack Router
loader: ({ context: { queryClient }, location: { search } }) =>
  queryClient.ensureQueryData(
    loanQueryOptions(resolveFilterParams(loanFilterConfigs, search))
  )
```

It takes your config map and the raw search params, applies the same defaults
and pagination mapping as the hook, coerces values to the same types (so
`?status=5` becomes `5`, not `'5'`), and drops extras like async `_label`
sidecars. Share the same config map object between the loader and the hook.

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
})
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

| Kind               | Read                | Write                                          |
| ------------------ | ------------------- | ---------------------------------------------- |
| `asyncSelect`      | `selectedOption`    | `onSelectOption(option \| null)`               |
| `asyncMultiSelect` | `selectedOptions`   | `onToggleOption(option)`, `onSetOptions(list)` |

The `_label` params are display-only and never appear in `params` sent to your
API. (One rule: don't name a filter `something_label` — that suffix is reserved.)

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
              return [facet.key, f.multiSelect({
                label: facet.label,
                options: facet.values.map((v) => ({
                  label: v.label,
                  value: v.value,
                  count: v.count // facet counts are first-class on FilterOption
                }))
              })];
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

## Dates

`date` / `dateRange` values are stored as formatted strings (default
`yyyy-MM-dd`). Convert to/from `Date` with the `toDateValue` / `fromDateValue`
returned from `createFilters` — they're bound to your `dateFormat` and are exact
inverses:

```ts
filter.onChange(toDateValue(pickedDate)); // Date  -> stored string
const date = fromDateValue(filter.value); // string -> Date | undefined
```

**Date + time.** Declare a `date` or `dateRange` filter with
`precision: 'datetime'` to capture a time component too. The value type is
unchanged (still a string / `[string, string]`); use the datetime converters
(`toDateTimeValue` / `fromDateTimeValue`, formatted with `dateTimeFormat`,
default `"yyyy-MM-dd'T'HH:mm:ss"`), and read `filter.precision` in your UI to
decide whether to render a time picker:

```ts
export const { toDateTimeValue, fromDateTimeValue } = createFilters();

starts_at: f.date({ label: 'Starts at', precision: 'datetime' });
window:    f.dateRange({ label: 'Window', precision: 'datetime' });

// in your control:
const [toValue, fromValue] =
  filter.precision === 'datetime'
    ? [toDateTimeValue, fromDateTimeValue]
    : [toDateValue, fromDateValue];
```

To use a different date library (and drop the bundled `date-fns`), supply both
`serializeDate` and `parseDate` (and their `*DateTime` counterparts) to
`createFilters`:

```ts
createFilters({
  serializeDate: (date) => dayjs(date).format('DD.MM.YYYY'),
  parseDate: (value) => {
    const d = dayjs(value, 'DD.MM.YYYY');
    return d.isValid() ? d.toDate() : undefined;
  }
});
```

## Project-specific UI hints: `meta`

Your custom UI often needs extra per-filter hints (a layout variant, a group, a
step). Attach them via `meta` — fully typed, with zero changes to this package.
Augment the interfaces once in your app; each filter kind has its own so a hint
can be specific to just one:

```ts
// e.g. src/app/types/filters.ts in your app
declare module '@mbsatimov/use-filters' {
  interface FilterMeta {
    variant?: 'flex' | 'list'; // available on EVERY filter kind
  }
  interface SelectFilterMeta {
    group?: 'primary' | 'advanced'; // only on select filters
  }
  interface FiltersMeta {
    layout?: 'toolbar' | 'sidebar'; // the whole filter set
  }
}
```

```ts
status: f.select({ label: 'Status', options, meta: { group: 'primary' } });
useFilters(configs, { meta: { layout: 'sidebar' } });
```

This package never reads `meta` — it only carries it through to `filters` /
`filterMap` / the return value for your UI to branch on.

## API reference

### Hook return value

| Property     | Type                | Description                                                                 |
| ------------ | ------------------- | -------------------------------------------------------------------------- |
| `params`     | object              | Filter values + pagination (`{ limit, offset }` by default). Your fetch input & query key. |
| `filters`    | `ResolvedFilter[]`  | Visible filters to render. Excludes `hidden` ones.                         |
| `filterMap`  | `Record<key, ...>`  | Same filters keyed by config key. **Includes** hidden ones.                |
| `isFiltered` | `boolean`           | `true` when at least one visible filter differs from its default.          |
| `reset`      | `() => void`        | Clear every filter back to its default (or empty).                         |
| `setFilter`  | `(key, value) => void` | Imperatively set one filter (resets to page 1, like any change).        |
| `meta`       | `FiltersMeta`       | The `meta` you passed (or `{}`).                                            |

### `useFilters` options (second argument)

| Option           | Default            | Description                                                       |
| ---------------- | ------------------ | ---------------------------------------------------------------- |
| `pagination`     | `true`             | Sync `page` / `page_size` and include pagination in `params`.    |
| `defaultPageSize`| factory value      | Page size when the URL has none.                                 |
| `history`        | `'replace'`        | `'push'` makes filter changes back-button navigable.             |
| `shallow`        | `true`             | Keep navigation client-side (no server round-trip).              |
| `clearOnDefault` | `true`             | Drop a param from the URL when it returns to its default.        |
| `meta`           | `{}`               | Whole-set UI hints — see [`meta`](#project-specific-ui-hints-meta). |

### Per-filter options (shared by every kind)

| Option         | Description                                                                              |
| -------------- | ---------------------------------------------------------------------------------------- |
| `label`        | Required. Human label for the control.                                                    |
| `placeholder`  | Optional placeholder (defaults to `label`).                                               |
| `defaultValue` | Value when the URL param is absent. A filter sitting at its default counts as inactive.   |
| `hidden`       | Keep the value in `params` but omit it from `filters` (still in `filterMap`).             |
| `className`    | Extra classes for your control wrapper.                                                   |
| `meta`         | Per-filter UI hints — see [`meta`](#project-specific-ui-hints-meta).                      |
| `nuqs`         | Per-filter nuqs options, e.g. `{ history: 'push' }` or `{ limitUrlUpdates: debounce(500) }`. Overrides the hook defaults. |

### `createFilters` config

| Option            | Default                                    | Description                                              |
| ----------------- | ------------------------------------------ | ------------------------------------------------------- |
| `pageKey`         | `'page'`                                   | URL key for the 1-based page number.                    |
| `pageSizeKey`     | `'page_size'`                              | URL key for the page size.                              |
| `defaultPage`     | `1`                                        | Page assumed when the URL has none.                     |
| `defaultPageSize` | `10`                                       | Page size assumed when the URL has none.                |
| `mapPagination`   | `{ limit, offset }`                        | Turn human `page` / `pageSize` into your API's params. Its return type shapes `params`. |
| `dateFormat`      | `'yyyy-MM-dd'`                             | `date-fns` format for date values.                      |
| `dateTimeFormat`  | `"yyyy-MM-dd'T'HH:mm:ss"`                  | `date-fns` format for `precision: 'datetime'` values.   |
| `serializeDate`   | format via `dateFormat`                     | Override date → string (bring your own date library).   |
| `parseDate`       | parse via `dateFormat`                       | Override string → `Date` (pair with `serializeDate`).   |
| `serializeDateTime` | format via `dateTimeFormat`               | Datetime counterpart of `serializeDate`.                |
| `parseDateTime`   | parse via `dateTimeFormat`                    | Datetime counterpart of `parseDate`.                    |

## Gotchas

- **Mount the nuqs adapter** once at your app root, or the hook throws. See
  [setup](#one-time-setup-the-nuqs-adapter).
- **Reserved suffix:** don't name a filter `*_label`; async filters use that
  suffix for their label sidecar. (A dev-mode warning fires if you do.)
- **`params` includes `null`s** for unset filters. If your client can't send
  nulls, strip them before the request.
- **Explicit `<P>` vs. inferred:** passing `useFilters<ListParams>` validates
  against your type; omitting it infers `params` per config. TypeScript can't do
  both at once — pick whichever you need.
- Passing an **inline config object** to `useFilters` is fine — configs are
  fingerprinted structurally, so URL state is not re-initialized each render.

## What's in here vs. what isn't

This package is the **headless core only**: `createFilters`, `useFilters`, the
`f.*` builders, `resolveFilterParams`, and the types. Its only runtime
dependencies are `react`, `nuqs`, and `date-fns` (the last of which you can opt
out of via `serializeDate` / `parseDate`).

The rendered toolbar, popovers, chips, option lists, etc. are intentionally
**not** included — those live in your project, built against your design system,
using this hook underneath.

## Development

```bash
npm install
npm run typecheck   # tsc (src + tests)
npm run test        # vitest
npm run build       # tsup -> dist/ (ESM + CJS + .d.ts)
```

## Publishing

Publishes to the public npm registry via `.github/workflows/publish.yml` on
every GitHub Release:

1. Bump `version` in `package.json` and update `CHANGELOG.md`.
2. Commit, push, then create a GitHub Release with a matching tag (e.g. `v0.2.0`).
3. The workflow typechecks, tests, builds, and runs `npm publish` automatically.

Requires an `NPM_TOKEN` repository secret (an npm automation token with publish
rights to the `@mbsatimov` scope). To publish locally instead, run `npm login`
then `npm publish`.
