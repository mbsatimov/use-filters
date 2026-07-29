import type { Metadata } from 'next';

import { Suspense } from 'react';

import { CreateFlow } from '@/components/builder/create-flow';
import { createMetadata } from '@/lib/metadata';

export const metadata: Metadata = createMetadata({
  title: 'Get started',
  description:
    'Answer a few questions about your project — pagination params, how arrays reach your API, how dates are stored — and copy one command that sets up use-filters to match.',
  path: '/start'
});

export default function StartPage() {
  return (
    <main className='mx-auto w-full max-w-3xl px-4 pb-24 sm:px-6'>
      <section className='flex flex-col gap-3 py-12 text-center sm:py-16'>
        <h1 className='text-3xl font-semibold tracking-tight sm:text-4xl'>Set up use-filters</h1>
        <p className='text-muted-foreground mx-auto max-w-xl leading-relaxed text-pretty'>
          A few questions about how your project already works, then one command. Every answer
          starts on the default, so you can accept your way through in seconds.
        </p>
      </section>

      {/* `useSearchParams` in the flow needs a suspense boundary. */}
      <Suspense fallback={<div className='text-muted-foreground py-16 text-sm'>Loading…</div>}>
        <CreateFlow />
      </Suspense>
    </main>
  );
}
