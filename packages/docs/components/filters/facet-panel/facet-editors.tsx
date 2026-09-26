'use client';

import type { FilterPrimitive, ResolvedFilter, ResolvedFilterOf } from '@mbsatimov/use-filters';
import type { ReactNode } from 'react';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

import { useAsyncOptions } from './use-async-options';

/**
 * Sidebar-style editors: flat lists and inputs, no popovers — made to sit in
 * a facet panel or a mobile drawer. One editor per filter type; pass any
 * resolved filter to `<FacetEditor>` and the switch picks the right one.
 *
 * Every editor writes through `filter.onChange`, so it follows the filter's
 * configured commit mode: instant facets apply on click, `commit: 'manual'`
 * facets stage until `apply()` — which is what a drawer's "Show results"
 * button and a panel's Apply bar call.
 */
export function FacetEditor({
  filter,
  renderEditor
}: {
  filter: ResolvedFilter;
  /** Override the editor for specific filters (e.g. a price slider). */
  renderEditor?: (filter: ResolvedFilter) => ReactNode | undefined;
}) {
  const override = renderEditor?.(filter);
  if (override !== undefined) return override;

  switch (filter.type) {
    case 'select':
      return <SingleList filter={filter} />;
    case 'multiSelect':
      return <CheckboxList filter={filter} />;
    case 'asyncSelect':
    case 'asyncMultiSelect':
      return <AsyncList filter={filter} />;
    case 'boolean':
      return (
        <label className='flex items-center gap-2 text-sm'>
          <Checkbox
            checked={filter.value === true}
            onCheckedChange={(checked) => filter.onChange(checked ? true : null)}
          />
          {filter.trueLabel ?? filter.label}
        </label>
      );
    case 'text':
      return (
        <Input
          placeholder={filter.placeholder ?? filter.label}
          value={filter.value ?? ''}
          onChange={(event) => filter.onChange(event.target.value || null)}
        />
      );
    case 'number':
      return (
        <Input
          inputMode='numeric'
          placeholder={filter.placeholder ?? filter.label}
          type='number'
          value={filter.value ?? ''}
          onChange={(event) =>
            filter.onChange(event.target.value === '' ? null : Number(event.target.value))
          }
        />
      );
    case 'numberRange':
      return <NumberRangeFields filter={filter} />;
    case 'date':
    case 'time':
      return (
        <Input
          type={filter.type}
          value={filter.value ?? ''}
          onChange={(event) => filter.onChange(event.target.value || null)}
        />
      );
    case 'dateRange':
    case 'timeRange':
      return <RangeInputs filter={filter} type={filter.type === 'dateRange' ? 'date' : 'time'} />;
    default:
      return null;
  }
}

/** Single choice as a flat list of highlight-on-active rows. */
function SingleList({ filter }: { filter: ResolvedFilterOf<'select'> }) {
  return (
    <div className='flex flex-col gap-1'>
      {filter.options.map((option) => {
        const active = filter.value === option.value;
        return (
          <button
            key={String(option.value)}
            className={cn(
              'flex items-center rounded-md px-2 py-1.5 text-left text-sm transition-colors',
              active
                ? 'bg-primary/10 text-primary font-medium'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
            type='button'
            onClick={() => filter.onChange(active ? null : option.value)}
          >
            <span className='flex-1'>{option.label}</span>
            {option.count !== undefined && (
              <span className='font-mono text-xs'>{option.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/** Multi choice as checkbox rows. */
function CheckboxList({ filter }: { filter: ResolvedFilterOf<'multiSelect'> }) {
  const selected = new Set<FilterPrimitive>(filter.value ?? []);
  const toggle = (value: FilterPrimitive) => {
    const next = new Set(selected);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    filter.onChange(next.size ? [...next] : null);
  };

  return (
    <div className='flex flex-col gap-2.5'>
      {filter.options.map((option) => (
        <label key={String(option.value)} className='flex items-center gap-2 text-sm'>
          <Checkbox
            checked={selected.has(option.value)}
            onCheckedChange={() => toggle(option.value)}
          />
          <span className='flex-1'>{option.label}</span>
          {option.count !== undefined && (
            <span className='text-muted-foreground font-mono text-xs'>{option.count}</span>
          )}
        </label>
      ))}
    </div>
  );
}

/** Server-searched options as a search box over checkbox rows. */
function AsyncList({
  filter
}: {
  filter: ResolvedFilterOf<'asyncMultiSelect'> | ResolvedFilterOf<'asyncSelect'>;
}) {
  const [search, setSearch] = useState('');
  const { hasMore, isLoadingMore, isPending, loadMore, loadMoreFailed, options } = useAsyncOptions(
    filter,
    search,
    true
  );
  const selectedValues = new Set(
    (filter.type === 'asyncSelect'
      ? filter.selectedOption
        ? [filter.selectedOption]
        : []
      : filter.selectedOptions
    ).map((option) => option.value)
  );

  return (
    <div className='flex flex-col gap-2.5'>
      <Input
        placeholder={filter.placeholder ?? `Search ${filter.label.toLowerCase()}…`}
        value={search}
        onChange={(event) => setSearch(event.target.value)}
      />
      {isPending ? (
        <span className='text-muted-foreground py-2 text-sm'>Searching…</span>
      ) : (
        options.map((option) => {
          const isSelected = selectedValues.has(option.value);
          return (
            <label key={String(option.value)} className='flex items-center gap-2 text-sm'>
              <Checkbox
                checked={isSelected}
                onCheckedChange={() => {
                  if (filter.type === 'asyncSelect') {
                    filter.onSelectOption(isSelected ? null : option);
                  } else {
                    filter.onToggleOption(option);
                  }
                }}
              />
              {option.label}
            </label>
          );
        })
      )}
      {!isPending && hasMore && (
        <Button
          className='self-start px-0'
          disabled={isLoadingMore}
          size='sm'
          variant='link'
          onClick={loadMore}
        >
          {isLoadingMore ? 'Loading…' : loadMoreFailed ? "Couldn't load more — retry" : 'Load more'}
        </Button>
      )}
    </div>
  );
}

/** Min/max inputs; a half-empty pair stays uncommitted until both are filled. */
function NumberRangeFields({ filter }: { filter: ResolvedFilterOf<'numberRange'> }) {
  const [min, max] = filter.value ?? [null, null];
  const [draft, setDraft] = useState<[string, string]>([
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
    <div className='flex items-center gap-2'>
      <Input
        inputMode='numeric'
        placeholder='Min'
        type='number'
        value={draft[0]}
        onChange={(event) => update(0, event.target.value)}
      />
      <span className='text-muted-foreground text-xs'>–</span>
      <Input
        inputMode='numeric'
        placeholder='Max'
        type='number'
        value={draft[1]}
        onChange={(event) => update(1, event.target.value)}
      />
    </div>
  );
}

/** From/to inputs for date and time ranges; either end may stay open. */
function RangeInputs({
  filter,
  type
}: {
  filter: ResolvedFilterOf<'dateRange'> | ResolvedFilterOf<'timeRange'>;
  type: 'date' | 'time';
}) {
  const [from, to] = filter.value ?? ['', ''];
  const update = (index: 0 | 1, raw: string) => {
    const next: [string, string] = index === 0 ? [raw, to ?? ''] : [from ?? '', raw];
    filter.onChange(!next[0] && !next[1] ? null : next);
  };

  return (
    <div className='flex flex-col gap-2'>
      <Input type={type} value={from ?? ''} onChange={(event) => update(0, event.target.value)} />
      <Input type={type} value={to ?? ''} onChange={(event) => update(1, event.target.value)} />
    </div>
  );
}
