import type { ResolvedFilter } from '@mbsatimov/use-filters';

import { Check, IterationCcw, RotateCcw, RotateCcwKey, Timer, Users, X } from 'lucide-react';

import { Control } from '@/components/controls';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { FILTER_TYPE_ICON } from '@/data/filter-meta';
import { cn } from '@/lib/utils';

/**
 * One filter's full row: icon + label + a compact status cluster (mode,
 * pending dot, per-filter apply/cancel/reset) above its control. Reads
 * mode/dirty state straight off `filter` — no `params` lookup, no
 * `typeof filter.commit === 'object'` checks. That's the point of the
 * `isInstant`/`isDebounced`/`isManual`/`debounceMs`/`isDirty`/`isFilteredDraft`
 * fields, plus `filter.apply()`/`filter.cancel()`/`filter.reset()`.
 */
export function FilterField({ filter }: { filter: ResolvedFilter }) {
  const Icon = FILTER_TYPE_ICON[filter.type];

  return (
    <div className='flex flex-col gap-2 py-4 first:pt-0 last:pb-0'>
      <div className='flex items-center gap-2'>
        <Icon className='text-muted-foreground size-3.5 shrink-0' strokeWidth={2} />
        <label className='text-sm font-medium'>{filter.label}</label>

        <div className='ml-auto flex items-center gap-1.5'>
          {filter.isDirty && (
            <span
              className='bg-warning size-1.5 shrink-0 rounded-full'
              aria-hidden
              title='Uncommitted change'
            />
          )}
          {filter.isManual && <ModeIcon icon={Users} label='Manual — waits for apply()' />}
          {filter.isDebounced && (
            <ModeIcon
              icon={Timer}
              label={`Debounced — commits ${filter.debounceMs}ms after the last change`}
            />
          )}

          {filter.isDirty && (
            <>
              <IconButton label='Apply this filter' onClick={filter.apply}>
                <Check className='text-success size-3.5' />
              </IconButton>
              <IconButton label='Cancel this filter' onClick={filter.cancel}>
                <X className='text-destructive size-3.5' />
              </IconButton>
            </>
          )}
          {/* isFilteredDraft (not isFiltered) so this disappears the instant the
              draft empties — isFiltered would still show the old committed value
              until a manual change is applied. */}
          {filter.isFilteredDraft && (
            <IconButton label='Reset to default' onClick={filter.reset}>
              <RotateCcw className='text-muted-foreground size-3.5' />
            </IconButton>
          )}
          {filter.isFilteredDraft && (
            <IconButton label='Instantly reset to default' onClick={filter.instantReset}>
              <IterationCcw className='text-muted-foreground size-3.5' />
            </IconButton>
          )}
        </div>
      </div>
      <Control filter={filter} />
    </div>
  );
}

function ModeIcon({ icon: Icon, label }: { icon: typeof Timer; label: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className='text-muted-foreground inline-flex'>
          <Icon className='size-3.5' strokeWidth={2} />
        </span>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

function IconButton({
  label,
  onClick,
  children,
  className
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          size='icon-xs'
          variant='ghost'
          className={cn('size-5', className)}
          onClick={onClick}
          aria-label={label}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
