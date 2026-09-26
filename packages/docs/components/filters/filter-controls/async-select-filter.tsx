'use client';

import type { ResolvedFilterOf } from '@mbsatimov/use-filters';

import { useState } from 'react';

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

import { ControlTrigger } from './control-trigger';
import { OptionList } from './option-list';
import { useAsyncOptions } from './use-async-options';

/** A standalone server-searched single-choice control for an `asyncSelect` filter. */
export const AsyncSelectFilter = ({
  className,
  filter
}: {
  className?: string;
  filter: ResolvedFilterOf<'asyncSelect'>;
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const { hasMore, isLoadingMore, isPending, loadMore, loadMoreFailed, options } = useAsyncOptions(
    filter,
    search,
    open
  );
  const selected = filter.selectedOption;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <ControlTrigger
          className={className}
          label={filter.label}
          value={selected ? (selected.label ?? String(selected.value)) : null}
          onClear={() => filter.onChange(null)}
        />
      </PopoverTrigger>
      <PopoverContent align='start' className='w-56 p-0'>
        <OptionList
          hasMore={hasMore}
          isLoadingMore={isLoadingMore}
          isPending={isPending}
          loadMoreFailed={loadMoreFailed}
          options={options}
          placeholder={filter.placeholder ?? filter.label}
          selected={(option) => selected?.value === option.value}
          serverSearch={{ value: search, onChange: setSearch }}
          onLoadMore={loadMore}
          onSelect={(option) => {
            filter.onSelectOption(selected?.value === option.value ? null : option);
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
};
