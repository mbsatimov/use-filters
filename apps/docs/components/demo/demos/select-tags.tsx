'use client';

import { f, useFilters } from '@mbsatimov/use-filters';
import { useState } from 'react';

import { DemoFrame } from '@/components/demo/demo-frame';
import {
  Field,
  JsonPreview,
  SelectInput,
  TextInput,
  ToggleGroup
} from '@/components/demo/controls';

const statusOptions = [
  { label: 'Open', value: 'open' },
  { label: 'Closed', value: 'closed' },
  { label: 'Archived', value: 'archived' }
];

const labelOptions = [
  { label: 'Bug', value: 'bug' },
  { label: 'Feature', value: 'feature' },
  { label: 'Docs', value: 'docs' }
];

function Inner() {
  const { params, filterMap } = useFilters({
    status: f.select({ label: 'Status', valueType: 'string', options: statusOptions }),
    labels: f.multiSelect({ label: 'Labels', valueType: 'string', options: labelOptions }),
    tags: f.tags({ label: 'Tags' })
  });

  const [draft, setDraft] = useState('');
  const selectedLabels = (filterMap.labels.value ?? []).map(String);
  const tags = filterMap.tags.value ?? [];

  return (
    <div className='grid gap-4 sm:grid-cols-2'>
      <div className='flex flex-col gap-3'>
        <Field label='Status (select)'>
          <SelectInput
            value={filterMap.status.value ?? ''}
            onChange={(v) => filterMap.status.onChange(v || null)}
            options={statusOptions}
          />
        </Field>
        <Field label='Labels (multiSelect)'>
          <ToggleGroup
            options={labelOptions}
            selected={selectedLabels}
            onToggle={(v) => {
              const next = selectedLabels.includes(v)
                ? selectedLabels.filter((x) => x !== v)
                : [...selectedLabels, v];
              filterMap.labels.onChange(next.length ? next : null);
            }}
          />
        </Field>
        <Field label='Tags (freeform — type + Enter)'>
          <TextInput
            placeholder='Add a tag…'
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && draft.trim()) {
                filterMap.tags.onChange([...tags, draft.trim()]);
                setDraft('');
              }
            }}
          />
        </Field>
      </div>
      <JsonPreview value={params} />
    </div>
  );
}

export function SelectTagsDemo() {
  return (
    <DemoFrame>
      <Inner />
    </DemoFrame>
  );
}
