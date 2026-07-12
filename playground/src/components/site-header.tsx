import { ChevronRight, Github } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const REPO = 'https://github.com/mbsatimov/use-filters';
// GitHub uses `/tree/` for directories, `/blob/` for files.
const SRC_DIR = `${REPO}/tree/main/playground`;
const APP_TSX = `${REPO}/blob/main/playground/src/App.tsx`;

/**
 * The exact `useFilters` call powering this page, shown inline so the deployed
 * demo teaches the API on its own. Keep in sync with `App()`.
 */
const CONFIG_SNIPPET = `const {
  params,     // committed values + pagination — your fetch input & query key
  filters,    // resolved filters to render (excludes hidden)
  filterMap,  // same, keyed by config key (includes hidden)
  isDirty,    // a change hasn't reached params yet (debounce pending / awaiting apply)
  apply,      // commit all pending changes now
  cancel,     // discard pending changes
  reset       // clear every filter
} = useFilters({
  // 'commit' controls WHEN a change reaches params/the URL:
  q:      f.text({ label: 'Search', commit: { debounce: 500 } }), // commit 500ms after last keystroke
  status: f.select({ label: 'Status', options, commit: 'manual' }), // commit only on apply()
  city:   f.asyncSelect({ label: 'City', loadOptions, commit: 'manual' }),

  // Default commit is 'instant' — one filter per kind:
  min_amount: f.number({ label: 'Min amount' }),
  price:      f.numberRange({ label: 'Price range' }),
  active:     f.boolean({ label: 'Active' }),
  created:    f.date({ label: 'Created on' }),
  period:     f.dateRange({ label: 'Period' }),
  opens_at:   f.time({ label: 'Opens at' }),
  hours:      f.timeRange({ label: 'Business hours' }),
  labels:     f.multiSelect({ label: 'Labels', options }),
  keywords:   f.tags({ label: 'Keywords' }),
  owners:     f.asyncMultiSelect({ label: 'Owners', loadOptions })
});`;

export function TopBar() {
  return (
    <header className='bg-background/85 sticky top-0 z-10 border-b backdrop-blur-md'>
      <div className='mx-auto flex max-w-6xl items-center gap-3 px-6 py-3'>
        <div className='flex items-center gap-2'>
          <div className='bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md text-xs font-bold'>
            f
          </div>
          <span className='text-sm font-semibold tracking-tight'>use-filters</span>
          <Badge variant='secondary' className='font-normal'>
            playground
          </Badge>
        </div>

        <nav className='ml-auto flex items-center gap-1'>
          <Button asChild variant='ghost' size='sm' className='text-muted-foreground'>
            <a href={APP_TSX} target='_blank' rel='noreferrer'>
              App.tsx
            </a>
          </Button>
          <Button asChild variant='ghost' size='sm' className='text-muted-foreground'>
            <a href={SRC_DIR} target='_blank' rel='noreferrer'>
              Source
            </a>
          </Button>
          <Button asChild variant='outline' size='sm'>
            <a href={REPO} target='_blank' rel='noreferrer'>
              <Github className='size-3.5' />
              GitHub
            </a>
          </Button>
        </nav>
      </div>
    </header>
  );
}

export function Hero() {
  return (
    <div className='flex flex-col gap-4 pt-8 pb-6'>
      <div>
        <h1 className='text-2xl font-semibold tracking-tight'>Every filter kind, live.</h1>
        <p className='text-muted-foreground mt-1.5 max-w-2xl text-sm leading-relaxed'>
          All three commit modes side by side — watch the URL, <code className='code'>params</code>,
          and <code className='code'>isDirty</code> update as you interact. Each status icon reads
          straight off the filter itself (<code className='code'>isDebounced</code>,{' '}
          <code className='code'>isManual</code>, <code className='code'>isDirty</code>) — no extra
          plumbing in this page.
        </p>
      </div>

      <details className='group bg-card/50 border-border rounded-lg border'>
        <summary className='text-foreground flex cursor-pointer items-center gap-1.5 px-4 py-2.5 text-sm font-medium select-none'>
          <ChevronRight className='text-muted-foreground size-3.5 transition-transform group-open:rotate-90' />
          The config behind this demo
        </summary>
        <div className='border-border border-t px-4 py-3'>
          <pre className='scrollbar-thin overflow-x-auto font-mono text-[0.8125rem] leading-relaxed'>
            {CONFIG_SNIPPET}
          </pre>
          <p className='text-muted-foreground mt-3 text-xs'>
            See{' '}
            <a
              href={APP_TSX}
              target='_blank'
              rel='noreferrer'
              className='text-primary hover:underline'
            >
              App.tsx
            </a>{' '}
            for how each filter is rendered (one <code className='code'>case</code> per kind).
          </p>
        </div>
      </details>
    </div>
  );
}
