import type { FilterOption, ResolvedFilter } from '@mbsatimov/use-filters';

import { X } from 'lucide-react';
import * as React from 'react';

import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

/** Renders the right input for each filter kind — mirrors the README's switch. */
export function Control({ filter }: { filter: ResolvedFilter }) {
  switch (filter.type) {
    case 'text':
      return (
        <Input
          placeholder={filter.placeholder ?? filter.label}
          value={filter.value ?? ''}
          onChange={(e) => filter.onChange(e.target.value || null)}
        />
      );

    case 'number':
      return (
        <Input
          type='number'
          placeholder={filter.placeholder ?? filter.label}
          value={filter.value ?? ''}
          onChange={(e) => filter.onChange(e.target.value === '' ? null : Number(e.target.value))}
        />
      );

    case 'numberRange':
      return <RangeInput type='number' value={filter.value} onChange={filter.onChange} />;

    case 'boolean':
      return (
        <ToggleGroup
          type='single'
          variant='outline'
          value={filter.value === null ? '' : String(filter.value)}
          onValueChange={(v) => filter.onChange(v === '' ? null : v === 'true')}
        >
          <ToggleGroupItem value='true'>{filter.trueLabel ?? 'True'}</ToggleGroupItem>
          <ToggleGroupItem value='false'>{filter.falseLabel ?? 'False'}</ToggleGroupItem>
        </ToggleGroup>
      );

    case 'date':
      return (
        <Input
          type='date'
          value={filter.value ?? ''}
          onChange={(e) => filter.onChange(e.target.value || null)}
        />
      );

    case 'dateRange':
      return <RangeInput type='date' value={filter.value} onChange={filter.onChange} />;

    case 'time':
      return (
        <Input
          type='time'
          value={filter.value ?? ''}
          onChange={(e) => filter.onChange(e.target.value || null)}
        />
      );

    case 'timeRange':
      return <RangeInput type='time' value={filter.value} onChange={filter.onChange} />;

    case 'select':
      return (
        <Select
          value={filter.value === null ? '__none' : String(filter.value)}
          onValueChange={(v) => filter.onChange(v === '__none' ? null : v)}
        >
          <SelectTrigger className='w-full'>
            <SelectValue placeholder={filter.placeholder ?? '— any —'} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='__none'>— any —</SelectItem>
            {filter.options.map((o) => (
              <SelectItem key={o.value} value={String(o.value)}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );

    case 'multiSelect': {
      const selected = (filter.value as (number | string)[] | null) ?? [];
      return (
        <ToggleGroup
          type='multiple'
          variant='outline'
          className='flex-wrap justify-start'
          value={selected.map(String)}
          onValueChange={(next) => {
            const restored = filter.options
              .filter((o) => next.includes(String(o.value)))
              .map((o) => o.value);
            filter.onChange(restored.length ? (restored as string[]) : null);
          }}
        >
          {filter.options.map((o) => (
            <ToggleGroupItem key={o.value} value={String(o.value)}>
              {o.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      );
    }

    case 'tags':
      return (
        <TagsInput
          value={filter.value}
          onChange={filter.onChange}
          placeholder={filter.placeholder}
        />
      );

    case 'asyncSelect':
      return <AsyncSingle filter={filter} />;

    case 'asyncMultiSelect':
      return <AsyncMulti filter={filter} />;

    default:
      return (
        <span className='text-muted-foreground text-xs'>
          no control for "{(filter as ResolvedFilter).type}"
        </span>
      );
  }
}

function RangeInput({
  type,
  value,
  onChange
}: {
  type: 'date' | 'number' | 'time';
  value: [number | string, number | string] | null;
  // Loose on purpose: one component drives both number- and string-valued
  // ranges, whose `onChange` signatures differ (`[number,number]` vs `[string,string]`).
  onChange: (v: any) => void;
}) {
  const [from, to] = value ?? ['', ''];
  const set = (next: [string, string]) => {
    const empty = next[0] === '' && next[1] === '';
    if (empty) return onChange(null);
    onChange(type === 'number' ? [Number(next[0]), Number(next[1])] : next);
  };
  return (
    <div className='flex items-center gap-2'>
      <Input
        type={type}
        value={String(from ?? '')}
        onChange={(e) => set([e.target.value, String(to ?? '')])}
      />
      <span className='text-muted-foreground shrink-0 text-xs'>to</span>
      <Input
        type={type}
        value={String(to ?? '')}
        onChange={(e) => set([String(from ?? ''), e.target.value])}
      />
    </div>
  );
}

function TagsInput({
  value,
  onChange,
  placeholder
}: {
  value: string[] | null;
  onChange: (v: string[] | null) => void;
  placeholder?: string;
}) {
  const [draft, setDraft] = React.useState('');
  const tags = value ?? [];
  return (
    <div className='flex flex-col gap-2'>
      <Input
        placeholder={placeholder ?? 'add…'}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && draft.trim()) {
            onChange([...tags, draft.trim()]);
            setDraft('');
          }
        }}
      />
      {tags.length > 0 && (
        <div className='flex flex-wrap gap-1.5'>
          {tags.map((t, i) => (
            <Badge key={`${t}-${i}`} variant='secondary' className='gap-1 pr-1'>
              {t}
              <button
                className='hover:text-destructive rounded-full'
                onClick={() => {
                  const next = tags.filter((_, j) => j !== i);
                  onChange(next.length ? next : null);
                }}
              >
                <X className='size-3' />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

/** Shared search box + results list for the async filters. */
function useAsyncSearch(
  loadOptions: (search: string, signal: AbortSignal) => Promise<FilterOption[]>
) {
  const [search, setSearch] = React.useState('');
  const [results, setResults] = React.useState<FilterOption[]>([]);
  React.useEffect(() => {
    const controller = new AbortController();
    loadOptions(search, controller.signal)
      .then(setResults)
      .catch(() => {});
    return () => controller.abort();
  }, [search, loadOptions]);
  return { search, setSearch, results };
}

function AsyncSingle({ filter }: { filter: Extract<ResolvedFilter, { type: 'asyncSelect' }> }) {
  const { search, setSearch, results } = useAsyncSearch(filter.loadOptions);
  const selected = filter.selectedOption;
  return (
    <div className='flex flex-col gap-2'>
      {selected ? (
        <div>
          <Badge variant='secondary' className='gap-1 pr-1'>
            {selected.label ?? selected.value}
            <button
              className='hover:text-destructive rounded-full'
              onClick={() => filter.onSelectOption(null)}
            >
              <X className='size-3' />
            </button>
          </Badge>
        </div>
      ) : (
        <Input
          placeholder='search a city…'
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      )}
      {!selected && results.length > 0 && (
        <div className='flex flex-wrap gap-1.5'>
          {results.map((o) => (
            <Badge
              key={o.value}
              variant='outline'
              className='hover:bg-accent cursor-pointer'
              onClick={() => filter.onSelectOption(o)}
            >
              {o.label}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

function AsyncMulti({ filter }: { filter: Extract<ResolvedFilter, { type: 'asyncMultiSelect' }> }) {
  const { search, setSearch, results } = useAsyncSearch(filter.loadOptions);
  const selectedValues = filter.selectedOptions.map((o) => o.value);
  return (
    <div className='flex flex-col gap-2'>
      <Input
        placeholder='search cities…'
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      {results.length > 0 && (
        <div className='flex flex-wrap gap-1.5'>
          {results.map((o) => (
            <Badge
              key={o.value}
              variant={selectedValues.includes(o.value) ? 'default' : 'outline'}
              className='hover:bg-accent cursor-pointer'
              onClick={() => filter.onToggleOption(o)}
            >
              {o.label}
            </Badge>
          ))}
        </div>
      )}
      {filter.selectedOptions.length > 0 && (
        <div className='flex flex-wrap gap-1.5'>
          {filter.selectedOptions.map((o) => (
            <Badge key={o.value} variant='secondary' className='gap-1 pr-1'>
              {o.label ?? o.value}
              <button
                className='hover:text-destructive rounded-full'
                onClick={() =>
                  filter.onToggleOption({ label: o.label ?? String(o.value), value: o.value })
                }
              >
                <X className='size-3' />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
