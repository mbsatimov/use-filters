import type { ComponentType } from 'react';

import { BasicExample } from '@/components/examples/basic/basic-example';
import { DataTableExample } from '@/components/examples/data-table/data-table-example';
import { FilterDrawerExample } from '@/components/examples/filter-drawer/filter-drawer-example';
import { FilterMenuExample } from '@/components/examples/filter-menu/filter-menu-example';
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
    title: 'Search and status',
    tagline: 'The two-filter starting point',
    Component: BasicExample,
    iframeHeight: 620,
    files: [
      { name: 'basic-example.tsx', path: 'components/examples/basic/basic-example.tsx' },
      { name: 'use-query.ts', path: 'components/examples/data/use-query.ts' }
    ]
  },
  {
    slug: 'data-table',
    title: 'Data table',
    tagline: 'Faceted filters, sortable columns, shareable views',
    Component: DataTableExample,
    iframeHeight: 700,
    files: [
      {
        name: 'data-table-example.tsx',
        path: 'components/examples/data-table/data-table-example.tsx'
      },
      { name: 'faceted-filter.tsx', path: 'components/examples/data-table/faceted-filter.tsx' },
      {
        name: 'date-range-filter.tsx',
        path: 'components/examples/data-table/date-range-filter.tsx'
      },
      { name: 'use-query.ts', path: 'components/examples/data/use-query.ts' }
    ]
  },
  {
    slug: 'marketplace',
    title: 'Marketplace',
    tagline: 'E-commerce faceted search',
    Component: MarketplaceExample,
    iframeHeight: 860,
    files: [
      {
        name: 'marketplace-example.tsx',
        path: 'components/examples/marketplace/marketplace-example.tsx'
      }
    ]
  },
  {
    slug: 'filter-drawer',
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
    slug: 'filter-menu',
    title: 'Filter menu',
    tagline: 'One config-driven component for every filter type',
    Component: FilterMenuExample,
    iframeHeight: 700,
    files: [
      {
        name: 'filter-menu-example.tsx',
        path: 'components/examples/filter-menu/filter-menu-example.tsx'
      },
      { name: 'filter-menu.tsx', path: 'components/examples/filter-menu/filter-menu.tsx' },
      { name: 'filter-chips.tsx', path: 'components/examples/filter-menu/filter-chips.tsx' },
      { name: 'use-query.ts', path: 'components/examples/data/use-query.ts' }
    ]
  }
];

export const getExample = (slug: string) => examples.find((e) => e.slug === slug);
