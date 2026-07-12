import type { FilterOption, ResolvedFilter } from '@mbsatimov/use-filters';

import { createFilters } from '@mbsatimov/use-filters';
import * as React from 'react';

const { useFilters, f } = createFilters();

/** A fake "server" for the async filters — filters a static list with a delay. */
const CITIES = [
  { label: 'Tashkent', value: 1 },
  { label: 'Samarkand', value: 2 },
  { label: 'Bukhara', value: 3 },
  { label: 'Namangan', value: 4 },
  { label: 'Andijan', value: 5 },
  { label: 'Fergana', value: 6 }
];
const loadCities = (search: string): Promise<FilterOption[]> =>
  new Promise((resolve) => {
    setTimeout(() => {
      const q = search.trim().toLowerCase();
      resolve(CITIES.filter((c) => c.label.toLowerCase().includes(q)));
    }, 300);
  });

const statusOptions: FilterOption[] = [
  { label: 'Open', value: 'open' },
  { label: 'In progress', value: 'in_progress' },
  { label: 'Closed', value: 'closed' }
];
const tagOptions: FilterOption[] = [
  { label: 'Bug', value: 'bug' },
  { label: 'Feature', value: 'feature' },
  { label: 'Docs', value: 'docs' },
  { label: 'Chore', value: 'chore' }
];

const REPO = 'https://github.com/mbsatimov/use-filters';
// GitHub uses `/tree/` for directories, `/blob/` for files.
const SRC_DIR = `${REPO}/tree/main/playground`;
const APP_TSX = `${REPO}/blob/main/playground/App.tsx`;

/**
 * The exact `useFilters` call powering this page, shown inline so the deployed
 * demo teaches the API on its own. Keep in sync with `App()` below.
 */
const CONFIG_SNIPPET = `const {
  params,     // committed values + pagination — your fetch input & query key
  filters,    // resolved filters to render (excludes hidden)
  filterMap,  // same, keyed by config key (includes hidden)
  isDirty,    // a change hasn't reached params yet (debounce pending / awaiting apply)
  apply,      // commit all pending changes now
  cancel,     // discard pending changes
  reset       // clear every filter
} = useFilters({
  // 'commit' controls WHEN a change reaches params/the URL:
  q:      f.text({ label: 'Search', commit: { debounce: 500 } }), // commit 500ms after last keystroke
  status: f.select({ label: 'Status', options, commit: 'manual' }), // commit only on apply()
  city:   f.asyncSelect({ label: 'City', loadOptions, commit: 'manual' }),

  // Default commit is 'instant' — one filter per kind:
  min_amount: f.number({ label: 'Min amount' }),
  price:      f.numberRange({ label: 'Price range' }),
  active:     f.boolean({ label: 'Active' }),
  created:    f.date({ label: 'Created on' }),
  period:     f.dateRange({ label: 'Period' }),
  opens_at:   f.time({ label: 'Opens at' }),
  hours:      f.timeRange({ label: 'Business hours' }),
  labels:     f.multiSelect({ label: 'Labels', options }),
  keywords:   f.tags({ label: 'Keywords' }),
  owners:     f.asyncMultiSelect({ label: 'Owners', loadOptions })
});`;

export function App() {
  const filters = useFilters({
    // Commit modes are the stars of the show:
    q: f.text({ label: 'Search', placeholder: 'debounced 500ms…', commit: { debounce: 500 } }),
    status: f.select({ label: 'Status (manual)', options: statusOptions, commit: 'manual' }),
    city: f.asyncSelect({
      label: 'City (manual, async)',
      loadOptions: loadCities,
      commit: 'manual'
    }),

    // The rest are plain instant filters, one per kind:
    min_amount: f.number({ label: 'Min amount', unit: '$' }),
    price: f.numberRange({ label: 'Price range', unit: '$' }),
    active: f.boolean({ label: 'Active', trueLabel: 'Active', falseLabel: 'Archived' }),
    created: f.date({ label: 'Created on' }),
    period: f.dateRange({ label: 'Period' }),
    opens_at: f.time({ label: 'Opens at' }),
    hours: f.timeRange({ label: 'Business hours' }),
    labels: f.multiSelect({ label: 'Labels', options: tagOptions }),
    keywords: f.tags({ label: 'Keywords', placeholder: 'type + Enter' }),
    owners: f.asyncMultiSelect({ label: 'Owners (async)', loadOptions: loadCities })
  });

  const { params, filters: list, filterMap, isFiltered, isDirty, apply, cancel, reset } = filters;

  return (
    <div className='wrap'>
      <header>
        <h1>use-filters · playground</h1>
        <p>
          Every filter kind + the three commit modes. Watch the URL, <code>params</code>, and{' '}
          <code>isDirty</code> as you interact.
        </p>
        <p className='links'>
          <a href={APP_TSX} target='_blank' rel='noreferrer'>
            ↗ App.tsx (this page)
          </a>
          <a href={SRC_DIR} target='_blank' rel='noreferrer'>
            ↗ playground source
          </a>
          <a href={REPO} target='_blank' rel='noreferrer'>
            ↗ package on GitHub
          </a>
        </p>
        <details className='source'>
          <summary>The config behind this demo</summary>
          <pre>{CONFIG_SNIPPET}</pre>
          <p className='hint'>
            See{' '}
            <a href={APP_TSX} target='_blank' rel='noreferrer'>
              App.tsx
            </a>{' '}
            for how each <code>filter</code> is rendered (one <code>case</code> per kind).
          </p>
        </details>
      </header>

      <div className='layout'>
        <div className='panel'>
          <h2>Filters</h2>
          {list.map((filter) => (
            <Field
              key={filter.key}
              filter={filter}
              committed={(params as Record<string, unknown>)[filter.key]}
            />
          ))}
        </div>

        <div className='panel toolbar'>
          <h2>State</h2>
          <div className='actions'>
            <button className='primary' disabled={!isDirty} onClick={apply}>
              Apply
            </button>
            <button disabled={!isDirty} onClick={cancel}>
              Cancel
            </button>
            <button disabled={!isFiltered && !isDirty} onClick={reset}>
              Reset all
            </button>
          </div>

          <div className='stat'>
            <span>isDirty</span>
            <b className={isDirty ? 'yes' : 'no'}>{String(isDirty)}</b>
          </div>
          <div className='stat'>
            <span>isFiltered</span>
            <b className={isFiltered ? 'yes' : 'no'}>{String(isFiltered)}</b>
          </div>

          <p className='hint' style={{ marginTop: 12 }}>
            <code>params</code> (committed — your query key):
          </p>
          <pre>{JSON.stringify(params, null, 2)}</pre>

          <p className='hint'>
            Live draft values (<code>filterMap[key].value</code>):
          </p>
          <pre>
            {JSON.stringify(
              Object.fromEntries(Object.entries(filterMap).map(([k, v]) => [k, v.value])),
              null,
              2
            )}
          </pre>
        </div>
      </div>
    </div>
  );
}

/** One labelled row: header (label + commit-mode badge + pending dot) and the control. */
function Field({ filter, committed }: { filter: ResolvedFilter; committed: unknown }) {
  const mode = filter.commit ?? 'instant';
  const modeLabel =
    mode === 'instant' ? null : typeof mode === 'object' ? `debounce ${mode.debounce}ms` : 'manual';
  const modeClass =
    typeof mode === 'object' ? 'mode-debounce' : mode === 'manual' ? 'mode-manual' : '';
  // The draft differs from the committed value while a change is pending.
  const pending = JSON.stringify(filter.value ?? null) !== JSON.stringify(committed ?? null);

  return (
    <div className='field'>
      <div className='field-head'>
        <span className='field-label'>{filter.label}</span>
        {modeLabel && <span className={`badge ${modeClass}`}>{modeLabel}</span>}
        {pending && <span className='badge dirty'>pending</span>}
        <button className='clear' onClick={filter.onClear}>
          clear
        </button>
      </div>
      <Control filter={filter} />
    </div>
  );
}

/** Renders the right input for each filter kind — mirrors the README's switch. */
function Control({ filter }: { filter: ResolvedFilter }) {
  switch (filter.type) {
    case 'text':
      return (
        <input
          type='text'
          placeholder={filter.placeholder ?? filter.label}
          value={filter.value ?? ''}
          onChange={(e) => filter.onChange(e.target.value || null)}
        />
      );

    case 'number':
      return (
        <input
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
        <div className='row'>
          {[
            { label: filter.trueLabel ?? 'True', v: true },
            { label: filter.falseLabel ?? 'False', v: false }
          ].map((o) => (
            <button
              key={String(o.v)}
              className={`chip ${filter.value === o.v ? 'on' : ''}`}
              onClick={() => filter.onChange(filter.value === o.v ? null : o.v)}
            >
              {o.label}
            </button>
          ))}
        </div>
      );

    case 'date':
      return (
        <input
          type='date'
          value={filter.value ?? ''}
          onChange={(e) => filter.onChange(e.target.value || null)}
        />
      );

    case 'dateRange':
      return <RangeInput type='date' value={filter.value} onChange={filter.onChange} />;

    case 'time':
      return (
        <input
          type='time'
          value={filter.value ?? ''}
          onChange={(e) => filter.onChange(e.target.value || null)}
        />
      );

    case 'timeRange':
      return <RangeInput type='time' value={filter.value} onChange={filter.onChange} />;

    case 'select':
      return (
        <select
          value={(filter.value as string) ?? ''}
          onChange={(e) => filter.onChange(e.target.value || null)}
        >
          <option value=''>{filter.placeholder ?? '— any —'}</option>
          {filter.options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      );

    case 'multiSelect': {
      const selected = (filter.value as (number | string)[] | null) ?? [];
      return (
        <div className='row'>
          {filter.options.map((o) => {
            const on = selected.includes(o.value);
            return (
              <button
                key={o.value}
                className={`chip ${on ? 'on' : ''}`}
                onClick={() => {
                  const next = on ? selected.filter((v) => v !== o.value) : [...selected, o.value];
                  filter.onChange(next.length ? (next as string[]) : null);
                }}
              >
                {o.label}
              </button>
            );
          })}
        </div>
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
      return <span className='hint'>no control for “{(filter as ResolvedFilter).type}”</span>;
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
    <div className='row'>
      <input
        type={type}
        value={String(from ?? '')}
        onChange={(e) => set([e.target.value, String(to ?? '')])}
      />
      <span className='hint'>to</span>
      <input
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
    <div className='row' style={{ flexDirection: 'column', alignItems: 'stretch' }}>
      <input
        type='text'
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
        <div className='tags'>
          {tags.map((t, i) => (
            <span key={`${t}-${i}`} className='tag'>
              {t}
              <button
                onClick={() =>
                  onChange(
                    tags.filter((_, j) => j !== i).length ? tags.filter((_, j) => j !== i) : null
                  )
                }
              >
                ×
              </button>
            </span>
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
    <div className='row' style={{ flexDirection: 'column', alignItems: 'stretch' }}>
      {selected ? (
        <div className='tags'>
          <span className='tag'>
            {selected.label ?? selected.value}
            <button onClick={() => filter.onSelectOption(null)}>×</button>
          </span>
        </div>
      ) : (
        <input
          type='text'
          placeholder='search a city…'
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      )}
      {!selected && (
        <div className='row'>
          {results.map((o) => (
            <button key={o.value} className='chip' onClick={() => filter.onSelectOption(o)}>
              {o.label}
            </button>
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
    <div className='row' style={{ flexDirection: 'column', alignItems: 'stretch' }}>
      <input
        type='text'
        placeholder='search cities…'
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <div className='row'>
        {results.map((o) => (
          <button
            key={o.value}
            className={`chip ${selectedValues.includes(o.value) ? 'on' : ''}`}
            onClick={() => filter.onToggleOption(o)}
          >
            {o.label}
          </button>
        ))}
      </div>
      {filter.selectedOptions.length > 0 && (
        <div className='tags'>
          {filter.selectedOptions.map((o) => (
            <span key={o.value} className='tag'>
              {o.label ?? o.value}
              <button
                onClick={() =>
                  filter.onToggleOption({ label: o.label ?? String(o.value), value: o.value })
                }
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
