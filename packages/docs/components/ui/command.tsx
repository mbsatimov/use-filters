'use client';

import { Command as CommandPrimitive } from 'cmdk';
import { CheckIcon, SearchIcon } from 'lucide-react';
import * as React from 'react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { InputGroup, InputGroupAddon } from '@/components/ui/input-group';
import { cn } from '@/lib/utils';

const Command = ({ className, ...props }: React.ComponentProps<typeof CommandPrimitive>) => (
  <CommandPrimitive
    className={cn(
      'flex size-full flex-col overflow-hidden rounded-xl! bg-popover p-1 text-popover-foreground',
      className
    )}
    data-slot='command'
    {...props}
  />
);

const CommandDialog = ({
  title = 'Command Palette',
  description = 'Search for a command to run...',
  children,
  className,
  showCloseButton = false,
  ...props
}: React.ComponentProps<typeof Dialog> & {
  title?: string;
  description?: string;
  className?: string;
  showCloseButton?: boolean;
}) => (
  <Dialog {...props}>
    <DialogHeader className='sr-only'>
      <DialogTitle>{title}</DialogTitle>
      <DialogDescription>{description}</DialogDescription>
    </DialogHeader>
    <DialogContent
      className={cn('top-1/3 translate-y-0 overflow-hidden rounded-xl! p-0', className)}
      showCloseButton={showCloseButton}
    >
      {children}
    </DialogContent>
  </Dialog>
);

const CommandInput = ({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Input>) => (
  <div className='p-1 pb-0' data-slot='command-input-wrapper'>
    <InputGroup className='h-8! rounded-lg! border-input/30 bg-input/30 shadow-none! *:data-[slot=input-group-addon]:pl-2!'>
      <CommandPrimitive.Input
        className={cn(
          'w-full text-sm outline-hidden disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        data-slot='command-input'
        {...props}
      />
      <InputGroupAddon>
        <SearchIcon className='size-4 shrink-0 opacity-50' />
      </InputGroupAddon>
    </InputGroup>
  </div>
);

const CommandList = ({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.List>) => (
  <CommandPrimitive.List
    className={cn(
      'no-scrollbar max-h-72 scroll-py-1 overflow-x-hidden overflow-y-auto outline-none',
      className
    )}
    data-slot='command-list'
    {...props}
  />
);

const CommandEmpty = ({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Empty>) => (
  <CommandPrimitive.Empty
    className={cn('py-6 text-center text-sm', className)}
    data-slot='command-empty'
    {...props}
  />
);

const CommandGroup = ({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Group>) => (
  <CommandPrimitive.Group
    className={cn(
      'overflow-hidden p-1 text-foreground **:[[cmdk-group-heading]]:px-2 **:[[cmdk-group-heading]]:py-1.5 **:[[cmdk-group-heading]]:text-xs **:[[cmdk-group-heading]]:font-medium **:[[cmdk-group-heading]]:text-muted-foreground',
      className
    )}
    data-slot='command-group'
    {...props}
  />
);

const CommandSeparator = ({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Separator>) => (
  <CommandPrimitive.Separator
    className={cn('-mx-1 h-px bg-border', className)}
    data-slot='command-separator'
    {...props}
  />
);

const CommandItem = ({
  className,
  children,
  showCheckIcon = true,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Item> & { showCheckIcon: boolean }) => (
  <CommandPrimitive.Item
    className={cn(
      "group/command-item relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none in-data-[slot=dialog-content]:rounded-lg! data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 data-selected:bg-muted data-selected:text-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 data-selected:*:[svg]:text-foreground",
      className
    )}
    data-slot='command-item'
    {...props}
  >
    {children}
    {showCheckIcon && (
      <CheckIcon className='ml-auto opacity-0 group-has-data-[slot=command-shortcut]/command-item:hidden group-data-[checked=true]/command-item:opacity-100' />
    )}
  </CommandPrimitive.Item>
);

const CommandShortcut = ({ className, ...props }: React.ComponentProps<'span'>) => (
  <span
    className={cn(
      'ml-auto text-xs tracking-widest text-muted-foreground group-data-selected/command-item:text-foreground',
      className
    )}
    data-slot='command-shortcut'
    {...props}
  />
);

export {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut
};
