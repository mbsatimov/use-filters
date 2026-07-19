'use client';

import { f, type FilterOption, useFilters } from '@mbsatimov/use-filters';
import { useEffect, useState } from 'react';

import { DemoFrame } from '@/components/demo/demo-frame';
import { Field, JsonPreview, TextInput } from '@/components/demo/controls';

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
    assignee: f.asyncSelect({ label: 'Assignee', loadOptions: loadUsers })
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
      <div className='flex flex-col gap-3'>
        <Field label='Assignee (asyncSelect)'>
          {assignee.selectedOption ? (
            <div className='flex items-center justify-between rounded-lg border border-fd-border px-3 py-1.5'>
              <span>{assignee.selectedOption.label}</span>
              <button
                type='button'
                className='text-xs text-fd-muted-foreground hover:text-fd-foreground'
                onClick={() => assignee.onSelectOption(null)}
              >
                clear
              </button>
            </div>
          ) : (
            <TextInput
              placeholder='Search people…'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          )}
        </Field>
        {!assignee.selectedOption && results.length > 0 && (
          <div className='flex flex-wrap gap-1.5'>
            {results.map((o) => (
              <button
                key={o.value}
                type='button'
                className='rounded-full border border-fd-border px-3 py-1 text-xs hover:bg-fd-accent'
                onClick={() => {
                  assignee.onSelectOption(o);
                  setSearch('');
                }}
              >
                {o.label}
              </button>
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
    <DemoFrame>
      <Inner />
    </DemoFrame>
  );
}
