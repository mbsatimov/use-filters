import type { FilterType } from '@mbsatimov/use-filters';

import { absoluteUrl, siteConfig } from '@/lib/metadata';

/**
 * The registry's single source of truth. Everything reads from here — the
 * `/registry` page, the `/r/[item]` JSON endpoints the shadcn CLI consumes,
 * the kit tags on example blocks, and the "used in" back-links — so none of
 * them can drift from another.
 */
export interface RegistryKit {
  /** One sentence on the approach this kit takes, shown under the title. */
  approach: string;
  /** npm packages the CLI installs alongside the files. */
  dependencies: string[];
  description: string;
  /** Directory under the docs package holding the kit's files. */
  dir: string;
  /** File names inside `dir`, in reading order. */
  files: string[];
  /** Registry item name — `npx shadcn add …/r/<name>.json`. */
  name: string;
  /** shadcn/ui primitives the CLI ensures exist. */
  registryDependencies: string[];
  title: string;
  /**
   * Filter types this kit ships no control for. The builder warns before
   * generating a screen that would reference a control the kit does not have.
   */
  unsupported: FilterType[];
  /** Example slugs that build on this kit (anchors on /examples). */
  usedBy: string[];
}

export const registryKits: RegistryKit[] = [
  {
    name: 'filter-bar',
    title: 'Filter Bar',
    approach: 'Loop-driven: pass the `filters` array and the whole toolbar renders itself.',
    description:
      'The production filter bar: inline search inputs, one dashed "Filters" button with a searchable two-level index, and every active filter as its own editable chip. Covers every filter type.',
    dir: 'components/filters/filter-bar',
    files: [
      'filter-bar.tsx',
      'editors.tsx',
      'option-list.tsx',
      'filter-shell.tsx',
      'summarize.tsx',
      'text-filter.tsx',
      'use-async-options.ts',
      'lib.ts'
    ],
    dependencies: ['@mbsatimov/use-filters', 'nuqs', 'date-fns'],
    registryDependencies: [
      'badge',
      'button',
      'button-group',
      'calendar',
      'checkbox',
      'command',
      'input',
      'input-group',
      'popover'
    ],
    unsupported: [],
    usedBy: ['data-table', 'all-filters']
  },
  {
    name: 'facet-panel',
    title: 'Facet Panel',
    approach:
      'Loop-driven: a facet sidebar on desktop, a chip row with per-facet bottom drawers on mobile.',
    description:
      'E-commerce style faceted filtering. Sections render per filter with flat sidebar editors; manual-commit facets stage edits behind an Apply bar (desktop) or a "Show results" drawer (mobile). One `renderEditor` override swaps any editor, e.g. for a price slider.',
    dir: 'components/filters/facet-panel',
    files: [
      'facet-panel.tsx',
      'facet-chip-row.tsx',
      'facet-drawer.tsx',
      'facet-editors.tsx',
      'summarize.ts',
      'use-async-options.ts'
    ],
    dependencies: ['@mbsatimov/use-filters', 'nuqs'],
    registryDependencies: ['button', 'checkbox', 'drawer', 'input', 'label', 'separator'],
    unsupported: ['tags'],
    usedBy: ['marketplace']
  },
  {
    name: 'filter-controls',
    title: 'Filter Controls',
    approach:
      'Composed by hand: one standalone component per filter type, placed wherever you want.',
    description:
      'SelectFilter, MultiSelectFilter, DateFilter, DateRangeFilter, TextFilter, NumberFilter, NumberRangeFilter, BooleanFilter, AsyncSelectFilter, AsyncMultiSelectFilter. No orchestration, no auto-appearing reset — drop two controls at the top of a page and you are done.',
    dir: 'components/filters/filter-controls',
    files: [
      'index.ts',
      'control-trigger.tsx',
      'text-filter.tsx',
      'select-filter.tsx',
      'multi-select-filter.tsx',
      'async-select-filter.tsx',
      'async-multi-select-filter.tsx',
      'boolean-filter.tsx',
      'date-filter.tsx',
      'date-range-filter.tsx',
      'number-filter.tsx',
      'number-range-filter.tsx',
      'option-list.tsx',
      'use-async-options.ts'
    ],
    dependencies: ['@mbsatimov/use-filters', 'nuqs', 'date-fns'],
    registryDependencies: [
      'button',
      'calendar',
      'checkbox',
      'command',
      'input',
      'input-group',
      'popover'
    ],
    unsupported: ['tags', 'time', 'timeRange'],
    usedBy: ['basic']
  }
];

export const getKit = (name: string) => registryKits.find((kit) => kit.name === name);

/** The JSON item URL the shadcn CLI fetches for a kit. */
export const registryItemUrl = (kit: RegistryKit) => absoluteUrl(`/r/${kit.name}.json`);

/** The one-liner a user runs to install a kit. */
export const installCommand = (kit: RegistryKit) => `npx shadcn@latest add ${registryItemUrl(kit)}`;

/** GitHub URL of the kit's folder. */
export const kitSourceUrl = (kit: RegistryKit) =>
  `${siteConfig.repository}/tree/main/packages/docs/${kit.dir}`;
