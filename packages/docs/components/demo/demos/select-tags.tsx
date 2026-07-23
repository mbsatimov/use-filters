'use client';

import { f, useFilters } from '@mbsatimov/use-filters';
import { X } from 'lucide-react';
import { useState } from 'react';

import { JsonPreview } from '@/components/json-preview';
import { DemoWindow } from '@/components/demo-window';
import { Badge } from '@/components/ui/badge';
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
      <div className='flex flex-col gap-4'>
        <Field>
          <FieldLabel>Status (select)</FieldLabel>
          <Select
            value={filterMap.status.value ?? 'all'}
            onValueChange={(v) => filterMap.status.onChange(v === 'all' ? null : v)}
          >
            <SelectTrigger className='w-full'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>Any status</SelectItem>
              {statusOptions.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field>
          <FieldLabel>Labels (multiSelect)</FieldLabel>
          <ToggleGroup
            type='multiple'
            variant='outline'
            value={selectedLabels}
            onValueChange={(next) => filterMap.labels.onChange(next.length ? next : null)}
          >
            {labelOptions.map((o) => (
              <ToggleGroupItem key={o.value} value={o.value}>
                {o.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </Field>
        <Field>
          <FieldLabel htmlFor='tags'>Tags (freeform — type + Enter)</FieldLabel>
          <Input
            id='tags'
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
          {tags.length > 0 && (
            <div className='flex flex-wrap gap-1.5'>
              {tags.map((tag, i) => (
                <Badge key={`${tag}-${i}`} variant='secondary' className='gap-1'>
                  {tag}
                  <button
                    type='button'
                    aria-label={`Remove ${tag}`}
                    onClick={() => {
                      const next = tags.filter((_, j) => j !== i);
                      filterMap.tags.onChange(next.length ? next : null);
                    }}
                  >
                    <X className='size-3' />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </Field>
      </div>
      <JsonPreview value={params} />
    </div>
  );
}

export function SelectTagsDemo() {
  return (
    <DemoWindow>
      <Inner />
    </DemoWindow>
  );
}
