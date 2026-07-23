'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

import { PER_PAGE_OPTIONS } from '@/components/orders-demo/use-orders';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

export function Pagination({
  total,
  start,
  page,
  pageCount,
  perPage,
  onPageChange,
  onPerPageChange
}: {
  total: number;
  start: number;
  page: number;
  pageCount: number;
  perPage: number;
  onPageChange: (page: number) => void;
  onPerPageChange: (size: number) => void;
}) {
  const shown =
    total === 0 ? 'No results' : `${start + 1}–${Math.min(start + perPage, total)} of ${total}`;

  return (
    <div className='flex items-center justify-between gap-3 text-sm'>
      <span className='text-muted-foreground text-xs tabular-nums'>{shown}</span>

      <div className='flex items-center gap-2'>
        <label className='text-muted-foreground flex items-center gap-1.5 text-xs'>
          <span className='hidden sm:inline'>Rows per page</span>
          <Select value={String(perPage)} onValueChange={(value) => onPerPageChange(Number(value))}>
            <SelectTrigger size='sm' className='h-8 w-[68px]'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PER_PAGE_OPTIONS.map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>

        <span className='text-muted-foreground text-xs tabular-nums'>
          Page {page} of {pageCount}
        </span>

        <Button
          variant='outline'
          size='icon'
          className='size-8'
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          aria-label='Previous page'
        >
          <ChevronLeft className='size-4' />
        </Button>
        <Button
          variant='outline'
          size='icon'
          className='size-8'
          disabled={page >= pageCount}
          onClick={() => onPageChange(page + 1)}
          aria-label='Next page'
        >
          <ChevronRight className='size-4' />
        </Button>
      </div>
    </div>
  );
}
