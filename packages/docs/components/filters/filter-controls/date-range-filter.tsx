'use client';

import type { ResolvedFilterOf } from '@mbsatimov/use-filters';
import type { DateRange } from 'react-day-picker';

import { fromDateValue, toDateValue } from '@mbsatimov/use-filters';
import { format } from 'date-fns';

import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

import { ControlTrigger } from './control-trigger';

/** A standalone calendar-range control for a `dateRange` filter. */
export const DateRangeFilter = ({
  className,
  filter,
  numberOfMonths = 2
}: {
  className?: string;
  filter: ResolvedFilterOf<'dateRange'>;
  numberOfMonths?: number;
}) => {
  const [fromValue, toValue] = filter.value ?? ['', ''];
  const from = fromDateValue(fromValue);
  const to = fromDateValue(toValue);
  const value =
    from || to
      ? `${from ? format(from, 'dd.MM.yyyy') : '…'} – ${to ? format(to, 'dd.MM.yyyy') : '…'}`
      : null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <ControlTrigger
          className={className}
          label={filter.label}
          value={value}
          onClear={() => filter.onChange(null)}
        />
      </PopoverTrigger>
      <PopoverContent align='start' className='w-auto p-0'>
        <Calendar
          autoFocus
          defaultMonth={from}
          mode='range'
          numberOfMonths={numberOfMonths}
          selected={{ from, to }}
          onSelect={(range: DateRange | undefined) => {
            const nextFrom = range?.from ? toDateValue(range.from) : '';
            const nextTo = range?.to ? toDateValue(range.to) : '';
            filter.onChange(nextFrom || nextTo ? [nextFrom, nextTo] : null);
          }}
        />
      </PopoverContent>
    </Popover>
  );
};
