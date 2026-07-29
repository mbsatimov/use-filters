import type { ReactNode } from 'react';

import type { ProjectConfig } from '@/lib/builder/types';

import { ExampleBox, ExampleRow, QueryLine } from '@/components/builder/example-box';
import { KitPicker } from '@/components/builder/kit-picker';
import {
  DateFormatField,
  DateTimeFormatField,
  PaginationKeysField,
  PerPageField,
  SeparatorField
} from '@/components/builder/step-fields';
import {
  DATE_FORMATS,
  DEFAULTS,
  isDefaultDateTimeFormat,
  PAGE_SIZES,
  PAGINATION_PRESETS
} from '@/lib/builder/types';
import { previewDate, previewDateTime } from '@/lib/builder/validate';
import { getKit, registryKits } from '@/lib/registry';

/**
 * The flow, as data.
 *
 * Each step is one decision, phrased as a question about the project rather
 * than about the library's API, with the library's own default marked so the
 * whole thing can be answered by pressing Next. `summary` is what the review
 * step reads back, so the recap can never drift from the choices.
 */

export interface StepOption {
  /** Shown when this option is the library default. */
  badge?: string;
  hint?: string;
  label: string;
  /** The fields this option sets. */
  patch: Partial<ProjectConfig>;
  value: string;
  /** Whether the current config already matches this option. */
  selected: (config: ProjectConfig) => boolean;
}

export interface Step {
  /** Why this decision matters, in one or two sentences. */
  description: string;
  id: string;
  question: string;
  title: string;
  /** Live illustration of what the current choice changes. */
  example: (config: ProjectConfig) => ReactNode;
  /** Extra controls shown under the options, e.g. a separator input. */
  extra?: (config: ProjectConfig, set: (patch: Partial<ProjectConfig>) => void) => ReactNode;
  options: (config: ProjectConfig) => StepOption[];
  /**
   * Replaces the default option list. Only the kit step uses it — that choice is
   * about layout, which reads far better as sketches than as radio rows.
   */
  renderOptions?: (
    config: ProjectConfig,
    set: (patch: Partial<ProjectConfig>) => void
  ) => ReactNode;
  /** One-line recap for the review step. */
  summary: (config: ProjectConfig) => string;
}

/** The pagination half of the URL, shared by the steps that shape it. */
const pageQuery = (config: ProjectConfig) =>
  `${config.pageKey}=${config.firstPage}&${config.perPageKey}=${config.defaultPerPage}`;

/** True once the date pattern is something the presets do not cover. */
const isCustomDateFormat = (config: ProjectConfig) =>
  !DATE_FORMATS.some((format) => format.value === config.dateFormat);

const kitOptions: StepOption[] = [
  ...registryKits.map((kit) => ({
    hint: kit.approach,
    label: kit.title,
    patch: { kit: kit.name } as Partial<ProjectConfig>,
    selected: (config: ProjectConfig) => config.kit === kit.name,
    value: kit.name
  })),
  {
    hint: 'Just the hook and your own components. Nothing is copied in.',
    label: 'None — headless',
    patch: { kit: 'none' },
    selected: (config) => config.kit === 'none',
    value: 'none'
  }
];

export const steps: Step[] = [
  {
    description:
      'Every kit reads the same filter config, so this is a starting point, not a lock-in — the files are copied into your project and yours to edit.',
    example: (config) => {
      const kit = getKit(config.kit);
      return (
        <ExampleBox>
          <ExampleRow
            code={kit ? `components/filters/${config.kit}/` : 'nothing copied in'}
            label='Adds'
            muted={!kit}
          />
          <ExampleRow
            muted
            code={kit ? `${kit.files.length} files, yours to edit` : 'you render from `filters`'}
            label='Then'
          />
        </ExampleBox>
      );
    },
    id: 'kit',
    options: () => kitOptions,
    question: 'Which filter UI do you want to start from?',
    renderOptions: (config, set) => <KitPicker config={config} set={set} />,
    summary: (config) =>
      config.kit === 'none'
        ? 'Headless — no components copied'
        : (registryKits.find((kit) => kit.name === config.kit)?.title ?? config.kit),
    title: 'Filter UI'
  },

  {
    description:
      'These become the URL query params and the keys on the typed params object you hand to your API. Match whatever your backend already expects.',
    example: (config) => (
      <ExampleBox>
        <ExampleRow code={<QueryLine query={pageQuery(config)} />} label='URL' />
        <ExampleRow
          muted
          code={`params.${config.pageKey}, params.${config.perPageKey}`}
          label='params'
        />
      </ExampleBox>
    ),
    extra: (config, set) => <PaginationKeysField config={config} set={set} />,
    id: 'pagination',
    options: () =>
      PAGINATION_PRESETS.map((preset) => ({
        badge:
          preset.pageKey === DEFAULTS.pageKey && preset.perPageKey === DEFAULTS.perPageKey
            ? 'Default'
            : undefined,
        label: preset.label,
        patch: { pageKey: preset.pageKey, perPageKey: preset.perPageKey },
        selected: (config: ProjectConfig) =>
          config.pageKey === preset.pageKey && config.perPageKey === preset.perPageKey,
        value: preset.label
      })),
    question: 'What does your API call its pagination params?',
    summary: (config) => `${config.pageKey} / ${config.perPageKey}`,
    title: 'Pagination'
  },

  {
    description:
      'Used when the URL carries no page size. Pagination is built in — you never declare it as a filter.',
    example: (config) => (
      <ExampleBox>
        <ExampleRow code={<QueryLine query={pageQuery(config)} />} label='URL' />
        <ExampleRow
          muted
          code={`fetch with ${config.defaultPerPage} rows when the URL says nothing`}
          label='Effect'
        />
      </ExampleBox>
    ),
    extra: (config, set) => <PerPageField config={config} set={set} />,
    id: 'perPage',
    options: () =>
      PAGE_SIZES.map((size) => ({
        badge: size === DEFAULTS.defaultPerPage ? 'Default' : undefined,
        label: String(size),
        patch: { defaultPerPage: size },
        selected: (config: ProjectConfig) => config.defaultPerPage === size,
        value: String(size)
      })),
    question: 'How many rows per page by default?',
    summary: (config) => `${config.defaultPerPage} per page`,
    title: 'Page size'
  },

  {
    description:
      'Most REST APIs count pages from 1. Some — and most cursor-style or offset APIs — start at 0.',
    example: (config) => (
      <ExampleBox>
        <ExampleRow code={<QueryLine query={pageQuery(config)} />} label='Page 1' />
        <ExampleRow
          code={
            <QueryLine
              query={`${config.pageKey}=${config.firstPage + 1}&${config.perPageKey}=${config.defaultPerPage}`}
            />
          }
          label='Page 2'
        />
      </ExampleBox>
    ),
    id: 'firstPage',
    options: () => [
      {
        badge: 'Default',
        hint: 'The first page is ?page=1',
        label: 'Start at 1',
        patch: { firstPage: 1 },
        selected: (config: ProjectConfig) => config.firstPage === 1,
        value: '1'
      },
      {
        hint: 'The first page is ?page=0',
        label: 'Start at 0',
        patch: { firstPage: 0 },
        selected: (config: ProjectConfig) => config.firstPage === 0,
        value: '0'
      }
    ],
    question: 'Where does page numbering start?',
    summary: (config) => (config.firstPage === 0 ? 'Zero-indexed pages' : 'Pages start at 1'),
    title: 'Indexing'
  },

  {
    description:
      'Multi-selects, tags and ranges hold several values. This decides what lands on params — a real array, or the items already joined for you.',
    extra: (config, set) =>
      config.arrayFormat === 'string' ? <SeparatorField config={config} set={set} /> : null,
    example: (config) => (
      <ExampleBox>
        <ExampleRow code={<QueryLine query='status=paid,pending' />} label='URL' />
        <ExampleRow
          code={
            config.arrayFormat === 'array'
              ? "params.status → ['paid', 'pending']"
              : `params.status → 'paid${config.arraySeparator}pending'`
          }
          label='params'
        />
      </ExampleBox>
    ),
    id: 'arrayFormat',
    options: () => [
      {
        badge: 'Default',
        hint: "params.status is ['paid', 'pending']",
        label: 'A real array',
        patch: { arrayFormat: 'array' },
        selected: (config: ProjectConfig) => config.arrayFormat === 'array',
        value: 'array'
      },
      {
        hint: "params.status is 'paid,pending' — what most backends want",
        label: 'Joined into a string',
        patch: { arrayFormat: 'string' },
        selected: (config: ProjectConfig) => config.arrayFormat === 'string',
        value: 'string'
      }
    ],
    question: 'How should multi-value params reach your API?',
    summary: (config) =>
      config.arrayFormat === 'array'
        ? 'Arrays stay arrays'
        : `Arrays joined with "${config.arraySeparator}"`,
    title: 'Array params'
  },

  {
    description:
      'Date filters store a formatted string in the URL, and hand that same string to your API. Filters declared with precision: "datetime" use a second pattern of their own.',
    example: (config) => {
      // Rendered through date-fns itself, so a custom pattern previews exactly
      // what the library will store.
      const sample = previewDate(config.dateFormat);
      return (
        <ExampleBox>
          <ExampleRow code={<QueryLine query={`created=${sample}`} />} label='URL' />
          {config.dateTimeFormat !== '' && (
            <ExampleRow
              code={<QueryLine query={`updated=${previewDateTime(config.dateTimeFormat)}`} />}
              label='datetime'
            />
          )}
          <ExampleRow muted code={`params.created → '${sample}'`} label='params' />
        </ExampleBox>
      );
    },
    extra: (config, set) => (
      <>
        {isCustomDateFormat(config) && <DateFormatField config={config} set={set} />}
        <DateTimeFormatField config={config} set={set} />
      </>
    ),
    id: 'dateFormat',
    options: () => [
      ...DATE_FORMATS.map((format) => ({
        badge: format.value === DEFAULTS.dateFormat ? 'Default' : undefined,
        hint: format.hint,
        label: format.label,
        patch: { dateFormat: format.value },
        selected: (config: ProjectConfig) =>
          !isCustomDateFormat(config) && config.dateFormat === format.value,
        value: format.label
      })),
      {
        hint: 'Any date-fns pattern — checked as you type',
        label: 'Custom…',
        // Opens on the library's own date-only pattern, ready to edit. The
        // literal still counts as "custom" (the ISO preset stores ''), and the
        // generators treat it as the default, so leaving it unedited emits
        // nothing.
        patch: { dateFormat: 'yyyy-MM-dd' },
        selected: isCustomDateFormat,
        value: 'custom'
      }
    ],
    question: 'How should dates be stored?',
    summary: (config) =>
      (config.dateFormat || 'yyyy-MM-dd') +
      (isDefaultDateTimeFormat(config.dateTimeFormat) ? '' : ` · ${config.dateTimeFormat}`),
    title: 'Dates'
  },

  {
    description:
      'The starting point for every filter. Any filter can override it — a search box is usually debounced even when the rest are instant.',
    example: (config) => (
      <ExampleBox>
        <ExampleRow muted code='typing "lap" in a search box' label='You' />
        <ExampleRow
          code={
            config.defaultCommit === 'instant'
              ? '?q=l → ?q=la → ?q=lap  (three fetches)'
              : config.defaultCommit === 'debounce'
                ? `?q=lap  (one fetch, ${config.debounceMs}ms after you stop)`
                : '?q=lap  (one fetch, when you press Apply)'
          }
          label='URL'
        />
      </ExampleBox>
    ),
    id: 'commit',
    options: () => [
      {
        badge: 'Default',
        hint: 'Every change updates the URL right away',
        label: 'Instant',
        patch: { defaultCommit: 'instant' },
        selected: (config: ProjectConfig) => config.defaultCommit === 'instant',
        value: 'instant'
      },
      {
        hint: 'Shows at once, reaches the URL after a pause',
        label: 'Debounced',
        patch: { defaultCommit: 'debounce' },
        selected: (config: ProjectConfig) => config.defaultCommit === 'debounce',
        value: 'debounce'
      },
      {
        hint: 'Edits stage until an Apply button — good for form-like filters',
        label: 'Manual',
        patch: { defaultCommit: 'manual' },
        selected: (config: ProjectConfig) => config.defaultCommit === 'manual',
        value: 'manual'
      }
    ],
    extra: (config, set) =>
      config.defaultCommit === 'debounce' ? (
        <label className='text-muted-foreground flex items-center gap-2 text-sm'>
          Wait
          <input
            className='border-input bg-background w-20 rounded-md border px-2 py-1 text-center font-mono text-sm'
            min={0}
            type='number'
            value={config.debounceMs}
            onChange={(event) => set({ debounceMs: Number(event.target.value) })}
          />
          ms
        </label>
      ) : null,
    question: 'When should a filter change hit the URL?',
    summary: (config) =>
      config.defaultCommit === 'debounce'
        ? `Debounced ${config.debounceMs}ms`
        : config.defaultCommit === 'instant'
          ? 'Instant'
          : 'Manual — apply to commit',
    title: 'Commit'
  }
];
