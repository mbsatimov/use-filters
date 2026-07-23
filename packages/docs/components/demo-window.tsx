'use client';

import { Github, RotateCw } from 'lucide-react';
import { NuqsTestingAdapter, type UrlUpdateEvent } from 'nuqs/adapters/testing';
import { type ReactNode, useEffect, useRef, useState } from 'react';

import { cn } from '@/lib/utils';

export function DemoWindow({
  children,
  path = '/products',
  sourceUrl,
  className
}: {
  children: ReactNode;
  path?: string;
  sourceUrl?: string;
  className?: string;
}) {
  const [queryString, setQueryString] = useState('');
  // Bumping `id` remounts the adapter; `search` seeds the fresh mount. They
  // change together so the adapter only ever re-seeds on an actual reload.
  const [session, setSession] = useState({ id: 0, search: '' });
  const [reloading, setReloading] = useState(false);
  const spinTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => void (spinTimer.current && clearTimeout(spinTimer.current)), []);

  const reload = () => {
    setSession((current) => ({ id: current.id + 1, search: queryString }));
    setReloading(true);
    if (spinTimer.current) clearTimeout(spinTimer.current);
    spinTimer.current = setTimeout(() => setReloading(false), 450);
  };

  return (
    <div className={cn('not-prose bg-card my-6 rounded-xl border text-sm shadow-sm', className)}>
      <div className='bg-muted/40 flex items-center gap-3 border-b px-3 py-2.5'>
        <div className='flex shrink-0 gap-1.5'>
          <span className='size-2.5 rounded-full bg-red-400/80' />
          <span className='size-2.5 rounded-full bg-amber-400/80' />
          <span className='size-2.5 rounded-full bg-emerald-400/80' />
        </div>
        <button
          type='button'
          onClick={reload}
          aria-label='Reload the demo'
          title='Reload — the filters survive, because they live in the URL'
          className='text-muted-foreground hover:text-foreground focus-visible:ring-ring shrink-0 rounded-md transition-colors focus-visible:ring-2 focus-visible:outline-none'
        >
          <RotateCw className={cn('size-3.5', reloading && 'motion-safe:animate-spin')} />
        </button>
        <div className='bg-background flex-1 overflow-x-auto rounded-md border px-2.5 py-1'>
          <code className='font-mono text-xs whitespace-nowrap'>
            <span className='text-muted-foreground'>{path}</span>
            <QueryString value={queryString} />
          </code>
        </div>
        {sourceUrl && (
          <a
            href={sourceUrl}
            target='_blank'
            rel='noreferrer'
            className='text-muted-foreground hover:text-foreground focus-visible:ring-ring flex shrink-0 items-center gap-1.5 rounded-md text-xs transition-colors focus-visible:ring-2 focus-visible:outline-none'
          >
            <Github className='size-3.5' />
            <span className='hidden sm:inline'>View source</span>
          </a>
        )}
      </div>

      <NuqsTestingAdapter
        key={session.id}
        hasMemory
        searchParams={session.search}
        onUrlUpdate={(e: UrlUpdateEvent) => setQueryString(e.queryString)}
      >
        <div className={cn('p-4 transition-opacity', reloading ? 'opacity-50' : '')}>
          {children}
        </div>
      </NuqsTestingAdapter>
    </div>
  );
}

/** Renders `?a=1&b=2` with the keys, separators, and values each distinguished. */
function QueryString({ value }: { value: string }) {
  if (!value || value === '?') return null;

  const pairs = value.replace(/^\?/, '').split('&').filter(Boolean);

  return (
    <>
      <span className='text-muted-foreground/60'>?</span>
      {pairs.map((pair, i) => {
        const [key, ...rest] = pair.split('=');
        const val = rest.join('=');
        return (
          <span key={`${key}-${i}`}>
            {i > 0 && <span className='text-muted-foreground/60'>&</span>}
            <span className='text-foreground/70'>{key}</span>
            <span className='text-muted-foreground/60'>=</span>
            <span className='text-foreground font-medium'>{decodeURIComponent(val)}</span>
          </span>
        );
      })}
    </>
  );
}
