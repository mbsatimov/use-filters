'use client';

import { f, useFilters } from '@mbsatimov/use-filters';
import { ArrowUpDown, SlidersHorizontal, Star, X } from 'lucide-react';
import { useMemo, useState } from 'react';

import {
  brandOptions,
  categoryOptions,
  priceBounds,
  products,
  sortOptions
} from '@/components/examples/data/products';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Drawer,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle
} from '@/components/ui/drawer';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';

/**
 * E-commerce faceted search, responsive the way storefronts actually are:
 *
 * - Desktop: a facet sidebar next to the product grid, applying instantly.
 * - Mobile: a scrollable chip row; tapping a chip opens a bottom drawer for
 *   that facet. Edits inside the drawer are staged — the grid and the URL only
 *   change when "Show N results" applies them. Dismissing the drawer discards.
 *
 * One `useFilters` instance drives both. The facets use `commit: 'manual'`,
 * so the drawer's `onChange` stages a draft; the sidebar writes through
 * `setFilter`, which bypasses commit modes and applies immediately. The two
 * layouts can never disagree — they are two views of the same URL state.
 */

type FacetKey = 'brands' | 'category' | 'price' | 'sort';

export function MarketplaceExample() {
  const { apply, cancel, params, filterMap, isFiltered, reset, setFilter } = useFilters(
    {
      q: f.text({ label: 'Search', commit: { debounce: 300 } }),
      category: f.select({
        label: 'Category',
        valueType: 'string',
        options: categoryOptions,
        commit: 'manual'
      }),
      brands: f.multiSelect({
        label: 'Brands',
        valueType: 'string',
        options: brandOptions,
        commit: 'manual'
      }),
      price: f.numberRange({ label: 'Price', commit: 'manual' }),
      in_stock: f.boolean({ label: 'In stock' }),
      sort: f.select({
        label: 'Sort',
        valueType: 'string',
        options: sortOptions,
        defaultValue: 'featured',
        commit: 'manual'
      })
    },
    { pagination: false }
  );

  // Which facet's drawer is open on mobile; `null` means none.
  const [openFacet, setOpenFacet] = useState<FacetKey | null>(null);

  // The grid renders from `params` — the committed state — so staged drawer
  // edits don't move products around mid-edit.
  const results = useMemo(() => sortProducts(matchProducts(params), params.sort), [params]);

  // The drawer's footer counts from the *draft* values (`filterMap.*.value`
  // shows the staged value for a manual filter), so "Show N results" is live.
  const draftCount = matchProducts({
    q: params.q,
    category: filterMap.category.value,
    brands: filterMap.brands.value,
    price: filterMap.price.value,
    in_stock: params.in_stock
  }).length;

  const closeDrawer = (didApply: boolean) => {
    if (didApply) apply();
    else cancel(); // Dismissed: throw the staged edits away.
    setOpenFacet(null);
  };

  const facetTitles: Record<FacetKey, string> = {
    brands: 'Brands',
    category: 'Category',
    price: 'Price',
    sort: 'Sort by'
  };

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
          <Select value={params.sort ?? 'featured'} onValueChange={(v) => setFilter('sort', v)}>
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
        </div>
      </div>

      {/* Mobile: one chip per facet; tapping opens that facet's drawer. Chips
          read committed params, so they only change when edits are applied. */}
      <div className='-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] md:hidden'>
        <FacetChip
          active={(params.sort ?? 'featured') !== 'featured'}
          icon={<ArrowUpDown className='size-3.5' />}
          label='Sort'
          onOpen={() => setOpenFacet('sort')}
        />
        <FacetChip
          active={params.category != null}
          label={categoryOptions.find((c) => c.value === params.category)?.label ?? 'Category'}
          onClear={() => setFilter('category', null)}
          onOpen={() => setOpenFacet('category')}
        />
        <FacetChip
          label={
            params.brands?.length
              ? params.brands.length === 1
                ? params.brands[0]
                : `${params.brands.length} brands`
              : 'Brand'
          }
          active={(params.brands?.length ?? 0) > 0}
          onClear={() => setFilter('brands', null)}
          onOpen={() => setOpenFacet('brands')}
        />
        <FacetChip
          active={params.price != null}
          label={params.price ? `$${params.price[0]}–$${params.price[1]}` : 'Price'}
          onClear={() => setFilter('price', null)}
          onOpen={() => setOpenFacet('price')}
        />
        {/* Boolean facets toggle in place — no drawer needed. */}
        <FacetChip
          active={params.in_stock === true}
          label='In stock'
          onOpen={() => setFilter('in_stock', params.in_stock === true ? null : true)}
        />
      </div>

      <div className='grid grid-cols-1 gap-6 md:grid-cols-[220px_1fr]'>
        {/* Desktop facet sidebar — writes through `setFilter`, so every click
            applies (and hits the URL) immediately. */}
        <aside className='hidden flex-col gap-5 md:flex'>
          <div className='flex items-center gap-2'>
            <SlidersHorizontal className='text-muted-foreground size-4' />
            <span className='text-sm font-medium'>Filters</span>
            {isFiltered && (
              <Button className='ml-auto' size='sm' variant='ghost' onClick={reset}>
                <X className='size-3' /> Clear
              </Button>
            )}
          </div>

          <Facet label='Category'>
            <CategoryList value={params.category} onSelect={(v) => setFilter('category', v)} />
          </Facet>
          <Separator />
          <Facet label='Brand'>
            <BrandList value={params.brands} onSelect={(v) => setFilter('brands', v)} />
          </Facet>
          <Separator />
          <Facet label='Price'>
            <PriceRange value={params.price} onSelect={(v) => setFilter('price', v)} />
          </Facet>
          <Separator />
          <label className='flex items-center gap-2 text-sm'>
            <Checkbox
              checked={params.in_stock === true}
              onCheckedChange={(checked) => setFilter('in_stock', checked ? true : null)}
            />
            In stock only
          </label>
        </aside>

        {/* Results */}
        {results.length > 0 ? (
          <div className='grid grid-cols-2 content-start gap-4 lg:grid-cols-3'>
            {results.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        ) : (
          <div className='text-muted-foreground flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-16 text-sm'>
            No products match these filters.
            <Button size='sm' variant='outline' onClick={reset}>
              Clear filters
            </Button>
          </div>
        )}
      </div>

      {/* Mobile facet drawer: edits stage against the manual-commit filters,
          "Show N results" applies them, dismissing cancels them. */}
      <Drawer open={openFacet !== null} onOpenChange={(open) => !open && closeDrawer(false)}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{openFacet ? facetTitles[openFacet] : ''}</DrawerTitle>
          </DrawerHeader>
          <div className='overflow-y-auto px-4 pb-2'>
            {openFacet === 'sort' && (
              <SortList value={filterMap.sort.value} onSelect={filterMap.sort.onChange} />
            )}
            {openFacet === 'category' && (
              <CategoryList
                value={filterMap.category.value}
                onSelect={filterMap.category.onChange}
              />
            )}
            {openFacet === 'brands' && (
              <BrandList value={filterMap.brands.value} onSelect={filterMap.brands.onChange} />
            )}
            {openFacet === 'price' && (
              <PriceRange value={filterMap.price.value} onSelect={filterMap.price.onChange} />
            )}
          </div>
          <DrawerFooter>
            <Button onClick={() => closeDrawer(true)}>
              Show {draftCount} {draftCount === 1 ? 'result' : 'results'}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
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

/* ---------------------------------------------------------------------------
 * Facet editors — plain value-in/value-out, so the sidebar can apply
 * instantly (`setFilter`) while the drawer stages (`onChange`).
 * ------------------------------------------------------------------------- */

function CategoryList({
  onSelect,
  value
}: {
  onSelect: (value: string | null) => void;
  value: string | null;
}) {
  return (
    <div className='flex flex-col gap-1'>
      {categoryOptions.map((c) => {
        const active = value === c.value;
        return (
          <button
            key={c.value}
            className={cn(
              'rounded-md px-2 py-1.5 text-left text-sm transition-colors',
              active
                ? 'bg-primary/10 text-primary font-medium'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
            type='button'
            onClick={() => onSelect(active ? null : c.value)}
          >
            {c.label}
          </button>
        );
      })}
    </div>
  );
}

function BrandList({
  onSelect,
  value
}: {
  onSelect: (value: string[] | null) => void;
  value: string[] | null;
}) {
  const selected = value ?? [];
  return (
    <div className='flex flex-col gap-2.5'>
      {brandOptions.map((b) => (
        <label key={b.value} className='flex items-center gap-2 text-sm'>
          <Checkbox
            checked={selected.includes(b.value)}
            onCheckedChange={(checked) => {
              const next = checked ? [...selected, b.value] : selected.filter((x) => x !== b.value);
              onSelect(next.length ? next : null);
            }}
          />
          {b.label}
        </label>
      ))}
    </div>
  );
}

function PriceRange({
  onSelect,
  value
}: {
  onSelect: (value: [number, number] | null) => void;
  value: [number, number] | null;
}) {
  const price = value ?? priceBounds;
  return (
    <div className='px-1 py-2'>
      <Slider
        max={priceBounds[1]}
        min={priceBounds[0]}
        step={10}
        value={price}
        onValueChange={([lo, hi]) =>
          onSelect(
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

function SortList({
  onSelect,
  value
}: {
  onSelect: (value: string | null) => void;
  value: string | null;
}) {
  const current = value ?? 'featured';
  return (
    <div className='flex flex-col gap-1'>
      {sortOptions.map((option) => (
        <button
          key={option.value}
          className={cn(
            'rounded-md px-2 py-1.5 text-left text-sm transition-colors',
            option.value === current
              ? 'bg-primary/10 text-primary font-medium'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          )}
          type='button'
          onClick={() => onSelect(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

/** A pill in the mobile filter row. Active chips show their value and an ×. */
function FacetChip({
  active,
  icon,
  label,
  onClear,
  onOpen
}: {
  active: boolean;
  icon?: React.ReactNode;
  label: string;
  onClear?: () => void;
  onOpen: () => void;
}) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center overflow-hidden rounded-full border text-sm transition-colors',
        active ? 'border-primary/40 bg-primary/10 text-primary' : 'text-foreground'
      )}
    >
      <button
        className={cn('flex items-center gap-1.5 py-1.5 pl-3', onClear && active ? 'pr-1' : 'pr-3')}
        type='button'
        onClick={onOpen}
      >
        {icon}
        {label}
      </button>
      {onClear && active && (
        <button
          aria-label={`Clear ${label}`}
          className='py-1.5 pr-2.5 pl-1'
          type='button'
          onClick={onClear}
        >
          <X className='size-3.5' />
        </button>
      )}
    </span>
  );
}

const Facet = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className='flex flex-col gap-2'>
    <Label className='text-muted-foreground text-xs tracking-wide uppercase'>{label}</Label>
    {children}
  </div>
);

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
