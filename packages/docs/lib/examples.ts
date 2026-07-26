import type { ComponentType } from 'react';

import { AllFiltersExample } from '@/components/examples/all-filters/all-filters-example';
import { BasicExample } from '@/components/examples/basic/basic-example';
import { DataTableExample } from '@/components/examples/data-table/data-table-example';
import { FilterDrawerExample } from '@/components/examples/filter-drawer/filter-drawer-example';
import { MarketplaceExample } from '@/components/examples/marketplace/marketplace-example';
import { siteConfig } from '@/lib/metadata';

/**
 * The examples registry: one entry per example, ordered simplest → most
 * involved. The gallery renders every entry inline (preview in an iframe, code
 * from `files`), and `/examples/preview/[slug]` renders `Component` alone.
 */
export interface ExampleMeta {
  /** The live component, rendered by the preview route. */
  Component: ComponentType;
  /** Initial preview width — mobile-first examples open at phone width. */
  defaultViewport?: '400';
  /** Source files shown in the Code tab, in order. Paths are relative to the docs package root. */
  files: { name: string; path: string }[];
  /** Preview iframe height in px — enough to show the example without inner scroll. */
  iframeHeight: number;
  /** Registry kit names this example builds on (anchors on /registry). */
  kits: string[];
  slug: string;
  tagline: string;
  title: string;
}

/**
 * GitHub URL for an example's source folder, derived from its first listed file
 * so the link can never drift from what the Code tab shows.
 */
export const exampleSourceUrl = (example: ExampleMeta): string => {
  const directory = example.files[0]?.path.split('/').slice(0, -1).join('/') ?? '';
  return `${siteConfig.repository}/tree/main/packages/docs/${directory}`;
};

export const examples: ExampleMeta[] = [
  {
    slug: 'basic',
    kits: ['filter-controls'],
    title: 'Search and status',
    tagline: 'The two-filter starting point',
    Component: BasicExample,
    iframeHeight: 620,
    files: [
      { name: 'basic-example.tsx', path: 'components/examples/basic/basic-example.tsx' },
      { name: 'text-filter.tsx', path: 'components/filters/filter-controls/text-filter.tsx' },
      {
        name: 'multi-select-filter.tsx',
        path: 'components/filters/filter-controls/multi-select-filter.tsx'
      },
      { name: 'use-query.ts', path: 'components/examples/data/use-query.ts' }
    ]
  },
  {
    slug: 'data-table',
    kits: ['filter-bar'],
    title: 'Data table',
    tagline: 'Faceted filters, sortable columns, shareable views',
    Component: DataTableExample,
    iframeHeight: 700,
    files: [
      {
        name: 'data-table-example.tsx',
        path: 'components/examples/data-table/data-table-example.tsx'
      },
      { name: 'filter-bar.tsx', path: 'components/filters/filter-bar/filter-bar.tsx' },
      { name: 'editors.tsx', path: 'components/filters/filter-bar/editors.tsx' },
      { name: 'summarize.tsx', path: 'components/filters/filter-bar/summarize.tsx' },
      { name: 'use-query.ts', path: 'components/examples/data/use-query.ts' }
    ]
  },
  {
    slug: 'marketplace',
    kits: ['facet-panel'],
    title: 'Marketplace',
    tagline: 'E-commerce faceted search',
    Component: MarketplaceExample,
    iframeHeight: 860,
    files: [
      {
        name: 'marketplace-example.tsx',
        path: 'components/examples/marketplace/marketplace-example.tsx'
      },
      { name: 'facet-panel.tsx', path: 'components/filters/facet-panel/facet-panel.tsx' },
      { name: 'facet-chip-row.tsx', path: 'components/filters/facet-panel/facet-chip-row.tsx' },
      { name: 'facet-drawer.tsx', path: 'components/filters/facet-panel/facet-drawer.tsx' },
      { name: 'facet-editors.tsx', path: 'components/filters/facet-panel/facet-editors.tsx' }
    ]
  },
  {
    slug: 'filter-drawer',
    kits: [],
    title: 'Filter drawer',
    tagline: 'The mobile pattern: one button, staged filters',
    Component: FilterDrawerExample,
    defaultViewport: '400',
    iframeHeight: 700,
    files: [
      {
        name: 'filter-drawer-example.tsx',
        path: 'components/examples/filter-drawer/filter-drawer-example.tsx'
      },
      { name: 'use-query.ts', path: 'components/examples/data/use-query.ts' }
    ]
  },
  {
    slug: 'all-filters',
    kits: ['filter-bar'],
    title: 'Every filter type',
    tagline: 'The full config on one filter bar',
    Component: AllFiltersExample,
    iframeHeight: 700,
    files: [
      {
        name: 'all-filters-example.tsx',
        path: 'components/examples/all-filters/all-filters-example.tsx'
      },
      { name: 'use-query.ts', path: 'components/examples/data/use-query.ts' }
    ]
  }
];

export const getExample = (slug: string) => examples.find((e) => e.slug === slug);
