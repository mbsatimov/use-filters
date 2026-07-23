'use client';

import { type ResolvedFilter } from '@mbsatimov/use-filters';
import { Check, ChevronLeft, ChevronRight, Search, SlidersHorizontal, X } from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@/components/ui/command';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';

export function FilterBar({ filters }: { filters: ResolvedFilter[] }) {
  const inline = filters.filter((filter) => filter.type === 'text');
  const menu = filters.filter((filter) => filter.type !== 'text');

  return (
    <div className='flex flex-wrap items-center gap-2'>
      {inline.map((filter) => (
        <div key={filter.key} className='relative w-full sm:w-64'>
          <Search className='text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2' />
          <Input
            aria-label={filter.label}
            placeholder={`${filter.label}…`}
            value={(filter.value as string | null) ?? ''}
            onChange={(e) => filter.onChange(e.target.value || null)}
            className='h-9 pl-9'
          />
        </div>
      ))}
      {menu.length > 0 && <FilterMenu filters={menu} />}
    </div>
  );
}

/** The single entry point: one button, one popover, two levels. */
function FilterMenu({ filters }: { filters: ResolvedFilter[] }) {
  const [open, setOpen] = useState(false);
  const [activeKey, setActiveKey] = useState<string | null>(null);

  const active = filters.find((filter) => filter.key === activeKey) ?? null;
  const activeCount = filters.filter((filter) => filter.isFiltered).length;

  // Every close goes through here: drop any draft that was never applied (after
  // Apply nothing is dirty, so this is a no-op) and rewind to the top level, so
  // the menu always reopens at the filter list.
  const close = () => {
    filters.forEach((filter) => filter.isManual && filter.isDirty && filter.cancel());
    setActiveKey(null);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={(next) => (next ? setOpen(true) : close())}>
      <PopoverTrigger asChild>
        <Button
          variant='outline'
          size='sm'
          className={cn('h-9 border-dashed', activeCount > 0 && 'border-solid')}
        >
          <SlidersHorizontal className='size-4' />
          Filters
          {activeCount > 0 && (
            <>
              <Separator orientation='vertical' className='mx-0.5 h-4' />
              <Badge variant='secondary' className='rounded-sm px-1 font-normal'>
                {activeCount}
              </Badge>
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align='start' className='w-72 p-0'>
        {active ? (
          <FilterPanel filter={active} onBack={() => setActiveKey(null)} onApplied={close} />
        ) : (
          <FilterList filters={filters} onPick={setActiveKey} />
        )}
      </PopoverContent>
    </Popover>
  );
}

/** Level one — every filter, with the value it currently holds. */
function FilterList({
  filters,
  onPick
}: {
  filters: ResolvedFilter[];
  onPick: (key: string) => void;
}) {
  return (
    <Command>
      <CommandInput placeholder='Find a filter…' />
      <CommandList>
        <CommandEmpty>No filters found.</CommandEmpty>
        <CommandGroup>
          {filters.map((filter) => {
            const summary = summarize(filter);
            return (
              <CommandItem
                key={filter.key}
                value={filter.label}
                showCheckIcon={false}
                onSelect={() => onPick(filter.key)}
              >
                <span className='flex-1'>{filter.label}</span>
                {summary && (
                  <span className='text-muted-foreground max-w-28 truncate text-xs'>{summary}</span>
                )}
                <ChevronRight className='text-muted-foreground size-3.5' />
              </CommandItem>
            );
          })}
        </CommandGroup>
      </CommandList>
    </Command>
  );
}

/** Level two — the chosen filter's own editor, keyed off its type. */
function FilterPanel({
  filter,
  onBack,
  onApplied
}: {
  filter: ResolvedFilter;
  onBack: () => void;
  onApplied: () => void;
}) {
  return (
    <div>
      <div className='flex items-center gap-1 border-b p-1'>
        <Button
          variant='ghost'
          size='sm'
          className='h-7 gap-1 px-1.5'
          onClick={onBack}
          aria-label='Back to all filters'
        >
          <ChevronLeft className='size-4' />
        </Button>
        <span className='text-sm font-medium'>{filter.label}</span>
        {filter.isFiltered && (
          <Button
            variant='ghost'
            size='sm'
            className='text-muted-foreground ml-auto h-7 px-2 text-xs'
            onClick={() => filter.onChange(null)}
          >
            Clear
          </Button>
        )}
      </div>

      {/* Remount on commit so a draft editor reseeds from the applied value. */}
      <FilterEditor key={JSON.stringify(filter.committedValue)} filter={filter} />

      {/* Filters configured with `commit: 'manual'` hold a draft until Apply. */}
      {filter.isManual && (
        <div className='flex items-center justify-end gap-1 border-t p-2'>
          <Button
            variant='ghost'
            size='sm'
            className='h-7 text-xs'
            onClick={() => {
              filter.cancel();
              onBack();
            }}
          >
            Cancel
          </Button>
          <Button
            size='sm'
            className='h-7 text-xs'
            disabled={!filter.isDirty}
            onClick={() => {
              filter.apply();
              onApplied();
            }}
          >
            Apply
          </Button>
        </div>
      )}
    </div>
  );
}

function FilterEditor({ filter }: { filter: ResolvedFilter }) {
  switch (filter.type) {
    case 'select':
      return (
        <Command>
          <CommandInput placeholder={`Search ${filter.label.toLowerCase()}…`} />
          <CommandList>
            <CommandEmpty>No results.</CommandEmpty>
            <CommandGroup>
              {filter.options.map((option) => {
                const isSelected = String(option.value) === String(filter.value);
                return (
                  <CommandItem
                    key={String(option.value)}
                    value={option.label}
                    showCheckIcon={false}
                    onSelect={() => filter.onChange(isSelected ? null : option.value)}
                  >
                    <CheckIndicator selected={isSelected} rounded />
                    <span>{option.label}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      );

    case 'multiSelect': {
      const selected = new Set((filter.value ?? []).map(String));
      return (
        <Command>
          <CommandInput placeholder={`Search ${filter.label.toLowerCase()}…`} />
          <CommandList>
            <CommandEmpty>No results.</CommandEmpty>
            <CommandGroup>
              {filter.options.map((option) => {
                const isSelected = selected.has(String(option.value));
                return (
                  <CommandItem
                    key={String(option.value)}
                    value={option.label}
                    showCheckIcon={false}
                    onSelect={() => {
                      const next = filter.options.filter((o) => {
                        const has = selected.has(String(o.value));
                        return String(o.value) === String(option.value) ? !has : has;
                      });
                      filter.onChange(next.length ? next.map((o) => o.value) : null);
                    }}
                  >
                    <CheckIndicator selected={isSelected} />
                    <span>{option.label}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      );
    }

    case 'boolean':
      return (
        <Command>
          <CommandList>
            <CommandGroup>
              {[true, false].map((option) => (
                <CommandItem
                  key={String(option)}
                  value={String(option)}
                  showCheckIcon={false}
                  onSelect={() => filter.onChange(filter.value === option ? null : option)}
                >
                  <CheckIndicator selected={filter.value === option} rounded />
                  <span>{option ? (filter.trueLabel ?? 'Yes') : (filter.falseLabel ?? 'No')}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      );

    case 'dateRange': {
      const [from, to] = filter.value ?? ['', ''];
      return (
        <RangeFields
          fromLabel='From'
          toLabel='To'
          type='date'
          from={from}
          to={to}
          onChange={(range) => filter.onChange(range)}
        />
      );
    }

    case 'numberRange': {
      const [min, max] = filter.value ?? [null, null];
      return (
        <RangeFields
          fromLabel='Min'
          toLabel='Max'
          type='number'
          from={min == null ? '' : String(min)}
          to={max == null ? '' : String(max)}
          onChange={(range) => filter.onChange(range && [Number(range[0]), Number(range[1])])}
        />
      );
    }

    case 'date':
      return (
        <div className='p-3'>
          <Input
            type='date'
            aria-label={filter.label}
            value={filter.value ?? ''}
            onChange={(e) => filter.onChange(e.target.value || null)}
            className='h-8'
          />
        </div>
      );

    case 'number':
      return (
        <div className='p-3'>
          <Input
            type='number'
            aria-label={filter.label}
            value={filter.value ?? ''}
            onChange={(e) => filter.onChange(e.target.value === '' ? null : Number(e.target.value))}
            className='h-8'
          />
        </div>
      );

    default:
      return null;
  }
}

function RangeFields({
  fromLabel,
  toLabel,
  type,
  from,
  to,
  onChange
}: {
  fromLabel: string;
  toLabel: string;
  type: 'date' | 'number';
  from: string;
  to: string;
  onChange: (range: [string, string] | null) => void;
}) {
  const [draft, setDraft] = useState<[string, string]>([from, to]);

  const update = (next: [string, string]) => {
    setDraft(next);
    const [start, end] = next;
    if (!start && !end) return onChange(null);
    if (type === 'number' && (!start || !end)) return;
    onChange(next);
  };

  return (
    <div className='flex flex-col gap-2 p-3'>
      <label className='flex flex-col gap-1'>
        <span className='text-muted-foreground text-xs'>{fromLabel}</span>
        <Input
          type={type}
          value={draft[0]}
          onChange={(e) => update([e.target.value, draft[1]])}
          className='h-8'
        />
      </label>
      <label className='flex flex-col gap-1'>
        <span className='text-muted-foreground text-xs'>{toLabel}</span>
        <Input
          type={type}
          value={draft[1]}
          onChange={(e) => update([draft[0], e.target.value])}
          className='h-8'
        />
      </label>
    </div>
  );
}

function CheckIndicator({ selected, rounded }: { selected: boolean; rounded?: boolean }) {
  return (
    <span
      className={cn(
        'border-primary flex size-4 items-center justify-center border',
        rounded ? 'rounded-full' : 'rounded-sm',
        selected ? 'bg-primary text-primary-foreground' : 'opacity-50'
      )}
    >
      {selected && <Check className='size-3' />}
    </span>
  );
}

export function ActiveFilters({
  filters,
  onReset
}: {
  filters: ResolvedFilter[];
  onReset: () => void;
}) {
  // `isFiltered` is per-filter "differs from its default", so a filter sitting
  // at its default value (e.g. the initial sort) doesn't show up as a chip.
  const active = filters.filter((filter) => filter.isFiltered);
  if (active.length === 0) return null;

  return (
    <div className='flex flex-wrap items-center gap-1.5'>
      {active.map((filter) => (
        <span
          key={filter.key}
          className='bg-muted/60 inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs'
        >
          <span className='text-muted-foreground'>{filter.label}</span>
          <span className='font-medium'>{summarize(filter)}</span>
          <button
            type='button'
            aria-label={`Clear ${filter.label}`}
            onClick={() => filter.instantReset()}
            className='text-muted-foreground hover:text-foreground focus-visible:ring-ring rounded-sm focus-visible:ring-2 focus-visible:outline-none'
          >
            <X className='size-3' />
          </button>
        </span>
      ))}
      <Button variant='ghost' size='sm' className='h-7 text-xs' onClick={onReset}>
        Clear all
      </Button>
    </div>
  );
}

const numberFormat = new Intl.NumberFormat('en-US');

/** Shown in place of a missing end of an open-ended range. */
const OPEN_END = '…';

/** `2026-03-09` → `Mar 09, 2026`, read as a local date so the day never shifts. */
function formatDate(value: string) {
  return format(parseISO(value), 'MMM dd, yyyy');
}

/** The label an option carries, falling back to the raw value. */
function optionLabel(options: readonly { label: string; value: unknown }[], value: unknown) {
  const match = options.find((option) => String(option.value) === String(value));
  return match ? match.label : String(value);
}

/**
 * A short, human-readable rendering of what a filter is actually filtering by.
 *
 * Every case reads `committedValue` — the value that's really narrowing the
 * data — so a manual filter with an unapplied draft still reports what's live.
 * Returns `null` when the filter isn't narrowing anything.
 */
function summarize(filter: ResolvedFilter): string | null {
  switch (filter.type) {
    case 'text':
    case 'time':
      return filter.committedValue;

    case 'date': {
      const value = filter.committedValue;
      return value == null ? null : formatDate(value);
    }

    case 'number': {
      const value = filter.committedValue;
      return value == null ? null : numberFormat.format(value);
    }

    case 'numberRange': {
      const range = filter.committedValue;
      if (range == null) return null;
      const [min, max] = range;
      return `${numberFormat.format(min)} – ${numberFormat.format(max)}`;
    }

    case 'dateRange': {
      const range = filter.committedValue;
      if (range == null) return null;
      const [from, to] = range;
      return `${from ? formatDate(from) : OPEN_END} – ${to ? formatDate(to) : OPEN_END}`;
    }

    case 'timeRange': {
      const range = filter.committedValue;
      if (range == null) return null;
      const [from, to] = range;
      return `${from || OPEN_END} – ${to || OPEN_END}`;
    }

    case 'boolean': {
      const value = filter.committedValue;
      if (value == null) return null;
      return value ? (filter.trueLabel ?? 'Yes') : (filter.falseLabel ?? 'No');
    }

    case 'tags': {
      const values = filter.committedValue;
      return values?.length ? values.join(', ') : null;
    }

    case 'select': {
      const value = filter.committedValue;
      return value == null ? null : optionLabel(filter.options, value);
    }

    case 'multiSelect': {
      const values = filter.committedValue;
      if (!values?.length) return null;
      return values.map((value) => optionLabel(filter.options, value)).join(', ');
    }

    // Async filters have no static option list, so their labels can only come
    // from what the last search resolved.
    case 'asyncSelect':
      return filter.selectedOption?.label ?? null;

    case 'asyncMultiSelect': {
      const selected = filter.selectedOptions;
      return selected.length ? selected.map((option) => option.label).join(', ') : null;
    }

    default:
      return null;
  }
}
