'use client';

import { f, useFilters } from '@mbsatimov/use-filters';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { parseAsInteger, useQueryState } from 'nuqs';

import type { OrderStatus } from '@/components/examples/data/orders';

import {
  fetchOrders,
  methodOptions,
  regionOptions,
  searchCustomers,
  sortOptions,
  statusOptions
} from '@/components/examples/data/orders';
import { useQuery } from '@/components/examples/data/use-query';
import { FilterChips } from '@/components/examples/filter-menu/filter-chips';
import { FilterMenu } from '@/components/examples/filter-menu/filter-menu';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

/**
 * The config-driven pattern: the whole screen hangs off one `useFilters` call.
 *
 * `<FilterMenu>` and `<FilterChips>` render from the `filters` array with a
 * `switch` on each filter's type — they don't know this is an orders screen.
 * Add a filter to the config below and it shows up in the menu, summarizes
 * itself as a chip, and lands in `params` for the fetch. That includes the
 * server-searched customer picker and the manual-commit ranges.
 */
export function FilterMenuExample() {
  const { filters, filterMap, params, paramsStr, instantReset, setFilter } = useFilters({
    search: f.text({
      label: 'Search',
      placeholder: 'Order, customer, email…',
      commit: { debounce: 300 }
    }),
    status: f.multiSelect({ label: 'Status', valueType: 'string', options: statusOptions }),
    method: f.multiSelect({ label: 'Method', valueType: 'string', options: methodOptions }),
    region: f.multiSelect({ label: 'Region', valueType: 'string', options: regionOptions }),

    // Server-searched: the chosen label is kept in the URL beside the value,
    // so the chip still renders after a refresh without refetching.
    customer: f.asyncSelect({
      label: 'Customer',
      valueType: 'string',
      searchDebounceMs: 250,
      loadOptions: (search, signal) => searchCustomers(search, signal)
    }),

    // Manual commit: dragging a range around inside the menu stages a draft;
    // the URL (and the fetch) only see it on Apply.
    amount: f.numberRange({ label: 'Amount', commit: 'manual' }),
    date: f.dateRange({ label: 'Date', commit: 'manual' }),

    min_items: f.number({ label: 'Min items', precision: 'int', placeholder: 'At least…' }),

    // In `params`, out of the menu — the sort dropdown owns this one.
    ordering: f.text({ label: 'Sort', hidden: true, defaultValue: '-date' })
  });

  const [, setPage] = useQueryState('page', parseAsInteger.withDefault(1));
  const { data, isFetching, isLoading } = useQuery(paramsStr, (signal) =>
    fetchOrders(params, { signal })
  );

  // The search box renders inline; everything else lives behind the menu.
  const menuFilters = filters.filter((filter) => filter.key !== 'search');

  const count = data?.count ?? 0;
  const pageCount = Math.max(1, Math.ceil(count / params.per_page));

  return (
    <div className='flex flex-col gap-3'>
      {/* Toolbar */}
      <div className='flex flex-wrap items-center gap-2'>
        <div className='relative w-full sm:w-64'>
          <Search className='text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2' />
          <Input
            className='pl-9'
            placeholder='Order, customer, email…'
            value={filterMap.search.value ?? ''}
            onChange={(e) => filterMap.search.onChange(e.target.value || null)}
          />
        </div>
        <FilterMenu filters={menuFilters} />
        <div className='ml-auto'>
          <Select
            value={params.ordering ?? '-date'}
            onValueChange={(value) => setFilter('ordering', value)}
          >
            <SelectTrigger className='w-44'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <FilterChips filters={filters} onReset={instantReset} />

      {/* Results */}
      <div
        className={cn(
          'overflow-x-auto rounded-lg border transition-opacity',
          isFetching && !isLoading && 'opacity-60'
        )}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className='text-right'>Items</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className='text-right'>Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell className='text-muted-foreground h-32 text-center' colSpan={6}>
                  Loading orders…
                </TableCell>
              </TableRow>
            )}
            {!isLoading && data?.results.length === 0 && (
              <TableRow>
                <TableCell className='text-muted-foreground h-32 text-center' colSpan={6}>
                  No orders match these filters.
                </TableCell>
              </TableRow>
            )}
            {data?.results.map((order) => (
              <TableRow key={order.id}>
                <TableCell className='font-mono text-xs'>{order.id}</TableCell>
                <TableCell>
                  <div className='font-medium'>{order.customer}</div>
                  <div className='text-muted-foreground text-xs'>{order.email}</div>
                </TableCell>
                <TableCell>
                  <StatusBadge status={order.status} />
                </TableCell>
                <TableCell className='text-right tabular-nums'>{order.items}</TableCell>
                <TableCell className='tabular-nums'>{order.date}</TableCell>
                <TableCell className='text-right font-medium tabular-nums'>
                  {currency.format(order.amount)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className='text-muted-foreground flex items-center justify-between text-sm'>
        <span>
          {count} {count === 1 ? 'order' : 'orders'}
        </span>
        <div className='flex items-center gap-2'>
          <span className='tabular-nums'>
            Page {params.page} of {pageCount}
          </span>
          <Button
            disabled={params.page <= 1}
            size='icon-sm'
            variant='outline'
            onClick={() => void setPage(params.page - 1)}
          >
            <ChevronLeft />
          </Button>
          <Button
            disabled={params.page >= pageCount}
            size='icon-sm'
            variant='outline'
            onClick={() => void setPage(params.page + 1)}
          >
            <ChevronRight />
          </Button>
        </div>
      </div>
    </div>
  );
}

const currency = new Intl.NumberFormat('en-US', {
  currency: 'USD',
  maximumFractionDigits: 0,
  style: 'currency'
});

const statusStyles: Record<OrderStatus, string> = {
  failed: 'bg-red-500/10 text-red-600 dark:text-red-400',
  paid: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  pending: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  refunded: 'bg-slate-500/10 text-slate-600 dark:text-slate-400'
};

function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <Badge className={cn('border-transparent capitalize', statusStyles[status])} variant='outline'>
      {status}
    </Badge>
  );
}
