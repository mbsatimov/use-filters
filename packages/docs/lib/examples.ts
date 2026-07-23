import { ShoppingBag, Table2 } from 'lucide-react';
import type { ComponentType } from 'react';

import { DataTable } from '@/components/examples/data-table/data-table';
import { Marketplace } from '@/components/examples/marketplace/marketplace';

export interface ExampleMeta {
  slug: string;
  title: string;
  description: string;
  /** Short one-liner for the gallery card. */
  tagline: string;
  /** Icon for the gallery card. */
  icon: ComponentType<{ className?: string }>;
  /** The live component rendered in the Preview tab. */
  Component: ComponentType;
  /** Source files shown in the Code tab, in order. Paths are relative to the docs package root. */
  files: { name: string; path: string; lang?: string }[];
}

export const examples: ExampleMeta[] = [
  {
    slug: 'marketplace',
    title: 'Marketplace',
    tagline: 'E-commerce faceted search',
    icon: ShoppingBag,
    description:
      'E-commerce faceted search: category, brand, price range, in-stock, sort, and search — every filter synced to the URL, so the result set is shareable and refresh-safe.',
    Component: Marketplace,
    files: [
      { name: 'marketplace.tsx', path: 'components/examples/marketplace/marketplace.tsx' },
      { name: 'products.ts', path: 'components/examples/marketplace/products.ts' }
    ]
  },
  {
    slug: 'data-table',
    title: 'Data table',
    tagline: 'Admin table with pagination',
    icon: Table2,
    description:
      'An admin orders table with search, a status filter, a date range, column visibility, and pagination — the filters live in the URL, and changing one resets to the first page.',
    Component: DataTable,
    files: [
      { name: 'data-table.tsx', path: 'components/examples/data-table/data-table.tsx' },
      { name: 'orders.ts', path: 'lib/orders.ts' }
    ]
  }
];

export const getExample = (slug: string) => examples.find((e) => e.slug === slug);
