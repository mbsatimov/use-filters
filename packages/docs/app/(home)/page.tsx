import Link from 'next/link';

export default function HomePage() {
  return (
    <main className='flex flex-1 flex-col'>
      <section className='mx-auto flex max-w-3xl flex-col items-center gap-6 px-6 py-24 text-center'>
        <span className='rounded-full border px-3 py-1 font-mono text-xs text-fd-muted-foreground'>
          @mbsatimov/use-filters
        </span>
        <h1 className='text-4xl font-bold tracking-tight sm:text-5xl'>
          Headless, URL-synced filter state for React
        </h1>
        <p className='max-w-2xl text-lg text-fd-muted-foreground'>
          Declare your filters once as a plain object. Get a typed <code>params</code> object for
          fetching data, ready-to-render filter state, and nuqs-backed URL sync — bring your own UI.
        </p>
        <div className='flex flex-wrap items-center justify-center gap-3'>
          <Link
            href='/docs'
            className='rounded-lg bg-fd-primary px-5 py-2.5 text-sm font-medium text-fd-primary-foreground transition-opacity hover:opacity-90'
          >
            Get started
          </Link>
          <Link
            href='https://github.com/mbsatimov/use-filters'
            className='rounded-lg border px-5 py-2.5 text-sm font-medium transition-colors hover:bg-fd-accent'
          >
            GitHub
          </Link>
        </div>
      </section>

      <section className='mx-auto grid w-full max-w-4xl gap-4 px-6 pb-24 sm:grid-cols-3'>
        {FEATURES.map((feature) => (
          <div key={feature.title} className='rounded-xl border p-5'>
            <h3 className='mb-1 font-semibold'>{feature.title}</h3>
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
    body: 'Declare filters once; get a params object typed per config (or validated against your API type).'
  },
  {
    title: 'Zero UI, zero runtime deps',
    body: 'Ships the hook and types only. Render your own controls against your own design system.'
  }
];
