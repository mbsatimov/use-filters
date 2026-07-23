'use client';

import { f, useFilters } from '@mbsatimov/use-filters';

import { JsonPreview } from '@/components/json-preview';
import { DemoWindow } from '@/components/demo-window';
import { Button } from '@/components/ui/button';
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

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
      <div className='flex flex-col gap-4'>
        <Field>
          <FieldLabel htmlFor='search'>Search — debounced 600ms</FieldLabel>
          <Input
            id='search'
            placeholder='Type…'
            value={search.value ?? ''}
            onChange={(e) => search.onChange(e.target.value || null)}
          />
        </Field>
        <Field>
          <FieldLabel>Status — manual (Apply)</FieldLabel>
          <Select
            value={status.value ?? 'all'}
            onValueChange={(v) => status.onChange(v === 'all' ? null : v)}
          >
            <SelectTrigger className='w-full'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>Any status</SelectItem>
              {statusOptions.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <div className='flex items-center gap-2'>
          <Button disabled={!isDirty} onClick={apply}>
            Apply
          </Button>
          <Button variant='outline' disabled={!isDirty} onClick={cancel}>
            Cancel
          </Button>
          <span className='text-muted-foreground text-xs'>
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
    <DemoWindow>
      <Inner />
    </DemoWindow>
  );
}
