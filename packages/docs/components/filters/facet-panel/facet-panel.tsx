'use client';

import type { ResolvedFilter } from '@mbsatimov/use-filters';
import type { ReactNode } from 'react';

import { SlidersHorizontal, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

import { FacetEditor } from './facet-editors';

/**
 * A facet sidebar: one labelled section per filter, separated, with a header
 * Clear and — when any filter has a staged draft (`commit: 'manual'`) — an
 * Apply/Cancel bar at the bottom. With instant filters the bar never shows and
 * every click applies immediately.
 */
export function FacetPanel({
  className,
  filters,
  isDirty,
  isFiltered,
  onApply,
  onCancel,
  onClearAll,
  renderEditor
}: {
  className?: string;
  filters: ResolvedFilter[];
  /** From `useFilters` — enables the Apply/Cancel bar for manual filters. */
  isDirty?: boolean;
  isFiltered?: boolean;
  onApply?: () => void;
  onCancel?: () => void;
  /** Wire to the hook's `instantReset`. Omit to hide the Clear button. */
  onClearAll?: () => void;
  /** Override the editor for specific filters (e.g. a price slider). */
  renderEditor?: (filter: ResolvedFilter) => ReactNode | undefined;
}) {
  return (
    <aside className={cn('flex flex-col gap-5', className)}>
      <div className='flex items-center gap-2'>
        <SlidersHorizontal className='text-muted-foreground size-4' />
        <span className='text-sm font-medium'>Filters</span>
        {isFiltered && onClearAll && (
          <Button className='ml-auto' size='sm' variant='ghost' onClick={onClearAll}>
            <X className='size-3' /> Clear
          </Button>
        )}
      </div>

      {filters.map((filter, index) => (
        <div key={filter.key} className='flex flex-col gap-5'>
          {index > 0 && <Separator />}
          <div className='flex flex-col gap-2'>
            {/* Boolean editors carry their own label row. */}
            {filter.type !== 'boolean' && (
              <Label className='text-muted-foreground text-xs tracking-wide uppercase'>
                {filter.label}
              </Label>
            )}
            <FacetEditor filter={filter} renderEditor={renderEditor} />
          </div>
        </div>
      ))}

      {isDirty && onApply && (
        <div className='bg-background sticky bottom-0 flex gap-2 border-t pt-3'>
          {onCancel && (
            <Button className='flex-1' variant='outline' onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button className='flex-1' onClick={onApply}>
            Apply
          </Button>
        </div>
      )}
    </aside>
  );
}
