'use client';

import type { FilterOption, OptionsCursor, OptionsPage } from '@mbsatimov/use-filters';

import { f, useFilters } from '@mbsatimov/use-filters';
import { X } from 'lucide-react';
import { useEffect, useState } from 'react';

import { DemoWindow } from '@/components/demo-window';
import { JsonPreview } from '@/components/json-preview';
import { Button } from '@/components/ui/button';
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';

const USERS = [
  { value: 1, label: 'Ada Lovelace' },
  { value: 2, label: 'Alan Turing' },
  { value: 3, label: 'Grace Hopper' },
  { value: 4, label: 'Katherine Johnson' },
  { value: 5, label: 'Edsger Dijkstra' }
];

const PAGE_SIZE = 2;

// A stand-in for a paginated server call: filters a static list after a short
// delay and returns one page. The cursor is simply the next page number.
const loadUsers = ({
  cursor,
  search
}: {
  cursor: OptionsCursor | null;
  search: string;
}): Promise<OptionsPage<number>> =>
  new Promise((resolve) => {
    setTimeout(() => {
      const q = search.trim().toLowerCase();
      const matched = USERS.filter((u) => u.label.toLowerCase().includes(q));
      const page = Number(cursor ?? 1);
      const start = (page - 1) * PAGE_SIZE;
      resolve({
        options: matched.slice(start, start + PAGE_SIZE),
        nextCursor: start + PAGE_SIZE < matched.length ? page + 1 : null
      });
    }, 250);
  });

const Inner = () => {
  const { params, filterMap } = useFilters({
    assignee: f.asyncSelect({ label: 'Assignee', valueType: 'number', loadOptions: loadUsers })
  });
  const assignee = filterMap.assignee;

  const [search, setSearch] = useState('');
  const [results, setResults] = useState<FilterOption<number>[]>([]);
  const [nextCursor, setNextCursor] = useState<OptionsCursor | null>(null);

  // First page: a new search replaces the results.
  useEffect(() => {
    const controller = new AbortController();
    assignee
      .loadOptions({ search, signal: controller.signal, cursor: null })
      .then((page) => {
        setResults(page.options);
        setNextCursor(page.nextCursor ?? null);
      })
      .catch(() => {});
    return () => controller.abort();
  }, [search, assignee.loadOptions]);

  // Next page: pass back the cursor the last page returned, and append.
  const loadMore = () => {
    void assignee
      .loadOptions({ search, signal: new AbortController().signal, cursor: nextCursor })
      .then((page) => {
        setResults((prev) => [...prev, ...page.options]);
        setNextCursor(page.nextCursor ?? null);
      });
  };

  return (
    <div className='grid gap-4 sm:grid-cols-2'>
      <div className='flex flex-col gap-4'>
        <Field>
          <FieldLabel htmlFor='assignee'>Assignee (asyncSelect)</FieldLabel>
          {assignee.selectedOption ? (
            <div className='flex items-center justify-between rounded-md border px-3 py-1.5 text-sm'>
              <span>{assignee.selectedOption.label}</span>
              <Button
                aria-label='Clear'
                size='icon-xs'
                variant='ghost'
                onClick={() => assignee.onSelectOption(null)}
              >
                <X className='size-3' />
              </Button>
            </div>
          ) : (
            <Input
              id='assignee'
              placeholder='Search people…'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          )}
        </Field>
        {!assignee.selectedOption && results.length > 0 && (
          <div className='flex flex-wrap gap-1.5'>
            {results.map((o) => (
              <Button
                key={o.value}
                size='sm'
                variant='outline'
                onClick={() => {
                  assignee.onSelectOption(o);
                  setSearch('');
                }}
              >
                {o.label}
              </Button>
            ))}
            {nextCursor !== null && (
              <Button size='sm' variant='ghost' onClick={loadMore}>
                Load more…
              </Button>
            )}
          </div>
        )}
      </div>
      <JsonPreview value={params} />
    </div>
  );
};

export const AsyncDemo = () => (
  <DemoWindow>
    <Inner />
  </DemoWindow>
);
