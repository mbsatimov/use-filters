'use client';

import { type FilterConfig, f, useFilters } from '@mbsatimov/use-filters';
import { useMemo } from 'react';

import { JsonPreview } from '@/components/json-preview';
import { DemoWindow } from '@/components/demo-window';
import { Field, FieldLabel } from '@/components/ui/field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

// Pretend this came from a backend "facets" endpoint.
const FACETS = [
  {
    key: 'brand',
    label: 'Brand',
    type: 'select' as const,
    values: [
      { label: 'Acme', value: 'acme' },
      { label: 'Globex', value: 'globex' }
    ]
  },
  {
    key: 'color',
    label: 'Color',
    type: 'multiSelect' as const,
    values: [
      { label: 'Red', value: 'red' },
      { label: 'Blue', value: 'blue' },
      { label: 'Green', value: 'green' }
    ]
  }
];

function Inner() {
  // Build the config map from runtime data — memoized on the source.
  const configs = useMemo<Record<string, FilterConfig>>(
    () =>
      Object.fromEntries(
        FACETS.map((facet) =>
          facet.type === 'select'
            ? [
                facet.key,
                f.select({ label: facet.label, valueType: 'string', options: facet.values })
              ]
            : [
                facet.key,
                f.multiSelect({ label: facet.label, valueType: 'string', options: facet.values })
              ]
        )
      ),
    []
  );

  const { params, filterMap } = useFilters(configs);

  return (
    <div className='grid gap-4 sm:grid-cols-2'>
      <div className='flex flex-col gap-4'>
        {FACETS.map((facet) => {
          const filter = filterMap[facet.key];
          // The config is dynamic, so `filter` is the wide ResolvedFilter union
          // whose `onChange` param collapses — set through a permissive handler.
          const setValue = filter.onChange as (value: string | string[] | null) => void;
          return (
            <Field key={facet.key}>
              <FieldLabel>{facet.label}</FieldLabel>
              {facet.type === 'select' ? (
                <Select
                  value={(filter.value as string) ?? 'all'}
                  onValueChange={(v) => setValue(v === 'all' ? null : v)}
                >
                  <SelectTrigger className='w-full'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>Any</SelectItem>
                    {facet.values.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <ToggleGroup
                  type='multiple'
                  variant='outline'
                  value={((filter.value as string[]) ?? []).map(String)}
                  onValueChange={(next) => setValue(next.length ? next : null)}
                >
                  {facet.values.map((o) => (
                    <ToggleGroupItem key={o.value} value={o.value}>
                      {o.label}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              )}
            </Field>
          );
        })}
      </div>
      <JsonPreview value={params} />
    </div>
  );
}

export function DynamicDemo() {
  return (
    <DemoWindow>
      <Inner />
    </DemoWindow>
  );
}
