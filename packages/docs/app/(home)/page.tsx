import Link from 'next/link';

import { OrdersDemo } from '@/components/orders-demo';
import { Button } from '@/components/ui/button';

import './home.css';

export default function HomePage() {
  return (
    <main className='relative flex flex-1 flex-col'>
      <div className='home-glow pointer-events-none absolute inset-x-0 top-0 h-105' />

      <section className='relative mx-auto flex w-full max-w-5xl flex-col items-center gap-6 px-6 pt-24 pb-12 text-center'>
        <Link
          href='https://www.npmjs.com/package/@mbsatimov/use-filters'
          className='rounded-full border px-3 py-1 font-mono text-xs text-fd-muted-foreground transition-colors hover:bg-fd-accent'
        >
          @mbsatimov/use-filters
        </Link>
        <h1 className='max-w-3xl text-4xl font-bold tracking-tight text-balance sm:text-5xl'>
          Headless, URL-synced filter state for React
        </h1>
        <p className='max-w-2xl text-lg text-pretty text-fd-muted-foreground'>
          Declare your filters once as a plain object. Get a typed <code>params</code> object for
          fetching, ready-to-render filter state, and nuqs-backed URL sync — bring your own UI.
        </p>
        <div className='grid grid-cols-2 items-center justify-center gap-3'>
          <Button asChild size='lg'>
            <Link href='/docs'>Get started</Link>
          </Button>
          <Button asChild variant='secondary' size='lg'>
            <Link href='https://github.com/mbsatimov/use-filters'>GitHub</Link>
          </Button>
        </div>
        <code className='mt-1 rounded-md border bg-fd-card px-3 py-1.5 font-mono text-xs text-fd-muted-foreground'>
          npm i @mbsatimov/use-filters nuqs
        </code>
      </section>

      {/* Live centerpiece — a real, URL-synced filtered table whose toolbar is
          rendered dynamically from the useFilters config. */}
      <section className='relative mx-auto w-full max-w-6xl px-6 pb-20'>
        <OrdersDemo />
      </section>

      {/* Features */}
      <section className='mx-auto grid w-full max-w-4xl gap-4 px-6 pb-24 sm:grid-cols-3'>
        {FEATURES.map((feature) => (
          <div
            key={feature.title}
            className='rounded-xl border p-5 transition-colors hover:bg-fd-card'
          >
            <h3 className='mb-1.5 font-semibold'>{feature.title}</h3>
            <p className='text-sm text-fd-muted-foreground'>{feature.body}</p>
          </div>
        ))}
      </section>
    </main>
  );
}

const FEATURES = [
  {
    title: 'URL is the source of truth',
    body: 'Refreshes, back/forward, bookmarks, and shared links just work — and your query cache stays in sync for free.'
  },
  {
    title: 'Fully typed',
    body: 'Declare filters once; get a params object typed per config, or validated against your API type.'
  },
  {
    title: 'Zero UI, zero runtime deps',
    body: 'Ships the hook and types only. Render your own controls against your own design system.'
  }
];
