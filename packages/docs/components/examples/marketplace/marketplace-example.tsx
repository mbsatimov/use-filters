'use client';

import type { ResolvedFilter, ResolvedFilterOf } from '@mbsatimov/use-filters';

import { f, useFilters } from '@mbsatimov/use-filters';
import { Star } from 'lucide-react';
import { useMemo, useState } from 'react';

import {
  brandOptions,
  categoryOptions,
  priceBounds,
  products,
  sortOptions
} from '@/components/examples/data/products';
import { FacetChipRow } from '@/components/filters/facet-panel/facet-chip-row';
import { FacetDrawer } from '@/components/filters/facet-panel/facet-drawer';
import { FacetPanel } from '@/components/filters/facet-panel/facet-panel';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';

/**
 * E-commerce faceted search on the facet-panel kit:
 *
 * - Desktop: `<FacetPanel>` renders a section per filter; with the facets on
 *   `commit: 'manual'` an Apply/Cancel bar appears while edits are staged.
 * - Mobile: `<FacetChipRow>` + `<FacetDrawer>` — tap a chip, edit that facet,
 *   and "Show N results" applies. Dismissing the drawer discards the draft.
 *
 * Both are views over the same `useFilters` instance, so they can never
 * disagree. The price slider shows `renderEditor`: one override swaps the
 * kit's default min/max inputs for a slider, everywhere the facet renders.
 */
export function MarketplaceExample() {
  const { apply, cancel, filters, filterMap, isDirty, isFiltered, params, instantReset } =
    useFilters(
      {
        q: f.text({ label: 'Search', commit: { debounce: 300 } }),
        category: f.select({
          label: 'Category',
          valueType: 'string',
          options: categoryOptions,
          commit: 'manual'
        }),
        brands: f.multiSelect({
          label: 'Brand',
          valueType: 'string',
          options: brandOptions,
          commit: 'manual'
        }),
        price: f.numberRange({ label: 'Price', commit: 'manual' }),
        in_stock: f.boolean({ label: 'In stock', trueLabel: 'In stock only' }),
        // Instant: re-sorting is cheap and never needs an Apply step.
        sort: f.select({
          label: 'Sort by',
          valueType: 'string',
          options: sortOptions,
          defaultValue: 'featured'
        })
      },
      { pagination: false }
    );

  // Which facet's drawer is open on mobile; `null` means none.
  const [openKey, setOpenKey] = useState<string | null>(null);

  // The grid renders from `params` — the committed state — so staged edits
  // don't move products around until they are applied.
  const results = useMemo(() => sortProducts(matchProducts(params), params.sort), [params]);

  // The drawer footer counts from the *draft* values (`filterMap.*.value`
  // shows the staged value for a manual filter), so "Show N results" is live.
  const draftCount = matchProducts({
    q: params.q,
    category: filterMap.category.value,
    brands: filterMap.brands.value,
    price: filterMap.price.value,
    in_stock: params.in_stock
  }).length;

  // Search renders in the toolbar and sort in its own dropdown; the facets are
  // everything else. Mobile adds sort back as the first chip.
  const facets = filters.filter((filter) => !['q', 'sort'].includes(filter.key));
  const mobileFacets = filters.filter((filter) => filter.key !== 'q');

  // One override: the price facet edits with a slider instead of min/max inputs.
  const renderEditor = (filter: ResolvedFilter) =>
    filter.key === 'price' ? (
      <PriceSlider filter={filter as ResolvedFilterOf<'numberRange'>} />
    ) : undefined;

  return (
    <div className='flex flex-col gap-4'>
      {/* Toolbar: search + (desktop) sort */}
      <div className='flex items-center gap-3'>
        <Input
          className='sm:max-w-xs'
          placeholder='Search products…'
          value={filterMap.q.value ?? ''}
          onChange={(e) => filterMap.q.onChange(e.target.value || null)}
        />
        <div className='ml-auto hidden items-center gap-2 md:flex'>
          <span className='text-muted-foreground text-sm whitespace-nowrap'>
            {results.length} {results.length === 1 ? 'result' : 'results'}
          </span>
          <SortSelect filter={filterMap.sort} />
        </div>
      </div>

      {/* Mobile: one chip per facet; tapping opens that facet's drawer. */}
      <FacetChipRow className='md:hidden' filters={mobileFacets} onOpenFacet={setOpenKey} />

      <div className='grid grid-cols-1 gap-6 md:grid-cols-[220px_1fr] items-start'>
        <FacetPanel
          className='hidden md:flex'
          filters={facets}
          isDirty={isDirty}
          isFiltered={isFiltered}
          renderEditor={renderEditor}
          onApply={apply}
          onCancel={cancel}
          onClearAll={instantReset}
        />

        {/* Results */}
        {results.length > 0 ? (
          <div className='grid grid-cols-2 gap-4 lg:grid-cols-3'>
            {results.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        ) : (
          <div className='text-muted-foreground flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-16 text-sm'>
            No products match these filters.
            <Button size='sm' variant='outline' onClick={instantReset}>
              Clear filters
            </Button>
          </div>
        )}
      </div>

      <FacetDrawer
        applyLabel={`Show ${draftCount} ${draftCount === 1 ? 'result' : 'results'}`}
        filter={mobileFacets.find((filter) => filter.key === openKey) ?? null}
        renderEditor={renderEditor}
        onApply={apply}
        onCancel={cancel}
        onClose={() => setOpenKey(null)}
      />
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * Catalog filtering — pure, so the grid (committed params) and the drawer's
 * live count (draft values) share one implementation.
 * ------------------------------------------------------------------------- */

interface CatalogQuery {
  brands?: string[] | null;
  category?: string | null;
  in_stock?: boolean | null;
  price?: [number, number] | null;
  q?: string | null;
}

function matchProducts(query: CatalogQuery) {
  const q = query.q?.toLowerCase().trim();
  return products.filter((p) => {
    if (q && !`${p.name} ${p.brand}`.toLowerCase().includes(q)) return false;
    if (query.category && p.category !== query.category) return false;
    if (query.brands?.length && !query.brands.includes(p.brand)) return false;
    if (query.price && (p.price < query.price[0] || p.price > query.price[1])) return false;
    if (query.in_stock && !p.inStock) return false;
    return true;
  });
}

function sortProducts(list: (typeof products)[number][], sort: string | null) {
  if (sort === 'price-asc') return [...list].sort((a, b) => a.price - b.price);
  if (sort === 'price-desc') return [...list].sort((a, b) => b.price - a.price);
  if (sort === 'rating') return [...list].sort((a, b) => b.rating - a.rating);
  return list;
}

/** The `renderEditor` override: a slider over the catalog's price bounds. */
function PriceSlider({ filter }: { filter: ResolvedFilterOf<'numberRange'> }) {
  const price = filter.value ?? priceBounds;
  return (
    <div className='px-1 py-2'>
      <Slider
        max={priceBounds[1]}
        min={priceBounds[0]}
        step={10}
        value={price}
        onValueChange={([lo, hi]) =>
          filter.onChange(
            lo === priceBounds[0] && hi === priceBounds[1] ? null : ([lo, hi] as [number, number])
          )
        }
      />
      <div className='text-muted-foreground mt-2 flex justify-between text-xs'>
        <span>${price[0]}</span>
        <span>${price[1]}</span>
      </div>
    </div>
  );
}

function SortSelect({ filter }: { filter: ResolvedFilterOf<'select'> }) {
  return (
    <Select
      value={String(filter.value ?? 'featured')}
      onValueChange={(next) => filter.onChange(next)}
    >
      <SelectTrigger className='w-[180px]'>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {sortOptions.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

const ProductCard = ({ product: p }: { product: (typeof products)[number] }) => (
  <div className='group border-border bg-card flex flex-col overflow-hidden rounded-lg border'>
    <div className='from-muted to-muted/40 flex aspect-[4/3] items-center justify-center bg-gradient-to-br text-4xl'>
      {p.emoji}
    </div>
    <div className='flex flex-1 flex-col gap-1 p-3'>
      <div className='text-muted-foreground text-xs'>{p.brand}</div>
      <div className='line-clamp-2 text-sm leading-snug font-medium'>{p.name}</div>
      <div className='mt-1 flex items-center gap-1 text-xs'>
        <Star className='size-3 fill-amber-400 text-amber-400' />
        <span className='text-muted-foreground'>{p.rating.toFixed(1)}</span>
        {!p.inStock && (
          <Badge className='ml-auto text-[10px]' variant='secondary'>
            Sold out
          </Badge>
        )}
      </div>
      <div className='mt-1 text-base font-semibold'>${p.price}</div>
    </div>
  </div>
);
