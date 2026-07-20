'use client';

import { type FilterConfig, f, useFilters } from '@mbsatimov/use-filters';
import { useMemo } from 'react';

import { DemoFrame } from '@/components/demo/demo-frame';
import { Button, Field, JsonPreview, SelectInput, ToggleGroup } from '@/components/demo/controls';

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
      <div className='flex flex-col gap-3'>
        {FACETS.map((facet) => {
          const filter = filterMap[facet.key];
          // The config is dynamic, so `filter` is the wide ResolvedFilter union
          // whose `onChange` param collapses — set through a permissive handler.
          const setValue = filter.onChange as (value: string | string[] | null) => void;
          return (
            <Field key={facet.key} label={facet.label}>
              {facet.type === 'select' ? (
                <SelectInput
                  value={(filter.value as string) ?? ''}
                  onChange={(v) => setValue(v || null)}
                  options={facet.values}
                />
              ) : (
                <ToggleGroup
                  options={facet.values}
                  selected={((filter.value as string[]) ?? []).map(String)}
                  onToggle={(v) => {
                    const cur = ((filter.value as string[]) ?? []).map(String);
                    const next = cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v];
                    setValue(next.length ? next : null);
                  }}
                />
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
    <DemoFrame>
      <Inner />
    </DemoFrame>
  );
}
