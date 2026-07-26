'use client';

import type { ResolvedFilterOf } from '@mbsatimov/use-filters';

import { SearchIcon, XIcon } from 'lucide-react';

import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput
} from '@/components/ui/input-group';
import { cn } from '@/lib/utils';

/** A standalone search input for a `text` filter. Place it anywhere. */
export const TextFilter = ({
  className,
  filter
}: {
  className?: string;
  filter: ResolvedFilterOf<'text'>;
}) => (
  <InputGroup className={cn('w-56', className)}>
    <InputGroupAddon>
      <SearchIcon />
    </InputGroupAddon>
    <InputGroupInput
      placeholder={filter.placeholder ?? filter.label}
      value={filter.value ?? ''}
      onChange={(event) => filter.onChange(event.target.value || null)}
    />
    {filter.value && (
      <InputGroupAddon align='inline-end'>
        <InputGroupButton aria-label='Clear' size='icon-sm' onClick={() => filter.onChange(null)}>
          <XIcon />
        </InputGroupButton>
      </InputGroupAddon>
    )}
  </InputGroup>
);
