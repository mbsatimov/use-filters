'use client';

import { f, useFilters } from '@mbsatimov/use-filters';

import { DemoWindow } from '@/components/demo-window';
import { JsonPreview } from '@/components/json-preview';
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';

const Inner = () => {
  const { params, filterMap } = useFilters({
    search: f.text({ label: 'Search' }),
    min_price: f.number({ label: 'Min price' }),
    price: f.numberRange({ label: 'Price range' })
  });

  const [from, to] = filterMap.price.value ?? [null, null];

  return (
    <div className='grid gap-4 sm:grid-cols-2'>
      <div className='flex flex-col gap-4'>
        <Field>
          <FieldLabel htmlFor='search'>Search (text)</FieldLabel>
          <Input
            id='search'
            placeholder='Name…'
            value={filterMap.search.value ?? ''}
            onChange={(e) => filterMap.search.onChange(e.target.value || null)}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor='min-price'>Min price (number)</FieldLabel>
          <Input
            id='min-price'
            placeholder='0'
            type='number'
            value={filterMap.min_price.value ?? ''}
            onChange={(e) =>
              filterMap.min_price.onChange(e.target.value === '' ? null : Number(e.target.value))
            }
          />
        </Field>
        <Field>
          <FieldLabel>Price range (numberRange)</FieldLabel>
          <div className='flex items-center gap-2'>
            <Input
              placeholder='min'
              type='number'
              value={from ?? ''}
              onChange={(e) =>
                filterMap.price.onChange(
                  e.target.value === '' && to == null
                    ? null
                    : [Number(e.target.value || 0), Number(to ?? 0)]
                )
              }
            />
            <span className='text-muted-foreground'>–</span>
            <Input
              placeholder='max'
              type='number'
              value={to ?? ''}
              onChange={(e) =>
                filterMap.price.onChange(
                  e.target.value === '' && from == null
                    ? null
                    : [Number(from ?? 0), Number(e.target.value || 0)]
                )
              }
            />
          </div>
        </Field>
      </div>
      <JsonPreview value={params} />
    </div>
  );
};

export const TextNumberDemo = () => (
  <DemoWindow>
    <Inner />
  </DemoWindow>
);
