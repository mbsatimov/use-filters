import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';

/** The filter-funnel mark, in a filled badge — the project's logo. */
function Logo() {
  return (
    <span className='inline-flex items-center gap-2'>
      <span className='flex size-6 items-center justify-center rounded-md bg-fd-primary text-fd-primary-foreground'>
        <svg
          viewBox='0 0 24 24'
          fill='none'
          stroke='currentColor'
          strokeWidth='2.25'
          strokeLinecap='round'
          strokeLinejoin='round'
          className='size-3.5'
          aria-hidden
        >
          <path d='M3 5h18l-7 8v5l-4 2v-7L3 5z' />
        </svg>
      </span>
      <span className='font-mono text-[0.95rem] font-semibold tracking-tight'>
        use<span className='text-fd-muted-foreground'>-</span>filters
      </span>
    </span>
  );
}

/** Nav / branding shared by the docs layout and the home layout. */
export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: <Logo />
    },
    githubUrl: 'https://github.com/mbsatimov/use-filters',
    links: [
      {
        text: 'Documentation',
        url: '/docs',
        active: 'nested-url'
      }
    ]
  };
}
