'use client';

import { f, useFilters } from '@mbsatimov/use-filters';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { parseAsInteger, useQueryState } from 'nuqs';

import { DemoWindow } from '@/components/demo-window';
import { JsonPreview } from '@/components/json-preview';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

const PER_PAGE = 5;

const statusOptions = [
  { label: 'Open', value: 'open' },
  { label: 'Closed', value: 'closed' }
];

const tickets = Array.from({ length: 23 }, (_, i) => ({
  id: 1040 + i,
  status: i % 3 === 0 ? 'closed' : 'open'
}));

const Inner = () => {
  const { params, filterMap } = useFilters(
    { status: f.select({ label: 'Status', valueType: 'string', options: statusOptions }) },
    { pagination: { defaultPerPage: PER_PAGE } }
  );
  // The hook keeps the page in the URL and in params; the pager writes it.
  const [, setPage] = useQueryState('page', parseAsInteger.withDefault(1));
  const [, setPerPage] = useQueryState('per_page', parseAsInteger.withDefault(PER_PAGE));

  const matching = tickets.filter((ticket) => !params.status || ticket.status === params.status);
  const pageCount = Math.max(1, Math.ceil(matching.length / params.per_page));
  const page = Math.min(params.page, pageCount);
  const rows = matching.slice((page - 1) * params.per_page, page * params.per_page);

  return (
    <div className='grid gap-4 sm:grid-cols-2'>
      <div className='flex flex-col gap-3'>
        <Select
          value={filterMap.status.value ?? 'all'}
          onValueChange={(value) => filterMap.status.onChange(value === 'all' ? null : value)}
        >
          <SelectTrigger className='w-full'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>Any status</SelectItem>
            {statusOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <ul className='divide-y rounded-lg border text-sm'>
          {rows.map((ticket) => (
            <li key={ticket.id} className='flex items-center justify-between px-3 py-2'>
              <span className='font-mono text-xs'>#{ticket.id}</span>
              <span className='text-muted-foreground capitalize'>{ticket.status}</span>
            </li>
          ))}
        </ul>

        <div className='flex items-center justify-between gap-2 text-sm'>
          <Select
            value={String(params.per_page)}
            onValueChange={(value) => {
              void setPerPage(Number(value));
              void setPage(1);
            }}
          >
            <SelectTrigger aria-label='Rows per page' className='w-20' size='sm'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[5, 10].map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className='text-muted-foreground tabular-nums'>
            Page {page} of {pageCount}
          </span>
          <div className='flex gap-1'>
            <Button
              aria-label='Previous page'
              disabled={page <= 1}
              size='icon-sm'
              variant='outline'
              onClick={() => void setPage(page - 1)}
            >
              <ChevronLeft />
            </Button>
            <Button
              aria-label='Next page'
              disabled={page >= pageCount}
              size='icon-sm'
              variant='outline'
              onClick={() => void setPage(page + 1)}
            >
              <ChevronRight />
            </Button>
          </div>
        </div>
      </div>
      <JsonPreview value={params} />
    </div>
  );
};

export const PaginationDemo = () => (
  <DemoWindow path='/tickets'>
    <Inner />
  </DemoWindow>
);
