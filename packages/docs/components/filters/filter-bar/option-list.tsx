'use client';

import type { FilterOption } from '@mbsatimov/use-filters';
import type * as React from 'react';

import { Loader2Icon } from 'lucide-react';

import { Checkbox } from '@/components/ui/checkbox';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@/components/ui/command';

interface OptionListProps {
  /** Text shown when there are no options. */
  emptyText?: string;
  /** Show a spinner instead of the list (async fetch in flight). */
  isPending?: boolean;
  options: readonly FilterOption[];
  placeholder?: string;
  /** Show the search box with client-side filtering. Ignored when `serverSearch` is set. */
  searchable?: boolean;
  /**
   * Controlled search for server-filtered lists (async filters): cmdk stops
   * filtering locally and the parent fetches per keystroke.
   */
  serverSearch?: { onChange: (value: string) => void; value: string };
  /** Toggle an option. */
  onSelect: (option: FilterOption) => void;
  /**
   * Content rendered at the start of each row, before the label. Defaults to
   * the checkbox. Override to swap in a radio dot, a color swatch, an avatar,
   * etc. — return `null` to render nothing.
   */
  renderLeft?: (option: FilterOption) => React.ReactNode;
  /**
   * Content rendered at the end of each row, after the label. Defaults to the
   * option's `count` badge (or nothing when `count` is unset).
   */
  renderRight?: (option: FilterOption) => React.ReactNode;
  /** Whether an option is currently selected (drives its checkbox). */
  selected: (option: FilterOption) => boolean;
}

/**
 * The one option-row list shared by every choice-style filter editor — static
 * or async, single or multi. Owns nothing: selection state, search and clearing
 * are all driven by props, so the same rows render in a popover or a drawer.
 */
export const OptionList = ({
  emptyText = 'No results.',
  isPending,
  onSelect,
  options,
  placeholder = 'Search…',
  renderLeft,
  renderRight,
  searchable = true,
  selected,
  serverSearch
}: OptionListProps) => {
  const left = renderLeft ?? ((option: FilterOption) => <Checkbox checked={selected(option)} />);
  const right =
    renderRight ??
    ((option: FilterOption) =>
      option.count !== undefined && (
        <span className='ml-auto font-mono text-xs'>{option.count}</span>
      ));

  return (
    // The server already filtered — cmdk must not filter again.
    <Command shouldFilter={!serverSearch}>
      {serverSearch ? (
        <CommandInput
          autoFocus
          placeholder={placeholder}
          value={serverSearch.value}
          onValueChange={serverSearch.onChange}
        />
      ) : (
        searchable && <CommandInput autoFocus placeholder={placeholder} />
      )}
      <CommandList>
        {isPending ? (
          <div className='flex items-center justify-center py-6'>
            <Loader2Icon className='text-muted-foreground size-4 animate-spin' />
          </div>
        ) : (
          <>
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup className='max-h-72 overflow-y-auto'>
              {options.map((option) => (
                <CommandItem
                  key={String(option.value)}
                  showCheckIcon={false}
                  value={serverSearch ? String(option.value) : option.label}
                  onSelect={() => onSelect(option)}
                >
                  {left(option)}
                  <span className='flex-1 truncate'>{option.label}</span>
                  {right(option)}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </Command>
  );
};
