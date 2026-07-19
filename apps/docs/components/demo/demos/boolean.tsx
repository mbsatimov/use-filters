'use client';

import { f, useFilters } from '@mbsatimov/use-filters';

import { DemoFrame } from '@/components/demo/demo-frame';
import { Field, JsonPreview, ToggleGroup } from '@/components/demo/controls';

function Inner() {
  const { params, filterMap } = useFilters({
    in_stock: f.boolean({ label: 'In stock', trueLabel: 'In stock', falseLabel: 'Sold out' })
  });

  const value = filterMap.in_stock.value;
  const selected = value === null ? [] : [String(value)];

  return (
    <div className='grid gap-4 sm:grid-cols-2'>
      <Field label='In stock (boolean)'>
        <ToggleGroup
          options={[
            { label: 'In stock', value: 'true' },
            { label: 'Sold out', value: 'false' }
          ]}
          selected={selected}
          onToggle={(v) => {
            const next = v === 'true';
            filterMap.in_stock.onChange(value === next ? null : next);
          }}
        />
      </Field>
      <JsonPreview value={params} />
    </div>
  );
}

export function BooleanDemo() {
  return (
    <DemoFrame>
      <Inner />
    </DemoFrame>
  );
}
