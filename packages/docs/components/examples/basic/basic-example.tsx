'use client';

import { f, useFilters } from '@mbsatimov/use-filters';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { parseAsInteger, useQueryState } from 'nuqs';

import type { OrderStatus } from '@/components/examples/data/orders';

import { fetchOrders, statusOptions } from '@/components/examples/data/orders';
import { useQuery } from '@/components/examples/data/use-query';
import { MultiSelectFilter } from '@/components/filters/filter-controls/multi-select-filter';
import { TextFilter } from '@/components/filters/filter-controls/text-filter';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
 * The starting point: a search box, a status filter, and a paginated table,
 * composed by hand from standalone filter controls.
 *
 * Each control takes one entry from `filterMap` and owns only itself — no
 * orchestration, no auto-appearing reset. The config produces URL-synced
 * state, `params` goes to the backend as-is, and `paramsStr` keys the fetch
 * so it re-runs exactly when a committed value changes.
 */
export function BasicExample() {
  const { filterMap, params, paramsStr, isFiltered, instantReset } = useFilters({
    // Debounced, so typing doesn't refetch on every keystroke.
    search: f.text({ label: 'Search', placeholder: 'Search orders…', commit: { debounce: 300 } }),
    status: f.multiSelect({ label: 'Status', valueType: 'string', options: statusOptions })
  });

  // `useFilters` reads the page for `params`; writing it stays in the app.
  const [, setPage] = useQueryState('page', parseAsInteger.withDefault(1));
  const { data, isFetching, isLoading } = useQuery(paramsStr, (signal) =>
    fetchOrders(params, { signal })
  );

  const count = data?.count ?? 0;
  const pageCount = Math.max(1, Math.ceil(count / params.per_page));

  return (
    <div className='flex flex-col gap-4'>
      <div className='flex flex-wrap items-center gap-2'>
        <TextFilter filter={filterMap.search} />
        <MultiSelectFilter filter={filterMap.status} />
        {isFiltered && (
          <Button size='sm' variant='ghost' onClick={instantReset}>
            <X className='size-3.5' /> Clear
          </Button>
        )}
      </div>

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
              <TableHead>Date</TableHead>
              <TableHead className='text-right'>Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell className='text-muted-foreground h-32 text-center' colSpan={5}>
                  Loading orders…
                </TableCell>
              </TableRow>
            )}
            {!isLoading && data?.results.length === 0 && (
              <TableRow>
                <TableCell className='text-muted-foreground h-32 text-center' colSpan={5}>
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
