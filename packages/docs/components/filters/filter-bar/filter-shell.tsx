'use client';

import type * as React from 'react';

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface FilterShellProps {
  children: React.ReactNode;
  /** Extra classes for the popover (e.g. width). */
  contentClassName?: string;
  open: boolean;
  /** The chip (or any button) that opens the filter. */
  trigger: React.ReactNode;
  onOpenChange: (open: boolean) => void;
}

/** Anchored popover container for a filter's editor. */
export const FilterShell = ({
  children,
  contentClassName,
  onOpenChange,
  open,
  trigger
}: FilterShellProps) => (
  <Popover open={open} onOpenChange={onOpenChange}>
    <PopoverTrigger asChild>{trigger}</PopoverTrigger>
    <PopoverContent
      align='start'
      className={cn('p-0', contentClassName)}
      onFocusOutside={(event) => event.preventDefault()}
    >
      {children}
    </PopoverContent>
  </Popover>
);
