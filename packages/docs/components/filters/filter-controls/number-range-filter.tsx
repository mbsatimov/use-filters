'use client';

import type { ResolvedFilterOf } from '@mbsatimov/use-filters';

import { useState } from 'react';

import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

import { ControlTrigger } from './control-trigger';

const numberFormat = new Intl.NumberFormat('en-US');

/** A standalone min/max control for a `numberRange` filter. */
export const NumberRangeFilter = ({
  className,
  filter
}: {
  className?: string;
  filter: ResolvedFilterOf<'numberRange'>;
}) => {
  const [min, max] = filter.value ?? [null, null];
  // A range is one value: a half-empty pair stays uncommitted until both ends
  // are filled, and clearing both ends clears the filter.
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

  const value =
    filter.value === null
      ? null
      : `${numberFormat.format(filter.value[0])} – ${numberFormat.format(filter.value[1])}`;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <ControlTrigger
          className={className}
          label={filter.label}
          value={value}
          onClear={() => {
            setDraft(['', '']);
            filter.onChange(null);
          }}
        />
      </PopoverTrigger>
      <PopoverContent align='start' className='w-56 p-2'>
        <div className='flex flex-col gap-2'>
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
      </PopoverContent>
    </Popover>
  );
};
