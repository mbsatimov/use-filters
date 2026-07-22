'use client';

import { f, useFilters } from '@mbsatimov/use-filters';

import { DemoFrame } from '@/components/demo/demo-frame';
import { Field, JsonPreview, SelectInput, TextInput } from '@/components/demo/controls';

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
      <div className='flex flex-col gap-3'>
        <Field label='Search'>
          <TextInput
            placeholder='Search…'
            value={filterMap.search.value ?? ''}
            onChange={(e) => filterMap.search.onChange(e.target.value || null)}
          />
        </Field>
        <Field label='Status'>
          <SelectInput
            value={filterMap.status.value ?? ''}
            onChange={(v) => filterMap.status.onChange(v || null)}
            options={statusOptions}
          />
        </Field>
      </div>
      <JsonPreview value={params} />
    </div>
  );
}

export function BasicFiltersDemo() {
  return (
    <DemoFrame>
      <Inner />
    </DemoFrame>
  );
}
