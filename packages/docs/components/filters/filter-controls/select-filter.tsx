'use client';

import type { ResolvedFilterOf } from '@mbsatimov/use-filters';

import { useState } from 'react';

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

import { ControlTrigger } from './control-trigger';
import { OptionList } from './option-list';

/** A standalone single-choice control for a `select` filter. */
export const SelectFilter = ({
  className,
  filter
}: {
  className?: string;
  filter: ResolvedFilterOf<'select'>;
}) => {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <ControlTrigger
          className={className}
          label={filter.label}
          value={filter.selectedOption?.label ?? null}
          onClear={() => filter.onChange(null)}
        />
      </PopoverTrigger>
      <PopoverContent align='start' className='w-56 p-0'>
        <OptionList
          options={filter.options}
          placeholder={filter.placeholder ?? filter.label}
          selected={(option) => filter.value === option.value}
          onSelect={(option) => {
            filter.onChange(filter.value === option.value ? null : option.value);
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
};
