'use client';

import { f, type ResolvedFilter, useFilters } from '@mbsatimov/use-filters';

import { DemoFrame } from '@/components/demo/demo-frame';
import {
  Button,
  Field,
  JsonPreview,
  SelectInput,
  TextInput,
  ToggleGroup
} from '@/components/demo/controls';

const statusOptions = [
  { label: 'Open', value: 'open' },
  { label: 'Closed', value: 'closed' }
];
const labelOptions = [
  { label: 'Bug', value: 'bug' },
  { label: 'Feature', value: 'feature' }
];

/** Renders one resolved filter based on its `type` — the core of a generic toolbar. */
function Control({ filter }: { filter: ResolvedFilter }) {
  switch (filter.type) {
    case 'text':
      return (
        <TextInput
          placeholder={filter.label}
          value={filter.value ?? ''}
          onChange={(e) => filter.onChange(e.target.value || null)}
        />
      );
    case 'select':
      return (
        <SelectInput
          value={filter.value == null ? '' : String(filter.value)}
          onChange={(v) => filter.onChange(v || null)}
          options={filter.options.map((o) => ({ label: o.label, value: String(o.value) }))}
        />
      );
    case 'multiSelect': {
      const selected = (filter.value ?? []).map(String);
      return (
        <ToggleGroup
          options={filter.options.map((o) => ({ label: o.label, value: String(o.value) }))}
          selected={selected}
          onToggle={(v) => {
            const next = selected.includes(v) ? selected.filter((x) => x !== v) : [...selected, v];
            filter.onChange(next.length ? next : null);
          }}
        />
      );
    }
    default:
      return null;
  }
}

function Inner() {
  const { params, filters, isFiltered, reset } = useFilters({
    search: f.text({ label: 'Search' }),
    status: f.select({ label: 'Status', valueType: 'string', options: statusOptions }),
    labels: f.multiSelect({ label: 'Labels', valueType: 'string', options: labelOptions })
  });

  return (
    <div className='grid gap-4 sm:grid-cols-2'>
      <div className='flex flex-col gap-3'>
        {filters.map((filter) => (
          <Field key={filter.key} label={filter.label}>
            <Control filter={filter} />
          </Field>
        ))}
        {isFiltered && (
          <Button variant='outline' onClick={reset}>
            Clear all filters
          </Button>
        )}
      </div>
      <JsonPreview value={params} />
    </div>
  );
}

export function ToolbarDemo() {
  return (
    <DemoFrame>
      <Inner />
    </DemoFrame>
  );
}
