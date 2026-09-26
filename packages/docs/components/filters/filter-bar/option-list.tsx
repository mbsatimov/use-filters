'use client';

import type { FilterOption } from '@mbsatimov/use-filters';
import type * as React from 'react';

import { Loader2Icon } from 'lucide-react';
import { useEffect, useRef } from 'react';

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
  /** More options exist on the server — render the "load more" row. */
  hasMore?: boolean;
  /** A next-page fetch is in flight — the "load more" row shows a spinner. */
  isLoadingMore?: boolean;
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
  /**
   * Fetch the next page. Called when the "load more" row scrolls into view or
   * is picked with the keyboard.
   */
  onLoadMore?: () => void;
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
  hasMore,
  isLoadingMore,
  isPending,
  onLoadMore,
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
              {hasMore && onLoadMore && (
                <LoadMoreItem isLoading={isLoadingMore} onLoadMore={onLoadMore} />
              )}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </Command>
  );
};

/**
 * The last row of a paginated list: loads the next page as soon as it scrolls
 * into view (infinite scroll), and doubles as a keyboard-selectable "Load more"
 * item for users who never scroll.
 */
const LoadMoreItem = ({
  isLoading,
  onLoadMore
}: {
  isLoading?: boolean;
  onLoadMore: () => void;
}) => {
  const ref = useRef<HTMLSpanElement>(null);
  // Read through a ref so the observer isn't torn down on every render.
  const onLoadMoreRef = useRef(onLoadMore);
  onLoadMoreRef.current = onLoadMore;

  // Re-armed after each page lands: a fresh observer reports the row's current
  // visibility, so a page too short to scroll immediately fetches the next one.
  useEffect(() => {
    const node = ref.current;
    if (!node || isLoading) return;
    // A viewport root still accounts for clipping by the scrolling list.
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) onLoadMoreRef.current();
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [isLoading]);

  return (
    <CommandItem
      className='text-muted-foreground justify-center'
      showCheckIcon={false}
      value='__load-more__'
      onSelect={onLoadMore}
    >
      <span ref={ref} className='flex items-center gap-2'>
        {isLoading ? <Loader2Icon className='size-4 animate-spin' /> : 'Load more'}
      </span>
    </CommandItem>
  );
};
