'use client';

import type { ResolvedFilterOf } from '@mbsatimov/use-filters';

import { fromDateValue, toDateValue } from '@mbsatimov/use-filters';
import { format } from 'date-fns';
import { useState } from 'react';

import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

import { ControlTrigger } from './control-trigger';

/** A standalone calendar control for a `date` filter. */
export const DateFilter = ({
  className,
  filter
}: {
  className?: string;
  filter: ResolvedFilterOf<'date'>;
}) => {
  const [open, setOpen] = useState(false);
  const date = fromDateValue(filter.value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <ControlTrigger
          className={className}
          label={filter.label}
          value={date ? format(date, 'MMM dd, yyyy') : null}
          onClear={() => filter.onChange(null)}
        />
      </PopoverTrigger>
      <PopoverContent align='start' className='w-auto p-0'>
        <Calendar
          autoFocus
          captionLayout='dropdown'
          mode='single'
          selected={date}
          onSelect={(next) => {
            filter.onChange(next ? toDateValue(next) : null);
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
};
