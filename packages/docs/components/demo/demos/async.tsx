'use client';

import { f, type FilterOption, useFilters } from '@mbsatimov/use-filters';
import { X } from 'lucide-react';
import { useEffect, useState } from 'react';

import { JsonPreview } from '@/components/json-preview';
import { DemoWindow } from '@/components/demo-window';
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

// A stand-in for a server call: filters a static list after a short delay.
const loadUsers = (search: string): Promise<FilterOption[]> =>
  new Promise((resolve) => {
    setTimeout(() => {
      const q = search.trim().toLowerCase();
      resolve(USERS.filter((u) => u.label.toLowerCase().includes(q)));
    }, 250);
  });

function Inner() {
  const { params, filterMap } = useFilters({
    assignee: f.asyncSelect({ label: 'Assignee', valueType: 'number', loadOptions: loadUsers })
  });
  const assignee = filterMap.assignee;

  const [search, setSearch] = useState('');
  const [results, setResults] = useState<FilterOption[]>([]);

  useEffect(() => {
    const controller = new AbortController();
    assignee
      .loadOptions?.(search, controller.signal)
      .then(setResults)
      .catch(() => {});
    return () => controller.abort();
  }, [search, assignee.loadOptions]);

  return (
    <div className='grid gap-4 sm:grid-cols-2'>
      <div className='flex flex-col gap-4'>
        <Field>
          <FieldLabel htmlFor='assignee'>Assignee (asyncSelect)</FieldLabel>
          {assignee.selectedOption ? (
            <div className='flex items-center justify-between rounded-md border px-3 py-1.5 text-sm'>
              <span>{assignee.selectedOption.label}</span>
              <Button
                variant='ghost'
                size='icon-xs'
                aria-label='Clear'
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
                variant='outline'
                size='sm'
                onClick={() => {
                  assignee.onSelectOption(o);
                  setSearch('');
                }}
              >
                {o.label}
              </Button>
            ))}
          </div>
        )}
      </div>
      <JsonPreview value={params} />
    </div>
  );
}

export function AsyncDemo() {
  return (
    <DemoWindow>
      <Inner />
    </DemoWindow>
  );
}
