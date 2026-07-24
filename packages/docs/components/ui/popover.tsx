'use client';

import { Popover as PopoverPrimitive } from 'radix-ui';
import * as React from 'react';

import { cn } from '@/lib/utils';

const Popover = ({ ...props }: React.ComponentProps<typeof PopoverPrimitive.Root>) => (
  <PopoverPrimitive.Root data-slot='popover' {...props} />
);

const PopoverTrigger = ({ ...props }: React.ComponentProps<typeof PopoverPrimitive.Trigger>) => (
  <PopoverPrimitive.Trigger data-slot='popover-trigger' {...props} />
);

const PopoverContent = ({
  className,
  align = 'center',
  sideOffset = 4,
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Content>) => (
  <PopoverPrimitive.Portal>
    <PopoverPrimitive.Content
      className={cn(
        'z-50 flex w-72 origin-(--radix-popover-content-transform-origin) flex-col gap-2.5 rounded-lg bg-popover p-2.5 text-sm text-popover-foreground shadow-md ring-1 ring-foreground/10 outline-hidden duration-100 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95',
        className
      )}
      align={align}
      data-slot='popover-content'
      sideOffset={sideOffset}
      {...props}
    />
  </PopoverPrimitive.Portal>
);

const PopoverAnchor = ({ ...props }: React.ComponentProps<typeof PopoverPrimitive.Anchor>) => (
  <PopoverPrimitive.Anchor data-slot='popover-anchor' {...props} />
);

const PopoverHeader = ({ className, ...props }: React.ComponentProps<'div'>) => (
  <div
    className={cn('flex flex-col gap-0.5 text-sm', className)}
    data-slot='popover-header'
    {...props}
  />
);

const PopoverTitle = ({ className, ...props }: React.ComponentProps<'h2'>) => (
  <div className={cn('font-medium', className)} data-slot='popover-title' {...props} />
);

const PopoverDescription = ({ className, ...props }: React.ComponentProps<'p'>) => (
  <p
    className={cn('text-muted-foreground', className)}
    data-slot='popover-description'
    {...props}
  />
);

export {
  Popover,
  PopoverAnchor,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger
};
