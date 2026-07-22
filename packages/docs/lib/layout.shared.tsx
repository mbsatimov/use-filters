import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';

/** Nav / branding shared by the docs layout and the home layout. */
export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: (
        <>
          <span className='font-mono font-semibold'>use-filters</span>
        </>
      )
    },
    githubUrl: 'https://github.com/mbsatimov/use-filters',
    links: [
      {
        text: 'Docs',
        url: '/docs',
        active: 'nested-url'
      }
    ]
  };
}
