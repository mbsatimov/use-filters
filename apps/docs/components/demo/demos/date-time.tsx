'use client';

import { f, useFilters } from '@mbsatimov/use-filters';

import { DemoFrame } from '@/components/demo/demo-frame';
import { Field, JsonPreview, TextInput } from '@/components/demo/controls';

function Inner() {
  const { params, filterMap } = useFilters({
    created: f.date({ label: 'Created on' }),
    opens_at: f.time({ label: 'Opens at' })
  });

  return (
    <div className='grid gap-4 sm:grid-cols-2'>
      <div className='flex flex-col gap-3'>
        <Field label='Created on (date)'>
          <TextInput
            type='date'
            value={filterMap.created.value ?? ''}
            onChange={(e) => filterMap.created.onChange(e.target.value || null)}
          />
        </Field>
        <Field label='Opens at (time)'>
          <TextInput
            type='time'
            value={filterMap.opens_at.value ?? ''}
            onChange={(e) => filterMap.opens_at.onChange(e.target.value || null)}
          />
        </Field>
      </div>
      <JsonPreview value={params} />
    </div>
  );
}

export function DateTimeDemo() {
  return (
    <DemoFrame>
      <Inner />
    </DemoFrame>
  );
}
