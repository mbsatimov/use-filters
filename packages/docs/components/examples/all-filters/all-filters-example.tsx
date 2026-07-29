'use client';

import { f, useFilters } from '@mbsatimov/use-filters';
import { ChevronLeft, ChevronRight } from 'lucide-react';
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
import { FilterBar } from '@/components/filters/filter-bar/filter-bar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
 * Every filter type on one `<FilterBar>`.
 *
 * The whole screen hangs off this config: the text filter renders inline, the
 * rest live behind the add-filter index, and each active filter becomes an
 * editable chip. That includes the server-searched customer picker and the
 * manual-commit ranges — staged edits get an Apply/Cancel footer in their
 * editor, and dismissing the popover discards them.
 */
export function AllFiltersExample() {
  const { filters, params, paramsStr, isFiltered, instantReset, setFilter } = useFilters({
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

    // Manual commit: edits stage inside the editor until its Apply button.
    amount: f.numberRange({ label: 'Amount', commit: 'manual' }),
    date: f.dateRange({ label: 'Date', commit: 'manual' }),

    min_items: f.number({ label: 'Min items', precision: 'int', placeholder: 'At least…' }),

    // In `params`, out of the bar — the sort dropdown owns this one.
    ordering: f.text({ label: 'Sort', hidden: true, defaultValue: '-date' })
  });

  const [, setPage] = useQueryState('page', parseAsInteger.withDefault(1));
  const { data, isFetching, isLoading } = useQuery(paramsStr, (signal) =>
    fetchOrders(params, { signal })
  );

  const count = data?.count ?? 0;
  const pageCount = Math.max(1, Math.ceil(count / params.per_page));

  return (
    <div className='flex flex-col gap-3'>
      <FilterBar filters={filters} isFiltered={isFiltered} reset={instantReset}>
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
      </FilterBar>

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
