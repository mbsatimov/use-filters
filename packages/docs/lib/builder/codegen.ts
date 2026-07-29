import type { ProjectConfig } from './types';

import { DEFAULTS, isDefaultDateFormat, isDefaultDateTimeFormat, overridesDates } from './types';

/**
 * Emits the files a create command writes.
 *
 * The rule throughout: say nothing the library already assumes. A field left at
 * its default produces no code, so a stock setup generates
 * `createFilters()` — not a config object restating the defaults back at you.
 * That keeps the generated file a readable record of the decisions actually
 * made.
 *
 * Generated files never open with a comment: the shadcn CLI's import transform
 * drops a leading comment above the first import, so documentation goes after.
 */

export interface GeneratedFile {
  content: string;
  /** Tab label. */
  name: string;
  registryType: 'registry:component' | 'registry:lib';
  /** Path written to, relative to the project root. */
  target: string;
}

const INDENT = '  ';

const str = (value: string) => `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;

const nest = (label: string, lines: string[], depth: number) => {
  const pad = INDENT.repeat(depth);
  return `${label}: {\n${lines.map((line) => `${pad}${INDENT}${line}`).join(',\n')}\n${pad}}`;
};

/** The `createFilters({...})` argument, or `''` when everything is stock. */
const factoryArgument = (config: ProjectConfig) => {
  const groups: string[] = [];

  const pagination: string[] = [];
  if (config.pageKey !== DEFAULTS.pageKey) pagination.push(`pageKey: ${str(config.pageKey)}`);
  if (config.perPageKey !== DEFAULTS.perPageKey) {
    pagination.push(`perPageKey: ${str(config.perPageKey)}`);
  }
  if (config.defaultPerPage !== DEFAULTS.defaultPerPage) {
    pagination.push(`defaultPerPage: ${config.defaultPerPage}`);
  }
  if (config.firstPage !== DEFAULTS.firstPage) pagination.push(`firstPage: ${config.firstPage}`);
  if (!config.resetPageOnFilterChange) pagination.push('resetPageOnFilterChange: false');
  if (pagination.length > 0) groups.push(nest('pagination', pagination, 1));

  if (config.arrayFormat !== DEFAULTS.arrayFormat) {
    groups.push(nest('request', [`arrayFormat: ${str(config.arrayFormat)}`], 1));
  }
  if (config.arraySeparator !== DEFAULTS.arraySeparator) {
    groups.push(`arraySeparator: ${str(config.arraySeparator)}`);
  }

  const dateLines: string[] = [];
  if (!isDefaultDateFormat(config.dateFormat)) {
    dateLines.push(
      `parse: (value) => parse(value, ${str(config.dateFormat)}, new Date())`,
      `serialize: (date) => format(date, ${str(config.dateFormat)})`
    );
  }
  if (!isDefaultDateTimeFormat(config.dateTimeFormat)) {
    dateLines.push(
      `parseDateTime: (value) => parse(value, ${str(config.dateTimeFormat)}, new Date())`,
      `serializeDateTime: (date) => format(date, ${str(config.dateTimeFormat)})`
    );
  }
  if (dateLines.length > 0) groups.push(nest('date', dateLines, 1));

  if (config.defaultCommit === 'manual') groups.push("defaultCommit: 'manual'");
  if (config.defaultCommit === 'debounce') {
    groups.push(`defaultCommit: { debounce: ${config.debounceMs} }`);
  }

  if (groups.length === 0) return '';
  return `{\n${groups.map((group) => `${INDENT}${group}`).join(',\n')}\n}`;
};

/** `lib/filters.ts` — the factory every screen imports from. */
const configFile = (config: ProjectConfig): GeneratedFile => {
  const argument = factoryArgument(config);
  // External imports, alphabetical and ungrouped, as everywhere else on the site.
  const imports = ["import { createFilters } from '@mbsatimov/use-filters';"];
  if (overridesDates(config)) {
    imports.push("import { format, parse } from 'date-fns';");
  }

  return {
    content: [
      ...imports,
      '',
      '/**',
      ' * Project-wide filter setup. Import `useFilters` and `f` from here rather',
      ' * than from the package, so every screen — and the `resolveFilterParams`',
      ' * used in route loaders — shares the same constants.',
      ' */',
      `export const { defineFilters, f, resolveFilterParams, useFilters } = createFilters(${argument});`,
      ''
    ].join('\n'),
    name: 'filters.ts',
    registryType: 'registry:lib',
    target: 'lib/filters.ts'
  };
};

/** How the starter screen renders its filters, per kit. */
const kitUsage: Record<string, { body: string[]; hook: string; imports: string[] }> = {
  'facet-panel': {
    body: [
      '<FacetPanel',
      `${INDENT}className='w-64 shrink-0'`,
      `${INDENT}filters={filters}`,
      `${INDENT}isDirty={isDirty}`,
      `${INDENT}isFiltered={isFiltered}`,
      `${INDENT}onApply={apply}`,
      `${INDENT}onCancel={cancel}`,
      `${INDENT}onClearAll={instantReset}`,
      '/>'
    ],
    hook: 'apply, cancel, filters, instantReset, isDirty, isFiltered, params',
    imports: ["import { FacetPanel } from '@/components/filters/facet-panel/facet-panel';"]
  },
  'filter-bar': {
    body: ['<FilterBar filters={filters} isFiltered={isFiltered} reset={instantReset} />'],
    hook: 'filters, instantReset, isFiltered, params',
    imports: ["import { FilterBar } from '@/components/filters/filter-bar/filter-bar';"]
  },
  'filter-controls': {
    body: [
      "<div className='flex flex-wrap items-center gap-2'>",
      `${INDENT}<TextFilter filter={filterMap.search} />`,
      `${INDENT}<MultiSelectFilter filter={filterMap.status} />`,
      '</div>'
    ],
    hook: 'filterMap, params',
    imports: [
      "import { MultiSelectFilter, TextFilter } from '@/components/filters/filter-controls';"
    ]
  },
  none: {
    body: [
      "<div className='flex flex-wrap gap-2'>",
      `${INDENT}{/* Render your own controls from \`filters\`. */}`,
      `${INDENT}{filters.map((filter) => (`,
      `${INDENT}${INDENT}<span key={filter.key}>{filter.label}</span>`,
      `${INDENT}))}`,
      '</div>'
    ],
    hook: 'filters, params',
    imports: []
  }
};

/**
 * `components/filters-example.tsx` — two filters wired to the chosen kit, so
 * there is something running to edit rather than a blank file.
 */
const starterFile = (config: ProjectConfig): GeneratedFile => {
  const { body, hook, imports } = kitUsage[config.kit];

  return {
    content: [
      "'use client';",
      '',
      ...imports,
      "import { f, useFilters } from '@/lib/filters';",
      '',
      '/**',
      ' * A starting point: two filters, kept in the URL.',
      ' *',
      ' * `params` is what you hand to your data fetching — typed from the config,',
      ' * so a filter you add here shows up on it automatically.',
      ' */',
      'export function FiltersExample() {',
      `${INDENT}const { ${hook} } = useFilters({`,
      `${INDENT}${INDENT}search: f.text({ label: 'Search', commit: { debounce: 300 } }),`,
      `${INDENT}${INDENT}status: f.multiSelect({`,
      `${INDENT}${INDENT}${INDENT}label: 'Status',`,
      `${INDENT}${INDENT}${INDENT}valueType: 'string',`,
      `${INDENT}${INDENT}${INDENT}options: [`,
      `${INDENT}${INDENT}${INDENT}${INDENT}{ label: 'Active', value: 'active' },`,
      `${INDENT}${INDENT}${INDENT}${INDENT}{ label: 'Archived', value: 'archived' }`,
      `${INDENT}${INDENT}${INDENT}]`,
      `${INDENT}${INDENT}})`,
      `${INDENT}});`,
      '',
      `${INDENT}return (`,
      `${INDENT}${INDENT}<div className='flex flex-col gap-4'>`,
      ...body.map((line) => `${INDENT.repeat(3)}${line}`),
      '',
      `${INDENT}${INDENT}${INDENT}{/* TODO: replace with your results. */}`,
      `${INDENT}${INDENT}${INDENT}<pre className='overflow-x-auto rounded-md border p-3 text-xs'>`,
      `${INDENT}${INDENT}${INDENT}${INDENT}{JSON.stringify(params, null, 2)}`,
      `${INDENT}${INDENT}${INDENT}</pre>`,
      `${INDENT}${INDENT}</div>`,
      `${INDENT});`,
      '}',
      ''
    ].join('\n'),
    name: 'filters-example.tsx',
    registryType: 'registry:component',
    target: 'components/filters-example.tsx'
  };
};

export const generateFiles = (config: ProjectConfig): GeneratedFile[] => [
  configFile(config),
  ...(config.starter ? [starterFile(config)] : [])
];
