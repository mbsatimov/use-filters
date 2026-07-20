'use client';

import { f, useFilters } from '@mbsatimov/use-filters';

import { DemoFrame } from '@/components/demo/demo-frame';
import { Button, Field, JsonPreview, SelectInput, TextInput } from '@/components/demo/controls';

const statusOptions = [
  { label: 'Open', value: 'open' },
  { label: 'Closed', value: 'closed' }
];

function Inner() {
  const { params, filterMap, isDirty, apply, cancel } = useFilters({
    search: f.text({ label: 'Search', commit: { debounce: 600 } }),
    status: f.select({
      label: 'Status',
      valueType: 'string',
      options: statusOptions,
      commit: 'manual'
    })
  });

  const search = filterMap.search;
  const status = filterMap.status;

  return (
    <div className='grid gap-4 sm:grid-cols-2'>
      <div className='flex flex-col gap-3'>
        <Field label='Search — debounced 600ms'>
          <TextInput
            placeholder='Type…'
            value={search.value ?? ''}
            onChange={(e) => search.onChange(e.target.value || null)}
          />
        </Field>
        <Field label='Status — manual (Apply)'>
          <SelectInput
            value={status.value ?? ''}
            onChange={(v) => status.onChange(v || null)}
            options={statusOptions}
          />
        </Field>
        <div className='flex gap-2'>
          <Button disabled={!isDirty} onClick={apply}>
            Apply
          </Button>
          <Button variant='outline' disabled={!isDirty} onClick={cancel}>
            Cancel
          </Button>
          <span className='self-center text-xs text-fd-muted-foreground'>
            {isDirty ? 'pending changes…' : 'in sync'}
          </span>
        </div>
      </div>
      <div className='flex flex-col gap-3'>
        <JsonPreview
          label='drafts vs committed'
          value={{
            search: { value: search.value, committed: search.committedValue },
            status: { value: status.value, committed: status.committedValue }
          }}
        />
        <JsonPreview label='params (fetch)' value={params} />
      </div>
    </div>
  );
}

export function CommitModesDemo() {
  return (
    <DemoFrame>
      <Inner />
    </DemoFrame>
  );
}
