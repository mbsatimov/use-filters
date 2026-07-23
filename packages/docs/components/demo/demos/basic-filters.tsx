'use client';

import { f, useFilters } from '@mbsatimov/use-filters';

import { JsonPreview } from '@/components/json-preview';
import { DemoWindow } from '@/components/demo-window';
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
  const { params, filterMap } = useFilters({
    search: f.text({ label: 'Search' }),
    status: f.select({ label: 'Status', valueType: 'string', options: statusOptions })
  });

  return (
    <div className='grid gap-4 sm:grid-cols-2'>
      <div className='flex flex-col gap-4'>
        <Field>
          <FieldLabel htmlFor='search'>Search</FieldLabel>
          <Input
            id='search'
            placeholder='Search…'
            value={filterMap.search.value ?? ''}
            onChange={(e) => filterMap.search.onChange(e.target.value || null)}
          />
        </Field>
        <Field>
          <FieldLabel>Status</FieldLabel>
          <Select
            value={filterMap.status.value ?? 'all'}
            onValueChange={(v) => filterMap.status.onChange(v === 'all' ? null : v)}
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
      </div>
      <JsonPreview value={params} />
    </div>
  );
}

export function BasicFiltersDemo() {
  return (
    <DemoWindow>
      <Inner />
    </DemoWindow>
  );
}
