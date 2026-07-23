'use client';

import { f, useFilters } from '@mbsatimov/use-filters';

import { JsonPreview } from '@/components/json-preview';
import { DemoWindow } from '@/components/demo-window';
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';

function Inner() {
  const { params, filterMap } = useFilters({
    created: f.date({ label: 'Created on' }),
    opens_at: f.time({ label: 'Opens at' })
  });

  return (
    <div className='grid gap-4 sm:grid-cols-2'>
      <div className='flex flex-col gap-4'>
        <Field>
          <FieldLabel htmlFor='created'>Created on (date)</FieldLabel>
          <Input
            id='created'
            type='date'
            value={filterMap.created.value ?? ''}
            onChange={(e) => filterMap.created.onChange(e.target.value || null)}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor='opens-at'>Opens at (time)</FieldLabel>
          <Input
            id='opens-at'
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
    <DemoWindow>
      <Inner />
    </DemoWindow>
  );
}
