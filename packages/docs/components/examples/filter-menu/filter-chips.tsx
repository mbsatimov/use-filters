'use client';

import type { ResolvedFilter } from '@mbsatimov/use-filters';

import { format, parseISO } from 'date-fns';
import { X } from 'lucide-react';

import { Button } from '@/components/ui/button';

/**
 * One chip per active filter, each with its own ×, plus "Clear all". Reads the
 * same `filters` array as the menu, so the two can never disagree.
 */
export function FilterChips({
  filters,
  onReset
}: {
  filters: ResolvedFilter[];
  onReset: () => void;
}) {
  // `isFiltered` is per-filter "differs from its default", so a filter sitting
  // at its default value doesn't show up as a chip.
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
            aria-label={`Clear ${filter.label}`}
            className='text-muted-foreground hover:text-foreground focus-visible:ring-ring rounded-sm focus-visible:ring-2 focus-visible:outline-none'
            type='button'
            onClick={() => filter.instantReset()}
          >
            <X className='size-3' />
          </button>
        </span>
      ))}
      <Button size='xs' variant='ghost' onClick={onReset}>
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
export function summarize(filter: ResolvedFilter): string | null {
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
    // from what the last search resolved (kept in the URL beside the value).
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
