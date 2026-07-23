import { DocsLayout } from 'fumadocs-ui/layouts/notebook';
import type { ReactNode } from 'react';

import { baseOptions } from '@/lib/layout.shared';
import { source } from '@/lib/source';

export default function Layout({ children }: { children: ReactNode }) {
  const base = baseOptions();
  return (
    <DocsLayout
      tree={source.pageTree}
      {...base}
      // `mode: 'top'` puts the navbar (logo included) full-width across the top,
      // with the sidebar below — the sidebar is seamless in this mode. Must come
      // after the `{...base}` spread so it merges with (not loses) `nav.title`.
      nav={{ ...base.nav, mode: 'top', transparentMode: 'top' }}
      sidebar={{ collapsible: false, banner: null }}
    >
      {children}
    </DocsLayout>
  );
}
