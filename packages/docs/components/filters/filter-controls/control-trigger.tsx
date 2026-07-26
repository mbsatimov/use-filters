'use client';

import type { ReactNode } from 'react';

import { ChevronDownIcon, XIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * The trigger button every popover-style control shares: the filter's label,
 * the current value (when set), a chevron — and an × to clear, shown only
 * while the filter is active. Clearing never opens the popover.
 */
export const ControlTrigger = ({
  className,
  label,
  onClear,
  value,
  ...props
}: {
  className?: string;
  label: string;
  onClear?: () => void;
  /** The current value shown on the trigger; `null` renders the label alone. */
  value: ReactNode;
} & Omit<React.ComponentProps<typeof Button>, 'value'>) => (
  <Button className={cn('font-normal', className)} variant='outline' {...props}>
    <span className='text-muted-foreground'>{label}</span>
    {value != null && (
      <span className='flex max-w-40 items-center gap-1 truncate font-medium'>{value}</span>
    )}
    {value != null && onClear ? (
      <span
        aria-label={`Clear ${label}`}
        className='hover:text-foreground text-muted-foreground -mr-1 rounded-sm p-0.5'
        role='button'
        tabIndex={0}
        onClick={(event) => {
          event.stopPropagation();
          onClear();
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            event.stopPropagation();
            onClear();
          }
        }}
      >
        <XIcon className='size-3.5' />
      </span>
    ) : (
      <ChevronDownIcon className='text-muted-foreground size-3.5' />
    )}
  </Button>
);
