'use client';

import { f, useFilters } from '@mbsatimov/use-filters';
import { SlidersHorizontal, Star, X } from 'lucide-react';
import { useMemo } from 'react';

import { Badge } from '@/components/examples/ui/badge';
import { Button } from '@/components/examples/ui/button';
import { Checkbox } from '@/components/examples/ui/checkbox';
import { Input } from '@/components/examples/ui/input';
import { Label } from '@/components/examples/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/examples/ui/select';
import { Separator } from '@/components/examples/ui/separator';
import { Slider } from '@/components/examples/ui/slider';
import {
  brandOptions,
  categoryOptions,
  priceBounds,
  products,
  sortOptions
} from '@/components/examples/marketplace/products';

export function Marketplace() {
  const { params, filterMap, isFiltered, reset } = useFilters(
    {
      q: f.text({ label: 'Search', commit: { debounce: 300 } }),
      category: f.select({ label: 'Category', valueType: 'string', options: categoryOptions }),
      brands: f.multiSelect({ label: 'Brands', valueType: 'string', options: brandOptions }),
      price: f.numberRange({ label: 'Price' }),
      in_stock: f.boolean({ label: 'In stock' }),
      sort: f.select({
        label: 'Sort',
        valueType: 'string',
        options: sortOptions,
        defaultValue: 'featured'
      })
    },
    { pagination: false }
  );

  // `params` is the committed state — filter and sort the catalog from it.
  const results = useMemo(() => {
    const q = params.q?.toLowerCase().trim();
    let list = products.filter((p) => {
      if (q && !`${p.name} ${p.brand}`.toLowerCase().includes(q)) return false;
      if (params.category && p.category !== params.category) return false;
      if (params.brands?.length && !params.brands.includes(p.brand)) return false;
      if (params.price && (p.price < params.price[0] || p.price > params.price[1])) return false;
      if (params.in_stock && !p.inStock) return false;
      return true;
    });
    if (params.sort === 'price-asc') list = [...list].sort((a, b) => a.price - b.price);
    if (params.sort === 'price-desc') list = [...list].sort((a, b) => b.price - a.price);
    if (params.sort === 'rating') list = [...list].sort((a, b) => b.rating - a.rating);
    return list;
  }, [params]);

  const price = filterMap.price.value ?? priceBounds;
  const selectedBrands = filterMap.brands.value ?? [];

  return (
    <div className='flex flex-col gap-4'>
      {/* Toolbar: search + sort */}
      <div className='flex flex-col gap-3 sm:flex-row sm:items-center'>
        <Input
          placeholder='Search products…'
          value={filterMap.q.value ?? ''}
          onChange={(e) => filterMap.q.onChange(e.target.value || null)}
          className='sm:max-w-xs'
        />
        <div className='flex items-center gap-2 sm:ml-auto'>
          <span className='text-muted-foreground text-sm whitespace-nowrap'>
            {results.length} {results.length === 1 ? 'result' : 'results'}
          </span>
          <Select
            value={filterMap.sort.value ?? 'featured'}
            onValueChange={(v) => filterMap.sort.onChange(v as typeof params.sort)}
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
        </div>
      </div>

      <div className='grid grid-cols-1 gap-6 md:grid-cols-[220px_1fr]'>
        {/* Facets */}
        <aside className='flex flex-col gap-5'>
          <div className='flex items-center gap-2'>
            <SlidersHorizontal className='text-muted-foreground size-4' />
            <span className='text-sm font-medium'>Filters</span>
            {isFiltered && (
              <Button
                variant='ghost'
                size='sm'
                className='ml-auto h-7 px-2 text-xs'
                onClick={reset}
              >
                <X className='size-3' /> Clear
              </Button>
            )}
          </div>

          <Facet label='Category'>
            <div className='flex flex-col gap-1'>
              {categoryOptions.map((c) => {
                const active = filterMap.category.value === c.value;
                return (
                  <button
                    key={c.value}
                    type='button'
                    onClick={() => filterMap.category.onChange(active ? null : c.value)}
                    className={
                      'rounded-md px-2 py-1 text-left text-sm transition-colors ' +
                      (active
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground')
                    }
                  >
                    {c.label}
                  </button>
                );
              })}
            </div>
          </Facet>

          <Separator />

          <Facet label='Brand'>
            <div className='flex flex-col gap-2'>
              {brandOptions.map((b) => (
                <label key={b.value} className='flex items-center gap-2 text-sm'>
                  <Checkbox
                    checked={selectedBrands.includes(b.value)}
                    onCheckedChange={(checked) => {
                      const next = checked
                        ? [...selectedBrands, b.value]
                        : selectedBrands.filter((x) => x !== b.value);
                      filterMap.brands.onChange(next.length ? next : null);
                    }}
                  />
                  {b.label}
                </label>
              ))}
            </div>
          </Facet>

          <Separator />

          <Facet label='Price'>
            <Slider
              min={priceBounds[0]}
              max={priceBounds[1]}
              step={10}
              value={price}
              onValueChange={([lo, hi]) =>
                filterMap.price.onChange(
                  lo === priceBounds[0] && hi === priceBounds[1]
                    ? null
                    : ([lo, hi] as [number, number])
                )
              }
            />
            <div className='text-muted-foreground mt-2 flex justify-between text-xs'>
              <span>${price[0]}</span>
              <span>${price[1]}</span>
            </div>
          </Facet>

          <Separator />

          <label className='flex items-center gap-2 text-sm'>
            <Checkbox
              checked={filterMap.in_stock.value === true}
              onCheckedChange={(checked) => filterMap.in_stock.onChange(checked ? true : null)}
            />
            In stock only
          </label>
        </aside>

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
            <Button variant='outline' size='sm' onClick={reset}>
              Clear filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function Facet({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className='flex flex-col gap-2'>
      <Label className='text-muted-foreground text-xs tracking-wide uppercase'>{label}</Label>
      {children}
    </div>
  );
}

function ProductCard({ product: p }: { product: (typeof products)[number] }) {
  return (
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
            <Badge variant='secondary' className='ml-auto text-[10px]'>
              Sold out
            </Badge>
          )}
        </div>
        <div className='mt-1 text-base font-semibold'>${p.price}</div>
      </div>
    </div>
  );
}
