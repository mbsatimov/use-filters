'use client';

import type { ResolvedFilter } from '@mbsatimov/use-filters';

import { Check, PlusCircle } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

type MultiSelectFilter = Extract<ResolvedFilter, { type: 'multiSelect' }>;

/**
 * A faceted filter button: dashed until something is selected, with the chosen
 * options rendered as badges on the trigger. It takes any resolved
 * `multiSelect` filter, so one component serves every column.
 */
export function FacetedFilter({ filter }: { filter: MultiSelectFilter }) {
  const selected = new Set((filter.value ?? []).map(String));

  const toggle = (value: unknown) => {
    // Rebuild from `options` so the order stays stable no matter the click order.
    const next = filter.options.filter((option) => {
      const has = selected.has(String(option.value));
      return String(option.value) === String(value) ? !has : has;
    });
    filter.onChange(next.length ? next.map((option) => option.value) : null);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          className={cn('border-dashed', selected.size > 0 && 'border-solid')}
          size='sm'
          variant='outline'
        >
          <PlusCircle className='size-3.5' />
          {filter.label}
          {selected.size > 0 && (
            <>
              <Separator className='mx-0.5 h-4' orientation='vertical' />
              {selected.size > 2 ? (
                <Badge className='rounded-sm px-1 font-normal' variant='secondary'>
                  {selected.size} selected
                </Badge>
              ) : (
                filter.options
                  .filter((option) => selected.has(String(option.value)))
                  .map((option) => (
                    <Badge
                      key={String(option.value)}
                      className='rounded-sm px-1 font-normal'
                      variant='secondary'
                    >
                      {option.label}
                    </Badge>
                  ))
              )}
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align='start' className='w-52 p-0'>
        <Command>
          <CommandInput placeholder={filter.label} />
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
                    onSelect={() => toggle(option.value)}
                  >
                    <span
                      className={cn(
                        'border-input flex size-4 items-center justify-center rounded-sm border',
                        isSelected
                          ? 'bg-primary border-primary text-primary-foreground'
                          : 'opacity-60'
                      )}
                    >
                      {isSelected && <Check className='size-3' />}
                    </span>
                    <span>{option.label}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
            {selected.size > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem
                    className='justify-center text-center'
                    showCheckIcon={false}
                    value='__clear'
                    onSelect={() => filter.onChange(null)}
                  >
                    Clear filter
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
