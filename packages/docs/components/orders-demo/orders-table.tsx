'use client';

import { format, parseISO } from 'date-fns';
import { SearchX } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { initials, type Order, type OrderStatus } from '@/lib/orders';
import { cn } from '@/lib/utils';

const statusDot: Record<OrderStatus, string> = {
  paid: 'bg-emerald-500',
  pending: 'bg-amber-500',
  refunded: 'bg-muted-foreground/50',
  failed: 'bg-red-500'
};

/** Narrower columns drop out below their breakpoint so phones stay readable. */
const columns = [
  { key: 'order', header: 'Order', className: 'w-22' },
  { key: 'customer', header: 'Customer' },
  { key: 'status', header: 'Status' },
  { key: 'method', header: 'Method', className: 'hidden md:table-cell' },
  { key: 'region', header: 'Region', className: 'hidden lg:table-cell' },
  { key: 'date', header: 'Date', className: 'hidden sm:table-cell' },
  { key: 'amount', header: 'Amount', className: 'text-right' }
];

export function OrdersTable({
  rows,
  isFiltered,
  onReset
}: {
  rows: Order[];
  isFiltered: boolean;
  onReset: () => void;
}) {
  return (
    <div className='max-h-150 overflow-y-auto rounded-lg border'>
      <Table>
        <TableHeader>
          <TableRow className='sticky top-0 z-2 hover:bg-transparent'>
            {columns.map((column) => (
              <TableHead key={column.key} className={column.className}>
                {column.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length > 0 ? (
            rows.map((order) => <OrderRow key={order.id} order={order} />)
          ) : (
            <TableRow className='hover:bg-transparent'>
              <TableCell colSpan={columns.length} className='h-40'>
                <EmptyState isFiltered={isFiltered} onReset={onReset} />
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

function OrderRow({ order }: { order: Order }) {
  return (
    <TableRow>
      <TableCell className='text-muted-foreground font-mono text-xs'>{order.id}</TableCell>

      <TableCell>
        <div className='flex items-center gap-2.5'>
          <span className='bg-muted text-muted-foreground flex size-7 shrink-0 items-center justify-center rounded-full text-[0.65rem] font-medium'>
            {initials(order.customer)}
          </span>
          <div className='flex min-w-0 flex-col'>
            <span className='truncate font-medium'>{order.customer}</span>
            <span className='text-muted-foreground truncate text-xs'>{order.email}</span>
          </div>
        </div>
      </TableCell>

      <TableCell>
        <span className='flex items-center gap-1.5 capitalize'>
          <span className={cn('size-1.5 rounded-full', statusDot[order.status])} />
          {order.status}
        </span>
      </TableCell>

      <TableCell className='text-muted-foreground hidden capitalize md:table-cell'>
        {order.method}
      </TableCell>

      <TableCell className='text-muted-foreground hidden uppercase lg:table-cell'>
        {order.region}
      </TableCell>

      <TableCell className='text-muted-foreground hidden tabular-nums sm:table-cell'>
        {/* `parseISO` reads the date as local, so the day doesn't shift west of UTC. */}
        {format(parseISO(order.date), 'MMM dd, yyyy')}
      </TableCell>

      <TableCell className='text-right font-medium tabular-nums'>
        ${order.amount.toLocaleString('en-US')}
      </TableCell>
    </TableRow>
  );
}

function EmptyState({ isFiltered, onReset }: { isFiltered: boolean; onReset: () => void }) {
  return (
    <div className='flex flex-col items-center justify-center gap-2 text-center'>
      <SearchX className='text-muted-foreground/60 size-6' />
      <p className='text-sm font-medium'>No orders match these filters</p>
      <p className='text-muted-foreground text-xs'>
        Try widening the range, or clear a filter to see more.
      </p>
      {isFiltered && (
        <Button variant='outline' size='sm' className='mt-1' onClick={onReset}>
          Clear all filters
        </Button>
      )}
    </div>
  );
}
