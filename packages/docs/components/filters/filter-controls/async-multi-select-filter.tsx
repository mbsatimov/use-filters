'use client';

import type { ResolvedFilterOf } from '@mbsatimov/use-filters';

import { useState } from 'react';

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

import { ControlTrigger } from './control-trigger';
import { OptionList } from './option-list';
import { useAsyncOptions } from './use-async-options';

/** A standalone server-searched multi-choice control for an `asyncMultiSelect` filter. */
export const AsyncMultiSelectFilter = ({
  className,
  filter
}: {
  className?: string;
  filter: ResolvedFilterOf<'asyncMultiSelect'>;
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const { hasMore, isLoadingMore, isPending, loadMore, options } = useAsyncOptions(
    filter,
    search,
    open
  );
  const chosen = filter.selectedOptions;
  const selectedValues = new Set(chosen.map((option) => option.value));
  const value =
    chosen.length === 0
      ? null
      : chosen.length === 1
        ? (chosen[0].label ?? String(chosen[0].value))
        : `${chosen[0].label ?? String(chosen[0].value)} +${chosen.length - 1}`;

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
      <PopoverContent align='start' className='w-56 p-0'>
        <OptionList
          hasMore={hasMore}
          isLoadingMore={isLoadingMore}
          isPending={isPending}
          options={options}
          placeholder={filter.placeholder ?? filter.label}
          selected={(option) => selectedValues.has(option.value)}
          serverSearch={{ value: search, onChange: setSearch }}
          onLoadMore={loadMore}
          onSelect={(option) => filter.onToggleOption(option)}
        />
      </PopoverContent>
    </Popover>
  );
};
