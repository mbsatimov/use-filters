'use client';

import type { ResolvedFilter } from '@mbsatimov/use-filters';
import type { LucideIcon, LucideProps } from 'lucide-react';
import type { ComponentType, ReactNode } from 'react';

import {
  CalendarIcon,
  CalendarRangeIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  HashIcon,
  ListChecksIcon,
  ListFilterIcon,
  ListIcon,
  TagsIcon,
  ToggleLeftIcon,
  XIcon
} from 'lucide-react';
import * as React from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ButtonGroup } from '@/components/ui/button-group';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

import { FilterEditor, NumberEditor } from './editors';
import { FilterShell } from './filter-shell';
import { hasFilterValue } from './lib';
import { summarize } from './summarize';
import { TextFilter } from './text-filter';

/**
 * The production filter bar: inline search inputs, one dashed "Filters" button
 * with a searchable two-level index, and each active filter as its own
 * editable chip (click the chip to reopen its editor, × to clear it).
 *
 * Everything renders from the `filters` array — add a filter to your
 * `useFilters` config and it appears in the index, edits in a popover, and
 * summarizes itself on a chip.
 */
export interface FilterBarProps {
  /** Right-aligned extras (view menu, actions…). */
  children?: ReactNode;
  className?: string;
  filters: ResolvedFilter[];
  isFiltered?: boolean;
  /** Wire to the hook's `instantReset` for the "Clear" button. Omit to hide it. */
  reset?: () => void;
}

const typeIconMap: Partial<Record<ResolvedFilter['type'], LucideIcon>> = {
  select: ListIcon,
  asyncSelect: ListIcon,
  multiSelect: ListChecksIcon,
  asyncMultiSelect: ListChecksIcon,
  boolean: ToggleLeftIcon,
  date: CalendarIcon,
  dateRange: CalendarRangeIcon,
  number: HashIcon,
  numberRange: HashIcon,
  tags: TagsIcon
};

const FilterTypeIcon = ({
  icon,
  type,
  ...props
}: { icon?: ComponentType; type: ResolvedFilter['type'] } & LucideProps) => {
  const Icon = icon ?? typeIconMap[type] ?? ListIcon;
  return <Icon {...props} />;
};

/** Level one — every filter, searchable, each showing what it currently holds. */
const FilterIndex = ({
  filters,
  onSelect
}: {
  filters: ResolvedFilter[];
  onSelect: (key: string) => void;
}) => (
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
              onSelect={() => onSelect(filter.key)}
            >
              <FilterTypeIcon
                className='text-muted-foreground'
                icon={(filter.meta as { icon?: ComponentType } | undefined)?.icon}
                type={filter.type}
              />
              <span className='min-w-0 flex-1 truncate'>{filter.label}</span>
              {summary && (
                <span className='text-primary flex max-w-28 items-center truncate text-xs'>
                  {summary}
                </span>
              )}
              <ChevronRightIcon className='text-muted-foreground/60' />
            </CommandItem>
          );
        })}
      </CommandGroup>
    </CommandList>
  </Command>
);

/** Level two — one filter's editor with a back/clear header. */
const FilterEditorPane = ({
  close,
  filter,
  onBack
}: {
  close: () => void;
  filter: ResolvedFilter;
  onBack: () => void;
}) => (
  <div>
    <div className='flex h-10 items-center gap-1 border-b px-1.5'>
      <Button aria-label='Back' size='icon-sm' variant='ghost' onClick={onBack}>
        <ChevronLeftIcon />
      </Button>
      <span className='min-w-0 flex-1 truncate text-sm font-medium'>{filter.label}</span>
      {hasFilterValue(filter.value) && (
        <Button
          className='text-muted-foreground h-7 px-2 text-xs'
          size='sm'
          variant='ghost'
          onClick={filter.reset}
        >
          Clear
        </Button>
      )}
    </div>
    {/* Remount on commit so a draft editor reseeds from the applied value. */}
    {filter.type === 'number' ? (
      <div className='p-2'>
        <NumberEditor filter={filter} />
      </div>
    ) : (
      <FilterEditor key={JSON.stringify(filter.committedValue)} close={close} filter={filter} />
    )}

    {/* Filters configured with `commit: 'manual'` hold a draft until Apply. */}
    {filter.isManual && (
      <div className='flex items-center justify-end gap-1 border-t p-2'>
        <Button
          size='sm'
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
          size='sm'
          onClick={() => {
            filter.apply();
            close();
          }}
        >
          Apply
        </Button>
      </div>
    )}
  </div>
);

/** An active filter as an editable chip: click to edit, × to clear. */
const ActiveFilterChip = ({ filter }: { filter: ResolvedFilter }) => {
  const [open, setOpen] = React.useState(false);

  // Dismissing the popover (outside click, Escape) drops an unapplied draft;
  // after Apply nothing is dirty, so this is a no-op.
  const dismiss = () => {
    if (filter.isManual && filter.isDirty) filter.cancel();
    setOpen(false);
  };

  return (
    <ButtonGroup>
      <Popover open={open} onOpenChange={(next) => (next ? setOpen(true) : dismiss())}>
        <PopoverTrigger asChild>
          <Button className='text-sm' variant='secondary'>
            <span className='text-muted-foreground font-normal'>{filter.label}:</span>
            <span className='flex items-center gap-1'>{summarize(filter)}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent align='start' className='w-64 p-0'>
          <FilterEditor
            key={JSON.stringify(filter.committedValue)}
            close={() => setOpen(false)}
            filter={filter}
          />
          {filter.isManual && (
            <div className='flex items-center justify-end gap-1 border-t p-2'>
              <Button size='sm' variant='ghost' onClick={dismiss}>
                Cancel
              </Button>
              <Button
                disabled={!filter.isDirty}
                size='sm'
                onClick={() => {
                  filter.apply();
                  setOpen(false);
                }}
              >
                Apply
              </Button>
            </div>
          )}
        </PopoverContent>
      </Popover>
      <Button
        aria-label={`Clear the ${filter.label} filter`}
        size='icon'
        variant='secondary'
        onClick={filter.reset}
      >
        <XIcon />
      </Button>
    </ButtonGroup>
  );
};

export const FilterBar = ({ children, className, filters, isFiltered, reset }: FilterBarProps) => {
  const inlineFilters = filters.filter((filter) => filter.type === 'text');
  const menuFilters = filters.filter((filter) => filter.type !== 'text');
  const activeFilters = menuFilters.filter((filter) => hasFilterValue(filter.value));

  const [open, setOpen] = React.useState(false);
  const [activeKey, setActiveKey] = React.useState<string | null>(null);
  const activeFilter = menuFilters.find((filter) => filter.key === activeKey);

  const onOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) {
      // Drop any manual draft that was never applied (after Apply nothing is
      // dirty, so this is a no-op), and rewind to the index after the close
      // animation so reopening starts fresh.
      for (const filter of menuFilters) {
        if (filter.isManual && filter.isDirty) filter.cancel();
      }
      setTimeout(setActiveKey, 150, null);
    }
  };

  return (
    <div
      aria-orientation='horizontal'
      className={cn('flex w-full items-start justify-between gap-2', className)}
      role='toolbar'
    >
      <div className='flex flex-1 flex-wrap items-center gap-2'>
        {inlineFilters.map((filter) => (
          <TextFilter key={filter.key} filter={filter} />
        ))}

        {menuFilters.length > 0 && (
          <FilterShell
            trigger={
              <Button className='border-dashed' variant='outline'>
                <ListFilterIcon />
                Filters
                {activeFilters.length > 0 && (
                  <Badge className='rounded-sm px-1.5 font-normal' variant='secondary'>
                    {activeFilters.length}
                  </Badge>
                )}
              </Button>
            }
            contentClassName='w-64'
            open={open}
            onOpenChange={onOpenChange}
          >
            {activeFilter ? (
              <FilterEditorPane
                close={() => onOpenChange(false)}
                filter={activeFilter}
                onBack={() => setActiveKey(null)}
              />
            ) : (
              <FilterIndex filters={menuFilters} onSelect={setActiveKey} />
            )}
          </FilterShell>
        )}

        {activeFilters.map((filter) => (
          <ActiveFilterChip key={filter.key} filter={filter} />
        ))}

        {isFiltered && reset && (
          <Button
            aria-label='Clear all filters'
            className='text-destructive hover:text-destructive border-dashed'
            variant='outline'
            onClick={reset}
          >
            <XIcon />
            Clear
          </Button>
        )}
      </div>
      {children && <div className='flex items-center gap-2'>{children}</div>}
    </div>
  );
};
