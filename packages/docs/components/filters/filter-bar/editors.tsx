'use client';

import type { FilterPrimitive, ResolvedFilter, ResolvedFilterOf } from '@mbsatimov/use-filters';
import type { DateRange } from 'react-day-picker';

import { fromDateValue, toDateValue } from '@mbsatimov/use-filters';
import { XIcon } from 'lucide-react';
import * as React from 'react';

import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import { Command, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

import { OptionList } from './option-list';
import { useAsyncOptions } from './use-async-options';

const SelectEditor = ({
  close,
  filter
}: {
  close: () => void;
  filter: ResolvedFilterOf<'select'>;
}) => (
  <OptionList
    options={filter.options}
    placeholder={filter.placeholder}
    selected={(option) => filter.value === option.value}
    onSelect={(option) => {
      filter.onChange(filter.value === option.value ? null : option.value);
      close();
    }}
  />
);

const MultiSelectEditor = ({ filter }: { filter: ResolvedFilterOf<'multiSelect'> }) => {
  const selected = new Set<FilterPrimitive>(filter.value ?? []);
  const toggle = (value: FilterPrimitive) => {
    const next = new Set(selected);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    filter.onChange(next.size ? [...next] : null);
  };
  return (
    <OptionList
      options={filter.options}
      placeholder={filter.placeholder}
      selected={(option) => selected.has(option.value)}
      onSelect={(option) => toggle(option.value)}
    />
  );
};

const AsyncSelectEditor = ({
  close,
  filter
}: {
  close: () => void;
  filter: ResolvedFilterOf<'asyncSelect'>;
}) => {
  const [search, setSearch] = React.useState('');
  const { hasMore, isLoadingMore, isPending, loadMore, options } = useAsyncOptions(
    filter,
    search,
    true
  );
  const selected = filter.selectedOption;
  return (
    <OptionList
      hasMore={hasMore}
      isLoadingMore={isLoadingMore}
      isPending={isPending}
      options={options}
      placeholder={filter.placeholder ?? filter.label}
      selected={(option) => selected?.value === option.value}
      serverSearch={{ value: search, onChange: setSearch }}
      onLoadMore={loadMore}
      onSelect={(option) => {
        filter.onSelectOption(selected?.value === option.value ? null : option);
        close();
      }}
    />
  );
};

const AsyncMultiSelectEditor = ({ filter }: { filter: ResolvedFilterOf<'asyncMultiSelect'> }) => {
  const [search, setSearch] = React.useState('');
  const { hasMore, isLoadingMore, isPending, loadMore, options } = useAsyncOptions(
    filter,
    search,
    true
  );
  const selectedValues = new Set(filter.selectedOptions.map((option) => option.value));
  return (
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
  );
};

const BooleanEditor = ({
  close,
  filter
}: {
  close: () => void;
  filter: ResolvedFilterOf<'boolean'>;
}) => {
  const items = [
    { label: filter.trueLabel ?? 'Yes', value: true },
    { label: filter.falseLabel ?? 'No', value: false }
  ];
  return (
    <Command>
      <CommandList>
        <CommandGroup>
          {items.map((item) => (
            <CommandItem
              key={String(item.value)}
              showCheckIcon={false}
              value={item.label}
              onSelect={() => {
                filter.onChange(filter.value === item.value ? null : item.value);
                close();
              }}
            >
              <Checkbox checked={filter.value === item.value} />
              <span>{item.label}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  );
};

const DateEditor = ({ close, filter }: { close: () => void; filter: ResolvedFilterOf<'date'> }) => (
  <Calendar
    autoFocus
    captionLayout='dropdown'
    className='mx-auto'
    mode='single'
    selected={fromDateValue(filter.value)}
    onSelect={(date) => {
      filter.onChange(date ? toDateValue(date) : null);
      close();
    }}
  />
);

const DateRangeEditor = ({ filter }: { filter: ResolvedFilterOf<'dateRange'> }) => {
  const [fromValue, toValue] = filter.value ?? ['', ''];
  return (
    <Calendar
      autoFocus
      captionLayout='dropdown'
      className='mx-auto'
      mode='range'
      selected={{ from: fromDateValue(fromValue), to: fromDateValue(toValue) }}
      onSelect={(range: DateRange | undefined) => {
        const nextFrom = range?.from ? toDateValue(range.from) : '';
        const nextTo = range?.to ? toDateValue(range.to) : '';
        filter.onChange(nextFrom || nextTo ? [nextFrom, nextTo] : null);
      }}
    />
  );
};

/** Numeric input — also used inline; an empty field clears to `null`, never 0. */
export const NumberEditor = ({
  className,
  filter
}: {
  className?: string;
  filter: ResolvedFilterOf<'number'>;
}) => (
  <Input
    className={cn('text-base', className)}
    inputMode='numeric'
    placeholder={filter.placeholder ?? filter.label}
    type='number'
    value={filter.value ?? ''}
    onChange={(event) =>
      filter.onChange(event.target.value === '' ? null : Number(event.target.value))
    }
  />
);

const NumberRangeEditor = ({ filter }: { filter: ResolvedFilterOf<'numberRange'> }) => {
  const [min, max] = filter.value ?? [null, null];
  // A range is one value: writing either end sends the whole tuple, and a
  // half-empty pair stays uncommitted until both ends are filled.
  const [draft, setDraft] = React.useState<[string, string]>([
    min === null ? '' : String(min),
    max === null ? '' : String(max)
  ]);

  const update = (index: 0 | 1, raw: string) => {
    const next: [string, string] = index === 0 ? [raw, draft[1]] : [draft[0], raw];
    setDraft(next);
    if (!next[0] && !next[1]) return filter.onChange(null);
    if (!next[0] || !next[1]) return;
    filter.onChange([Number(next[0]), Number(next[1])]);
  };

  return (
    <div className='flex flex-col gap-2 p-2'>
      {(['Min', 'Max'] as const).map((label, index) => (
        <label key={label} className='flex flex-col gap-1'>
          <span className='text-muted-foreground text-xs'>{label}</span>
          <Input
            inputMode='numeric'
            type='number'
            value={draft[index]}
            onChange={(event) => update(index as 0 | 1, event.target.value)}
          />
        </label>
      ))}
    </div>
  );
};

const TimeEditor = ({ filter }: { filter: ResolvedFilterOf<'time'> }) => (
  <div className='p-2'>
    <Input
      type='time'
      value={filter.value ?? ''}
      onChange={(event) => filter.onChange(event.target.value || null)}
    />
  </div>
);

const TimeRangeEditor = ({ filter }: { filter: ResolvedFilterOf<'timeRange'> }) => {
  const [from, to] = filter.value ?? ['', ''];
  const update = (index: 0 | 1, raw: string) => {
    const next: [string, string] = index === 0 ? [raw, to ?? ''] : [from ?? '', raw];
    filter.onChange(!next[0] && !next[1] ? null : next);
  };
  return (
    <div className='flex flex-col gap-2 p-2'>
      {(['From', 'To'] as const).map((label, index) => (
        <label key={label} className='flex flex-col gap-1'>
          <span className='text-muted-foreground text-xs'>{label}</span>
          <Input
            type='time'
            value={index === 0 ? (from ?? '') : (to ?? '')}
            onChange={(event) => update(index as 0 | 1, event.target.value)}
          />
        </label>
      ))}
    </div>
  );
};

const TagsEditor = ({ filter }: { filter: ResolvedFilterOf<'tags'> }) => {
  const [draft, setDraft] = React.useState('');
  const tags = filter.value ?? [];

  const add = () => {
    const value = draft.trim();
    setDraft('');
    if (!value || tags.includes(value)) return;
    filter.onChange([...tags, value]);
  };

  return (
    <div className='flex flex-col gap-2 p-2'>
      <Input
        placeholder={filter.placeholder ?? 'Add and press Enter'}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            add();
          }
        }}
      />
      {tags.length > 0 && (
        <div className='flex flex-wrap gap-1'>
          {tags.map((tag) => (
            <Badge
              key={tag}
              className='cursor-pointer'
              variant='secondary'
              onClick={() => {
                const next = tags.filter((item) => item !== tag);
                filter.onChange(next.length ? next : null);
              }}
            >
              {tag} <XIcon className='size-3' />
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * Type-safe editor dispatch. The `switch` narrows the resolved-filter union so
 * each editor gets its exact typed filter — no casts — while callers only ever
 * render `<FilterEditor />`. Add a filter kind by adding one editor + one case.
 */
export const FilterEditor = ({
  close,
  filter
}: {
  close: () => void;
  filter: ResolvedFilter;
}): React.ReactNode => {
  switch (filter.type) {
    case 'select':
      return <SelectEditor close={close} filter={filter} />;
    case 'multiSelect':
      return <MultiSelectEditor filter={filter} />;
    case 'asyncSelect':
      return <AsyncSelectEditor close={close} filter={filter} />;
    case 'asyncMultiSelect':
      return <AsyncMultiSelectEditor filter={filter} />;
    case 'boolean':
      return <BooleanEditor close={close} filter={filter} />;
    case 'date':
      return <DateEditor close={close} filter={filter} />;
    case 'dateRange':
      return <DateRangeEditor filter={filter} />;
    case 'number':
      return (
        <div className='p-2'>
          <NumberEditor filter={filter} />
        </div>
      );
    case 'numberRange':
      return <NumberRangeEditor filter={filter} />;
    case 'time':
      return <TimeEditor filter={filter} />;
    case 'timeRange':
      return <TimeRangeEditor filter={filter} />;
    case 'tags':
      return <TagsEditor filter={filter} />;
    default:
      return null; // text is an inline control, not a popover editor
  }
};
