'use client';

import type { ResolvedFilterOf } from '@mbsatimov/use-filters';

import { useState } from 'react';

import { Checkbox } from '@/components/ui/checkbox';
import { Command, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

import { ControlTrigger } from './control-trigger';

/** A standalone yes/no control for a `boolean` filter. */
export const BooleanFilter = ({
  className,
  filter
}: {
  className?: string;
  filter: ResolvedFilterOf<'boolean'>;
}) => {
  const [open, setOpen] = useState(false);
  const items = [
    { label: filter.trueLabel ?? 'Yes', value: true },
    { label: filter.falseLabel ?? 'No', value: false }
  ];
  const value =
    filter.value === null
      ? null
      : filter.value
        ? (filter.trueLabel ?? 'Yes')
        : (filter.falseLabel ?? 'No');

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <ControlTrigger
          className={className}
          label={filter.label}
          value={value}
          onClear={() => filter.onChange(null)}
        />
      </PopoverTrigger>
      <PopoverContent align='start' className='w-44 p-0'>
        <Command>
          <CommandList>
            <CommandGroup>
              {items.map((item) => (
                <CommandItem
                  key={item.label}
                  showCheckIcon={false}
                  value={item.label}
                  onSelect={() => {
                    filter.onChange(filter.value === item.value ? null : item.value);
                    setOpen(false);
                  }}
                >
                  <Checkbox checked={filter.value === item.value} />
                  <span>{item.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
