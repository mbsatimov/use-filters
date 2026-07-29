'use client';

import type { ResolvedFilter } from '@mbsatimov/use-filters';

import { X } from 'lucide-react';

import { cn } from '@/lib/utils';

import { summarizeFacet } from './summarize';

/**
 * The mobile companion to `FacetPanel`: a horizontally scrollable chip per
 * filter. Tapping a chip reports its key (open that facet's drawer); boolean
 * chips toggle in place; active chips show their value and clear with ×.
 *
 * Chips read `committedValue`, so staged drawer edits don't move them until
 * they are applied.
 */
export function FacetChipRow({
  className,
  filters,
  onOpenFacet
}: {
  className?: string;
  filters: ResolvedFilter[];
  onOpenFacet: (key: string) => void;
}) {
  return (
    <div
      className={cn('-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none]', className)}
    >
      {filters.map((filter) => {
        const summary = summarizeFacet(filter);
        const active = summary !== null;

        // Booleans have nothing to edit — the chip itself is the control.
        const open =
          filter.type === 'boolean'
            ? () => filter.onChange(filter.value === true ? null : true)
            : () => onOpenFacet(filter.key);

        return (
          <span
            key={filter.key}
            className={cn(
              'inline-flex shrink-0 items-center overflow-hidden rounded-full border text-sm transition-colors',
              active ? 'border-primary/40 bg-primary/10 text-primary' : 'text-foreground'
            )}
          >
            <button
              className={cn('flex items-center gap-1.5 py-1.5 pl-3', active ? 'pr-1' : 'pr-3')}
              type='button'
              onClick={open}
            >
              {active && filter.type !== 'boolean' ? summary : filter.label}
            </button>
            {active && filter.type !== 'boolean' && (
              <button
                aria-label={`Clear ${filter.label}`}
                className='py-1.5 pr-2.5 pl-1'
                type='button'
                onClick={() => filter.instantReset()}
              >
                <X className='size-3.5' />
              </button>
            )}
          </span>
        );
      })}
    </div>
  );
}
