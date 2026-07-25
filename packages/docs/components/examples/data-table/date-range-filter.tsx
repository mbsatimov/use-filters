'use client';

import type { ResolvedFilter } from '@mbsatimov/use-filters';
import type { DateRange } from 'react-day-picker';

import { format, parseISO } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

type DateRangeResolvedFilter = Extract<ResolvedFilter, { type: 'dateRange' }>;

/**
 * A calendar range picker over a resolved `dateRange` filter. The filter stores
 * `[from, to]` as `yyyy-MM-dd` strings (an empty string leaves that end open),
 * so this only converts between that tuple and react-day-picker's `DateRange`.
 */
export function DateRangeFilter({ filter }: { filter: DateRangeResolvedFilter }) {
  const [from, to] = filter.value ?? ['', ''];
  const range: DateRange | undefined = from || to ? toDateRange(from, to) : undefined;

  const onSelect = (next: DateRange | undefined) => {
    if (!next?.from) {
      filter.onChange(null);
      return;
    }
    filter.onChange([
      format(next.from, 'yyyy-MM-dd'),
      next.to ? format(next.to, 'yyyy-MM-dd') : ''
    ]);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          className={cn('border-dashed', filter.isFiltered && 'border-solid')}
          size='sm'
          variant='outline'
        >
          <CalendarIcon className='size-3.5' />
          {filter.isFiltered ? summary(from, to) : filter.label}
        </Button>
      </PopoverTrigger>
      <PopoverContent align='start' className='w-auto p-0'>
        <Calendar
          defaultMonth={range?.from}
          mode='range'
          numberOfMonths={2}
          selected={range}
          onSelect={onSelect}
        />
        {filter.isFiltered && (
          <div className='flex justify-end border-t p-2'>
            <Button size='sm' variant='ghost' onClick={() => filter.onChange(null)}>
              Clear
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

function toDateRange(from: string, to: string): DateRange {
  return {
    from: from ? parseISO(from) : undefined,
    to: to ? parseISO(to) : undefined
  };
}

/** `2026-03-09`/`2026-04-02` → `Mar 09 – Apr 02, 2026`, tolerating open ends. */
function summary(from: string, to: string): string {
  const fromLabel = from ? format(parseISO(from), 'MMM dd, yyyy') : '…';
  const toLabel = to ? format(parseISO(to), 'MMM dd, yyyy') : '…';
  return `${fromLabel} – ${toLabel}`;
}
