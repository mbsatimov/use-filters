'use client';

import type { ResolvedFilterOf } from '@mbsatimov/use-filters';

import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

/** A standalone numeric input for a `number` filter. Empty clears to `null`. */
export const NumberFilter = ({
  className,
  filter
}: {
  className?: string;
  filter: ResolvedFilterOf<'number'>;
}) => (
  <Input
    className={cn('w-32', className)}
    inputMode='numeric'
    placeholder={filter.placeholder ?? filter.label}
    type='number'
    value={filter.value ?? ''}
    onChange={(event) =>
      filter.onChange(event.target.value === '' ? null : Number(event.target.value))
    }
  />
);
