'use client';

import { f, useFilters } from '@mbsatimov/use-filters';

import { JsonPreview } from '@/components/json-preview';
import { DemoWindow } from '@/components/demo-window';
import { Field, FieldLabel } from '@/components/ui/field';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

function Inner() {
  const { params, filterMap } = useFilters({
    in_stock: f.boolean({ label: 'In stock', trueLabel: 'In stock', falseLabel: 'Sold out' })
  });

  const value = filterMap.in_stock.value;

  return (
    <div className='grid gap-4 sm:grid-cols-2'>
      <Field>
        <FieldLabel>In stock (boolean)</FieldLabel>
        <ToggleGroup
          type='single'
          variant='outline'
          value={value === null ? '' : String(value)}
          onValueChange={(v) => filterMap.in_stock.onChange(v === '' ? null : v === 'true')}
        >
          <ToggleGroupItem value='true'>In stock</ToggleGroupItem>
          <ToggleGroupItem value='false'>Sold out</ToggleGroupItem>
        </ToggleGroup>
      </Field>
      <JsonPreview value={params} />
    </div>
  );
}

export function BooleanDemo() {
  return (
    <DemoWindow>
      <Inner />
    </DemoWindow>
  );
}
