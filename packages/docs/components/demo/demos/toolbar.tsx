'use client';

import { f, type ResolvedFilter, useFilters } from '@mbsatimov/use-filters';

import { JsonPreview } from '@/components/json-preview';
import { DemoWindow } from '@/components/demo-window';
import { Button } from '@/components/ui/button';
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

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
        <Input
          placeholder={filter.label}
          value={filter.value ?? ''}
          onChange={(e) => filter.onChange(e.target.value || null)}
        />
      );
    case 'select':
      return (
        <Select
          value={filter.value == null ? 'all' : String(filter.value)}
          onValueChange={(v) => filter.onChange(v === 'all' ? null : v)}
        >
          <SelectTrigger className='w-full'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>Any</SelectItem>
            {filter.options.map((o) => (
              <SelectItem key={String(o.value)} value={String(o.value)}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    case 'multiSelect':
      return (
        <ToggleGroup
          type='multiple'
          variant='outline'
          value={(filter.value ?? []).map(String)}
          onValueChange={(next) => filter.onChange(next.length ? next : null)}
        >
          {filter.options.map((o) => (
            <ToggleGroupItem key={String(o.value)} value={String(o.value)}>
              {o.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      );
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
      <div className='flex flex-col gap-4'>
        {filters.map((filter) => (
          <Field key={filter.key}>
            <FieldLabel>{filter.label}</FieldLabel>
            <Control filter={filter} />
          </Field>
        ))}
        {isFiltered && (
          <Button variant='outline' onClick={reset} className='w-fit'>
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
    <DemoWindow>
      <Inner />
    </DemoWindow>
  );
}
