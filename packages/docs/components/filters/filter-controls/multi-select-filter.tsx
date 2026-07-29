'use client';

import type { FilterPrimitive, ResolvedFilterOf } from '@mbsatimov/use-filters';

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

import { ControlTrigger } from './control-trigger';
import { OptionList } from './option-list';

/** A standalone multi-choice control for a `multiSelect` filter. */
export const MultiSelectFilter = ({
  className,
  filter
}: {
  className?: string;
  filter: ResolvedFilterOf<'multiSelect'>;
}) => {
  const selected = new Set<FilterPrimitive>(filter.value ?? []);
  const chosen = filter.selectedOptions;
  const value =
    chosen.length === 0
      ? null
      : chosen.length === 1
        ? chosen[0].label
        : `${chosen[0].label} +${chosen.length - 1}`;

  const toggle = (optionValue: FilterPrimitive) => {
    const next = new Set(selected);
    if (next.has(optionValue)) next.delete(optionValue);
    else next.add(optionValue);
    filter.onChange(next.size ? [...next] : null);
  };

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
      <PopoverContent align='start' className='w-56 p-0'>
        <OptionList
          options={filter.options}
          placeholder={filter.placeholder ?? filter.label}
          selected={(option) => selected.has(option.value)}
          onSelect={(option) => toggle(option.value)}
        />
      </PopoverContent>
    </Popover>
  );
};
