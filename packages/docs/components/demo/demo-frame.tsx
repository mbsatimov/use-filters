'use client';

import { NuqsTestingAdapter, type UrlUpdateEvent } from 'nuqs/adapters/testing';
import { type ReactNode, useState } from 'react';

/**
 * Wraps a live `useFilters` demo in an isolated, in-memory nuqs adapter so it
 * never touches the docs page's real URL, and renders a synthetic "URL bar"
 * above it — so readers watch the query string change as they interact.
 */
export function DemoFrame({
  children,
  path = '/products',
  initialSearch = ''
}: {
  children: ReactNode;
  path?: string;
  initialSearch?: string;
}) {
  const [queryString, setQueryString] = useState(initialSearch);

  return (
    <div className='not-prose my-6 overflow-hidden rounded-xl border border-fd-border bg-fd-card text-fd-card-foreground text-sm'>
      <div className='flex items-center gap-2 border-b border-fd-border bg-fd-muted/40 px-3 py-2'>
        <div className='flex gap-1.5'>
          <span className='size-2.5 rounded-full bg-fd-error' />
          <span className='size-2.5 rounded-full bg-fd-border' />
          <span className='size-2.5 rounded-full bg-fd-success' />
        </div>
        <code className='flex-1 truncate rounded-md bg-fd-background px-2.5 py-1 font-mono text-xs text-fd-muted-foreground'>
          {path}
          {queryString || ''}
        </code>
      </div>
      <NuqsTestingAdapter
        hasMemory
        searchParams={initialSearch}
        onUrlUpdate={(e: UrlUpdateEvent) => setQueryString(e.queryString)}
      >
        <div className='p-4'>{children}</div>
      </NuqsTestingAdapter>
    </div>
  );
}
