'use client';

import { f, useFilters } from '@mbsatimov/use-filters';
import { ArrowDown, ArrowUp, ChevronsUpDown, Search, Settings2, X } from 'lucide-react';
import { parseAsInteger, useQueryStates } from 'nuqs';
import { useState } from 'react';

import type { Order, OrderStatus } from '@/components/examples/data/orders';

import { DateRangeFilter } from '@/components/examples/data-table/date-range-filter';
import { FacetedFilter } from '@/components/examples/data-table/faceted-filter';
import {
  fetchOrders,
  initials,
  methodOptions,
  regionOptions,
  statusOptions
} from '@/components/examples/data/orders';
import { useQuery } from '@/components/examples/data/use-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
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
 * An admin data table where every piece of table state — search, facets, date
 * range, sort, page, page size — lives in the URL. Copy the current address and
 * a teammate opens the exact same view.
 *
 * Sorting is a hidden filter: it rides along in `params` without rendering a
 * control, and the column headers write it through `setFilter`.
 */

/** Columns the visibility menu can hide. Order matches the table. */
const columns = [
  { id: 'customer', label: 'Customer' },
  { id: 'status', label: 'Status' },
  { id: 'method', label: 'Method' },
  { id: 'region', label: 'Region' },
  { id: 'items', label: 'Items' },
  { id: 'date', label: 'Date' },
  { id: 'amount', label: 'Amount' }
] as const;

type ColumnId = (typeof columns)[number]['id'];

const PER_PAGE_OPTIONS = [10, 25, 50];

export function DataTableExample() {
  const { filterMap, params, paramsStr, isFiltered, instantReset, setFilter } = useFilters({
    search: f.text({ label: 'Search', placeholder: 'Filter orders…', commit: { debounce: 300 } }),
    status: f.multiSelect({ label: 'Status', valueType: 'string', options: statusOptions }),
    method: f.multiSelect({ label: 'Method', valueType: 'string', options: methodOptions }),
    region: f.multiSelect({ label: 'Region', valueType: 'string', options: regionOptions }),
    date: f.dateRange({ label: 'Date' }),
    // In `params`, never in the toolbar — the column headers own this one.
    ordering: f.text({ label: 'Sort', hidden: true, defaultValue: '-date' })
  });

  // `useFilters` reads page/per_page into `params`; writing them stays in the
  // app. Changing the page size returns to the first page in the same URL write.
  const [, setPagination] = useQueryStates({
    page: parseAsInteger.withDefault(1),
    per_page: parseAsInteger.withDefault(10)
  });

  const [hiddenColumns, setHiddenColumns] = useState<ReadonlySet<ColumnId>>(() => new Set());
  const isVisible = (id: ColumnId) => !hiddenColumns.has(id);

  const { data, isFetching, isLoading } = useQuery(paramsStr, (signal) =>
    fetchOrders(params, { signal })
  );

  const count = data?.count ?? 0;
  const pageCount = Math.max(1, Math.ceil(count / params.per_page));
  const visibleCount = 1 + columns.filter((column) => isVisible(column.id)).length;

  const sortBy = (field: string) => {
    // First click sorts descending, second flips, matching most admin tables.
    const next = params.ordering === `-${field}` ? field : `-${field}`;
    setFilter('ordering', next);
  };

  return (
    <div className='flex flex-col gap-3'>
      {/* Toolbar */}
      <div className='flex flex-wrap items-center gap-2'>
        <div className='relative w-full sm:w-56'>
          <Search className='text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2' />
          <Input
            className='h-7 pl-8 text-[0.8rem]'
            placeholder='Filter orders…'
            value={filterMap.search.value ?? ''}
            onChange={(e) => filterMap.search.onChange(e.target.value || null)}
          />
        </div>
        <FacetedFilter filter={filterMap.status} />
        <FacetedFilter filter={filterMap.method} />
        <FacetedFilter filter={filterMap.region} />
        <DateRangeFilter filter={filterMap.date} />
        {isFiltered && (
          <Button size='sm' variant='ghost' onClick={instantReset}>
            Reset <X className='size-3.5' />
          </Button>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className='ml-auto' size='sm' variant='outline'>
              <Settings2 className='size-3.5' /> View
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end' className='w-40'>
            <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {columns.map((column) => (
              <DropdownMenuCheckboxItem
                key={column.id}
                checked={isVisible(column.id)}
                onCheckedChange={(checked) =>
                  setHiddenColumns((previous) => {
                    const next = new Set(previous);
                    if (checked) next.delete(column.id);
                    else next.add(column.id);
                    return next;
                  })
                }
              >
                {column.label}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Table */}
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
              {isVisible('customer') && <TableHead>Customer</TableHead>}
              {isVisible('status') && <TableHead>Status</TableHead>}
              {isVisible('method') && <TableHead>Method</TableHead>}
              {isVisible('region') && <TableHead>Region</TableHead>}
              {isVisible('items') && (
                <SortableHead
                  align='right'
                  field='items'
                  label='Items'
                  ordering={params.ordering}
                  onSort={sortBy}
                />
              )}
              {isVisible('date') && (
                <SortableHead
                  field='date'
                  label='Date'
                  ordering={params.ordering}
                  onSort={sortBy}
                />
              )}
              {isVisible('amount') && (
                <SortableHead
                  align='right'
                  field='amount'
                  label='Amount'
                  ordering={params.ordering}
                  onSort={sortBy}
                />
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell
                  className='text-muted-foreground h-32 text-center'
                  colSpan={visibleCount}
                >
                  Loading orders…
                </TableCell>
              </TableRow>
            )}
            {!isLoading && data?.results.length === 0 && (
              <TableRow>
                <TableCell
                  className='text-muted-foreground h-32 text-center'
                  colSpan={visibleCount}
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
            {data?.results.map((order) => (
              <OrderRow key={order.id} isVisible={isVisible} order={order} />
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <span className='text-muted-foreground text-sm'>
          {count} {count === 1 ? 'row' : 'rows'}
        </span>
        <div className='flex items-center gap-4'>
          <div className='flex items-center gap-2 text-sm'>
            <span className='text-muted-foreground'>Rows per page</span>
            <Select
              value={String(params.per_page)}
              onValueChange={(value) => void setPagination({ per_page: Number(value), page: null })}
            >
              <SelectTrigger className='h-7 w-[4.5rem]' size='sm'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PER_PAGE_OPTIONS.map((option) => (
                  <SelectItem key={option} value={String(option)}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <span className='text-muted-foreground text-sm tabular-nums'>
            Page {params.page} of {pageCount}
          </span>
          <div className='flex items-center gap-1'>
            <Button
              disabled={params.page <= 1}
              size='sm'
              variant='outline'
              onClick={() => void setPagination({ page: params.page - 1 })}
            >
              Previous
            </Button>
            <Button
              disabled={params.page >= pageCount}
              size='sm'
              variant='outline'
              onClick={() => void setPagination({ page: params.page + 1 })}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/** A header cell that sorts its column via the `ordering` param. */
function SortableHead({
  align,
  field,
  label,
  onSort,
  ordering
}: {
  align?: 'right';
  field: string;
  label: string;
  onSort: (field: string) => void;
  ordering: string | null;
}) {
  const direction = ordering === field ? 'asc' : ordering === `-${field}` ? 'desc' : null;
  const Icon = direction === 'asc' ? ArrowUp : direction === 'desc' ? ArrowDown : ChevronsUpDown;

  return (
    <TableHead className={align === 'right' ? 'text-right' : undefined}>
      <button
        className={cn(
          'hover:text-foreground inline-flex items-center gap-1',
          direction && 'text-foreground'
        )}
        type='button'
        onClick={() => onSort(field)}
      >
        {label}
        <Icon className='size-3.5' />
      </button>
    </TableHead>
  );
}

function OrderRow({ isVisible, order }: { isVisible: (id: ColumnId) => boolean; order: Order }) {
  return (
    <TableRow>
      <TableCell className='font-mono text-xs'>{order.id}</TableCell>
      {isVisible('customer') && (
        <TableCell>
          <div className='flex items-center gap-2'>
            <span className='bg-muted text-muted-foreground flex size-7 shrink-0 items-center justify-center rounded-full text-[0.65rem] font-medium'>
              {initials(order.customer)}
            </span>
            <div className='min-w-0'>
              <div className='truncate font-medium'>{order.customer}</div>
              <div className='text-muted-foreground truncate text-xs'>{order.email}</div>
            </div>
          </div>
        </TableCell>
      )}
      {isVisible('status') && (
        <TableCell>
          <StatusBadge status={order.status} />
        </TableCell>
      )}
      {isVisible('method') && (
        <TableCell className='capitalize'>
          {methodOptions.find((option) => option.value === order.method)?.label}
        </TableCell>
      )}
      {isVisible('region') && (
        <TableCell>
          {regionOptions.find((option) => option.value === order.region)?.label}
        </TableCell>
      )}
      {isVisible('items') && (
        <TableCell className='text-right tabular-nums'>{order.items}</TableCell>
      )}
      {isVisible('date') && <TableCell className='tabular-nums'>{order.date}</TableCell>}
      {isVisible('amount') && (
        <TableCell className='text-right font-medium tabular-nums'>
          {currency.format(order.amount)}
        </TableCell>
      )}
    </TableRow>
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
