'use client';

import type { ResolvedFilter } from '@mbsatimov/use-filters';

import { Check, ChevronLeft, ChevronRight, Loader2, SlidersHorizontal } from 'lucide-react';
import { useEffect, useState } from 'react';

import { summarize } from '@/components/examples/filter-menu/filter-chips';
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

/**
 * One button, every filter: a two-level popover driven entirely by the
 * `filters` array from `useFilters`.
 *
 * Level one lists the filters; picking one opens its editor, chosen by a
 * `switch` on `filter.type`. Nothing here knows which screen it is on — add a
 * filter to the config and its editor appears, remove it and it disappears.
 */
export function FilterMenu({ filters }: { filters: ResolvedFilter[] }) {
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
          className={cn('border-dashed', activeCount > 0 && 'border-solid')}
          variant='outline'
        >
          <SlidersHorizontal className='size-4' />
          Filters
          {activeCount > 0 && (
            <>
              <Separator className='mx-0.5 h-4' orientation='vertical' />
              <Badge className='rounded-sm px-1 font-normal' variant='secondary'>
                {activeCount}
              </Badge>
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align='start' className='w-72 p-0'>
        {active ? (
          <FilterPanel filter={active} onApplied={close} onBack={() => setActiveKey(null)} />
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
                showCheckIcon={false}
                value={filter.label}
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
  onApplied,
  onBack
}: {
  filter: ResolvedFilter;
  onApplied: () => void;
  onBack: () => void;
}) {
  return (
    <div>
      <div className='flex items-center gap-1 border-b p-1'>
        <Button aria-label='Back to all filters' size='icon-xs' variant='ghost' onClick={onBack}>
          <ChevronLeft className='size-4' />
        </Button>
        <span className='text-sm font-medium'>{filter.label}</span>
        {filter.isFiltered && (
          <Button
            className='text-muted-foreground ml-auto'
            size='xs'
            variant='ghost'
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
            size='xs'
            variant='ghost'
            onClick={() => {
              filter.cancel();
              onBack();
            }}
          >
            Cancel
          </Button>
          <Button
            disabled={!filter.isDirty}
            size='xs'
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

/** The switch that makes the menu config-driven: one editor per filter type. */
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
                    showCheckIcon={false}
                    value={option.label}
                    onSelect={() => filter.onChange(isSelected ? null : option.value)}
                  >
                    <CheckIndicator rounded selected={isSelected} />
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
                    showCheckIcon={false}
                    value={option.label}
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

    // Server-searched pickers: the library debounces `loadOptions` and hands it
    // an AbortSignal, so the editor only renders what the search resolves.
    case 'asyncSelect':
    case 'asyncMultiSelect':
      return <AsyncEditor filter={filter} />;

    case 'boolean':
      return (
        <Command>
          <CommandList>
            <CommandGroup>
              {[true, false].map((option) => (
                <CommandItem
                  key={String(option)}
                  showCheckIcon={false}
                  value={String(option)}
                  onSelect={() => filter.onChange(filter.value === option ? null : option)}
                >
                  <CheckIndicator rounded selected={filter.value === option} />
                  <span>{option ? (filter.trueLabel ?? 'Yes') : (filter.falseLabel ?? 'No')}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      );

    case 'dateRange':
    case 'timeRange': {
      const [from, to] = filter.value ?? ['', ''];
      return (
        <RangeFields
          from={from}
          fromLabel='From'
          to={to}
          toLabel='To'
          type={filter.type === 'dateRange' ? 'date' : 'time'}
          onChange={(range) => filter.onChange(range)}
        />
      );
    }

    case 'numberRange': {
      const [min, max] = filter.value ?? [null, null];
      return (
        <RangeFields
          from={min == null ? '' : String(min)}
          fromLabel='Min'
          to={max == null ? '' : String(max)}
          toLabel='Max'
          type='number'
          onChange={(range) => filter.onChange(range && [Number(range[0]), Number(range[1])])}
        />
      );
    }

    case 'date':
    case 'time':
      return (
        <div className='p-3'>
          <Input
            aria-label={filter.label}
            className='h-8'
            type={filter.type}
            value={filter.value ?? ''}
            onChange={(e) => filter.onChange(e.target.value || null)}
          />
        </div>
      );

    case 'number':
      return (
        <div className='p-3'>
          <Input
            aria-label={filter.label}
            className='h-8'
            placeholder={filter.placeholder}
            type='number'
            value={filter.value ?? ''}
            onChange={(e) => filter.onChange(e.target.value === '' ? null : Number(e.target.value))}
          />
        </div>
      );

    case 'text':
      return (
        <div className='p-3'>
          <Input
            aria-label={filter.label}
            className='h-8'
            placeholder={filter.placeholder}
            value={filter.value ?? ''}
            onChange={(e) => filter.onChange(e.target.value || null)}
          />
        </div>
      );

    case 'tags':
      return <TagsEditor filter={filter} />;

    default:
      return null;
  }
}

type AsyncResolvedFilter = Extract<ResolvedFilter, { type: 'asyncMultiSelect' | 'asyncSelect' }>;
/** What `loadOptions` resolves to — the shape `onSelectOption` expects back. */
type AsyncOption = Awaited<ReturnType<AsyncResolvedFilter['loadOptions']>>[number];

/**
 * Editor for `asyncSelect` / `asyncMultiSelect`. `loadOptions` comes from the
 * config; the library already debounces it (`searchDebounceMs`), so this only
 * tracks the query and renders the resolved options.
 */
function AsyncEditor({ filter }: { filter: AsyncResolvedFilter }) {
  const [search, setSearch] = useState('');
  const [options, setOptions] = useState<AsyncOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    setIsLoading(true);
    filter
      .loadOptions(search, controller.signal)
      .then((result) => {
        setOptions(result);
        setIsLoading(false);
      })
      .catch(() => {
        // Aborted or failed: keep the previous options.
      });
    return () => controller.abort();
  }, [search, filter]);

  const selected = new Set(
    (filter.type === 'asyncSelect'
      ? filter.selectedOption
        ? [filter.selectedOption]
        : []
      : filter.selectedOptions
    ).map((option) => String(option.value))
  );

  return (
    <Command shouldFilter={false}>
      <CommandInput
        placeholder={`Search ${filter.label.toLowerCase()}…`}
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        {isLoading ? (
          <div className='text-muted-foreground flex items-center justify-center gap-2 py-6 text-sm'>
            <Loader2 className='size-4 animate-spin' /> Searching…
          </div>
        ) : (
          <>
            <CommandEmpty>No results.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => {
                const isSelected = selected.has(String(option.value));
                return (
                  <CommandItem
                    key={String(option.value)}
                    showCheckIcon={false}
                    value={String(option.value)}
                    onSelect={() => {
                      if (filter.type === 'asyncSelect') {
                        if (isSelected) filter.onChange(null);
                        else filter.onSelectOption(option);
                      } else {
                        filter.onToggleOption(option);
                      }
                    }}
                  >
                    <CheckIndicator rounded={filter.type === 'asyncSelect'} selected={isSelected} />
                    <span>{option.label ?? String(option.value)}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </Command>
  );
}

/** Free-text list for `tags`: type, press Enter to add, click a tag to remove. */
function TagsEditor({ filter }: { filter: Extract<ResolvedFilter, { type: 'tags' }> }) {
  const [draft, setDraft] = useState('');
  const tags = filter.value ?? [];

  const add = () => {
    const value = draft.trim();
    setDraft('');
    if (!value || tags.includes(value)) return;
    filter.onChange([...tags, value]);
  };

  return (
    <div className='flex flex-col gap-2 p-3'>
      <Input
        className='h-8'
        placeholder={filter.placeholder ?? 'Add and press Enter'}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
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
              {tag} ×
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

function RangeFields({
  from,
  fromLabel,
  onChange,
  to,
  toLabel,
  type
}: {
  from: string;
  fromLabel: string;
  onChange: (range: [string, string] | null) => void;
  to: string;
  toLabel: string;
  type: 'date' | 'number' | 'time';
}) {
  const [draft, setDraft] = useState<[string, string]>([from, to]);

  const update = (next: [string, string]) => {
    setDraft(next);
    const [start, end] = next;
    if (!start && !end) return onChange(null);
    // A number range needs both ends before it can commit; date/time ranges
    // accept open ends.
    if (type === 'number' && (!start || !end)) return;
    onChange(next);
  };

  return (
    <div className='flex flex-col gap-2 p-3'>
      <label className='flex flex-col gap-1'>
        <span className='text-muted-foreground text-xs'>{fromLabel}</span>
        <Input
          className='h-8'
          type={type}
          value={draft[0]}
          onChange={(e) => update([e.target.value, draft[1]])}
        />
      </label>
      <label className='flex flex-col gap-1'>
        <span className='text-muted-foreground text-xs'>{toLabel}</span>
        <Input
          className='h-8'
          type={type}
          value={draft[1]}
          onChange={(e) => update([draft[0], e.target.value])}
        />
      </label>
    </div>
  );
}

const CheckIndicator = ({ rounded, selected }: { rounded?: boolean; selected: boolean }) => (
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
