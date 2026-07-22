import { ArrowUpRight } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

import { examples } from '@/lib/examples';

export const metadata: Metadata = {
  title: 'Examples',
  description: 'Real-world filtering patterns built with use-filters.'
};

export default function ExamplesIndexPage() {
  return (
    <div className='mx-auto max-w-5xl px-6 py-14'>
      <h1 className='text-3xl font-semibold tracking-tight'>Examples</h1>
      <p className='text-muted-foreground mt-2 max-w-2xl'>
        Real-world filtering patterns built with{' '}
        <code className='text-foreground'>use-filters</code>. Each one is fully interactive and
        URL-synced — change a filter and watch the address bar. The complete source is one click
        away.
      </p>

      <div className='mt-10 grid gap-5 sm:grid-cols-2'>
        {examples.map((ex) => {
          const Icon = ex.icon;
          return (
            <Link
              key={ex.slug}
              href={`/examples/${ex.slug}`}
              className='group border-border bg-card hover:border-foreground/20 relative flex flex-col gap-4 rounded-xl border p-5 transition-colors'
            >
              <div className='bg-muted text-foreground flex size-11 items-center justify-center rounded-lg'>
                <Icon className='size-5' />
              </div>
              <div>
                <div className='flex items-center gap-1.5 font-medium'>
                  {ex.title}
                  <ArrowUpRight className='text-muted-foreground size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5' />
                </div>
                <div className='text-muted-foreground text-sm'>{ex.tagline}</div>
              </div>
              <p className='text-muted-foreground text-sm leading-relaxed'>{ex.description}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
