'use client';

import type { ResolvedFilterOf } from '@mbsatimov/use-filters';

import { SearchIcon, XIcon } from 'lucide-react';

import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput
} from '@/components/ui/input-group';

/** Inline search input for a `text` filter, with a clear button while active. */
export const TextFilter = ({ filter }: { filter: ResolvedFilterOf<'text'> }) => (
  <InputGroup className='sm:max-w-xs'>
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
