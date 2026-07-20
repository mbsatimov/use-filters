'use client';

import { f, useFilters } from '@mbsatimov/use-filters';
import { ChevronLeft, ChevronRight, Columns3, X } from 'lucide-react';
import { parseAsInteger, useQueryState } from 'nuqs';
import { type ReactNode, useMemo, useState } from 'react';

import { Badge } from '@/components/examples/ui/badge';
import { Button } from '@/components/examples/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/examples/ui/dropdown-menu';
import { Input } from '@/components/examples/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/examples/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/examples/ui/table';
import {
  type Order,
  type OrderStatus,
  orders,
  statusOptions
} from '@/components/examples/data-table/orders';

interface Column {
  id: string;
  header: string;
  cell: (o: Order) => ReactNode;
  align?: 'right';
}

const columns: Column[] = [
  { id: 'id', header: 'Order', cell: (o) => <span className='font-mono text-xs'>{o.id}</span> },
  {
    id: 'customer',
    header: 'Customer',
    cell: (o) => (
      <div className='flex flex-col'>
        <span className='font-medium'>{o.customer}</span>
        <span className='text-muted-foreground text-xs'>{o.email}</span>
      </div>
    )
  },
  { id: 'status', header: 'Status', cell: (o) => <StatusBadge status={o.status} /> },
  { id: 'date', header: 'Date', cell: (o) => <span className='tabular-nums'>{o.date}</span> },
  {
    id: 'amount',
    header: 'Amount',
    align: 'right',
    cell: (o) => <span className='tabular-nums font-medium'>${o.amount}</span>
  }
];

export function DataTable() {
  const { params, filterMap, isFiltered, reset } = useFilters(
    {
      q: f.text({ label: 'Search', commit: { debounce: 300 } }),
      status: f.select({ label: 'Status', valueType: 'string', options: statusOptions }),
      period: f.dateRange({ label: 'Date' })
    },
    { pagination: { defaultPerPage: 8 } }
  );

  // useFilters owns `page` (it resets to 1 on any filter change). Drive the
  // pager itself with nuqs directly — the library doesn't set the page for you.
  const [, setPage] = useQueryState('page', parseAsInteger.withDefault(1));

  const [hidden, setHidden] = useState<Record<string, boolean>>({});
  const visibleColumns = columns.filter((c) => !hidden[c.id]);

  const filtered = useMemo(() => {
    const q = params.q?.toLowerCase().trim();
    const [from, to] = params.period ?? ['', ''];
    return orders.filter((o) => {
      if (q && !`${o.customer} ${o.email} ${o.id}`.toLowerCase().includes(q)) return false;
      if (params.status && o.status !== params.status) return false;
      if (from && o.date < from) return false;
      if (to && o.date > to) return false;
      return true;
    });
  }, [params]);

  const total = filtered.length;
  const pageCount = Math.max(1, Math.ceil(total / params.per_page));
  const page = Math.min(params.page, pageCount);
  const start = (page - 1) * params.per_page;
  const rows = filtered.slice(start, start + params.per_page);

  const [from, to] = filterMap.period.value ?? ['', ''];
  const setRange = (nextFrom: string, nextTo: string) =>
    filterMap.period.onChange(nextFrom || nextTo ? [nextFrom, nextTo] : null);

  return (
    <div className='flex flex-col gap-4'>
      {/* Toolbar */}
      <div className='flex flex-wrap items-center gap-2'>
        <Input
          placeholder='Search orders…'
          value={filterMap.q.value ?? ''}
          onChange={(e) => filterMap.q.onChange(e.target.value || null)}
          className='h-9 w-full sm:w-56'
        />
        <Select
          value={filterMap.status.value ?? 'all'}
          onValueChange={(v) => filterMap.status.onChange(v === 'all' ? null : v)}
        >
          <SelectTrigger className='h-9 w-[140px]'>
            <SelectValue placeholder='Status' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All statuses</SelectItem>
            {statusOptions.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          type='date'
          aria-label='From'
          value={from}
          onChange={(e) => setRange(e.target.value, to)}
          className='h-9 w-[150px]'
        />
        <Input
          type='date'
          aria-label='To'
          value={to}
          onChange={(e) => setRange(from, e.target.value)}
          className='h-9 w-[150px]'
        />
        {isFiltered && (
          <Button variant='ghost' size='sm' className='h-9' onClick={reset}>
            <X className='size-4' /> Reset
          </Button>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant='outline' size='sm' className='ml-auto h-9'>
              <Columns3 className='size-4' /> Columns
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end'>
            <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {columns.map((c) => (
              <DropdownMenuCheckboxItem
                key={c.id}
                checked={!hidden[c.id]}
                onCheckedChange={(checked) => setHidden((h) => ({ ...h, [c.id]: !checked }))}
              >
                {c.header}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Table */}
      <div className='overflow-hidden rounded-lg border'>
        <Table>
          <TableHeader>
            <TableRow>
              {visibleColumns.map((c) => (
                <TableHead key={c.id} className={c.align === 'right' ? 'text-right' : undefined}>
                  {c.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length > 0 ? (
              rows.map((o) => (
                <TableRow key={o.id}>
                  {visibleColumns.map((c) => (
                    <TableCell
                      key={c.id}
                      className={c.align === 'right' ? 'text-right' : undefined}
                    >
                      {c.cell(o)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={visibleColumns.length}
                  className='text-muted-foreground h-24 text-center'
                >
                  No orders match these filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className='flex items-center justify-between text-sm'>
        <span className='text-muted-foreground'>
          {total === 0 ? 0 : start + 1}–{Math.min(start + params.per_page, total)} of {total}
        </span>
        <div className='flex items-center gap-2'>
          <span className='text-muted-foreground'>
            Page {page} of {pageCount}
          </span>
          <Button
            variant='outline'
            size='icon'
            className='size-8'
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
            aria-label='Previous page'
          >
            <ChevronLeft className='size-4' />
          </Button>
          <Button
            variant='outline'
            size='icon'
            className='size-8'
            disabled={page >= pageCount}
            onClick={() => setPage(page + 1)}
            aria-label='Next page'
          >
            <ChevronRight className='size-4' />
          </Button>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: OrderStatus }) {
  const styles: Record<OrderStatus, string> = {
    paid: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
    pending: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
    refunded: 'bg-muted text-muted-foreground',
    failed: 'bg-red-500/15 text-red-600 dark:text-red-400'
  };
  return (
    <Badge variant='secondary' className={`border-transparent capitalize ${styles[status]}`}>
      {status}
    </Badge>
  );
}
