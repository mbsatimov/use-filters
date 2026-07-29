'use client';

import type { ReactNode } from 'react';

import { ArrowUpRight, Check, ChevronDown, FilterIcon, Search, X } from 'lucide-react';
import Link from 'next/link';

import type { KitChoice, ProjectConfig } from '@/lib/builder/types';

import { Badge } from '@/components/ui/badge';
import { DEFAULTS } from '@/lib/builder/types';
import { registryKits } from '@/lib/registry';
import { cn } from '@/lib/utils';

/**
 * The kit choice, shown as miniature mockups.
 *
 * What separates these kits is where the controls sit and what shape they take
 * — one toolbar with chips, a sidebar of checkbox facets, or loose dropdowns
 * you place yourself. So every sketch is the same screen — filters over the
 * same results table — with only the filter UI swapped, exactly the difference
 * the choice is about. Each card also links to a working example.
 */

/* ── Sketch primitives ──────────────────────────────────────────────────
   One shared scale (8px type, 6px gaps) and one shared results table, so
   the four sketches read as variations of a single screen. */

const text = 'text-[8px] leading-none whitespace-nowrap';

const Control = ({ children }: { children: ReactNode }) => (
  <span
    className={cn(
      'border-foreground/15 bg-background text-muted-foreground flex items-center gap-1 rounded-[4px] border px-1.5 py-1',
      text
    )}
  >
    {children}
  </span>
);

const Chip = ({ children }: { children: ReactNode }) => (
  <span
    className={cn(
      'bg-primary/10 text-primary flex items-center gap-1 rounded-full px-1.5 py-1',
      text
    )}
  >
    {children}
    <X className='size-[6px] opacity-60' />
  </span>
);

const Bar = ({ className }: { className?: string }) => (
  <span className={cn('bg-foreground/12 h-[4px] rounded-full', className)} />
);

/**
 * The results every kit filters — a mini table whose rows spread evenly over
 * whatever height is left, so no sketch has dead space.
 */
const ResultRows = () => (
  <div className='border-foreground/10 bg-background/50 flex min-h-0 flex-1 flex-col justify-evenly rounded-[4px] border px-2'>
    {['w-1/3', 'w-1/4', 'w-2/5'].map((width) => (
      <div key={width} className='flex items-center gap-1.5'>
        <span className='bg-foreground/15 size-[5px] shrink-0 rounded-full' />
        <Bar className={width} />
        <Bar className='flex-1 opacity-50' />
        <Bar className='w-[10%]' />
      </div>
    ))}
  </div>
);

/**
 * The product grid a facet sidebar filters — cards with an image block and a
 * price line, the marketplace shape, where the other kits sit over a table.
 */
const ResultCards = () => (
  <div className='grid min-h-0 flex-1 grid-cols-3 gap-1.5'>
    {['w-3/4', 'w-2/3', 'w-4/5', 'w-1/2', 'w-5/6', 'w-3/5'].map((width) => (
      <div
        key={width}
        className='border-foreground/10 bg-background/50 flex min-h-0 flex-col gap-1 rounded-[4px] border p-1'
      >
        <span className='bg-foreground/10 min-h-0 flex-1 rounded-[3px]' />
        <Bar className={width} />
        <Bar className='w-1/3 opacity-60' />
      </div>
    ))}
  </div>
);

const Facet = ({ checked, label }: { checked?: boolean; label: string }) => (
  <span className={cn('text-muted-foreground flex items-center gap-1', text)}>
    <span
      className={cn(
        'flex size-[7px] shrink-0 items-center justify-center rounded-[2px] border',
        checked ? 'border-primary bg-primary text-primary-foreground' : 'border-foreground/25'
      )}
    >
      {checked && <Check className='size-[5px]' />}
    </span>
    {label}
  </span>
);

/** One toolbar: search inline, everything else behind Filters, chips below. */
const FilterBarSketch = () => (
  <div className='flex h-full flex-col gap-1.5'>
    <div className='flex items-center gap-1.5'>
      <span
        className={cn(
          'border-foreground/15 bg-background text-muted-foreground flex w-30 items-center gap-1 rounded-[4px] border px-1.5 py-1',
          text
        )}
      >
        <Search className='size-[7px]' />
        Search…
      </span>
      <span
        className={cn(
          'border-foreground/30 text-muted-foreground flex shrink-0 items-center gap-1 rounded-[4px] border border-dashed px-1.5 py-1',
          text
        )}
      >
        <FilterIcon className='size-[7px]' />
        Filters
      </span>
    </div>
    <div className='flex gap-1.5'>
      <Chip>Status: Paid</Chip>
      <Chip>Amount</Chip>
    </div>
    <ResultRows />
  </div>
);

/** A sidebar of facet sections beside the results. */
const FacetPanelSketch = () => (
  <div className='flex h-full gap-2'>
    <div className='flex w-[20%] flex-col gap-[5px]'>
      <span className={cn('text-foreground/75 font-medium', text)}>Status</span>
      <Facet checked label='Paid' />
      <Facet label='Pending' />
      <span className={cn('text-foreground/75 mt-1 font-medium', text)}>Region</span>
      <Facet label='EU' />
    </div>
    <div className='border-foreground/10 border-l' />
    <ResultCards />
  </div>
);

/** Separate dropdowns you place yourself — no bar, no chips, no reset. */
const FilterControlsSketch = () => (
  <div className='flex h-full flex-col gap-1.5'>
    <div className='flex items-center gap-1.5'>
      <Control>
        Status
        <ChevronDown className='size-[6px]' />
      </Control>
      <Control>
        Date
        <ChevronDown className='size-[6px]' />
      </Control>
      <Control>
        Amount
        <ChevronDown className='size-[6px]' />
      </Control>
    </div>
    <ResultRows />
  </div>
);

/** Nothing copied in — the hook hands you `filters`, you render it. */
const HeadlessSketch = () => (
  <div className='flex h-full flex-col gap-1.5'>
    <code className={cn('text-muted-foreground px-0.5 py-1', text)}>
      const {'{ filters }'} = useFilters(…)
    </code>
    <div
      className={cn(
        'border-foreground/20 text-muted-foreground/60 flex flex-1 items-center justify-center rounded-[4px] border border-dashed',
        text
      )}
    >
      your own components
    </div>
  </div>
);

const sketches: Record<KitChoice, () => ReactNode> = {
  'facet-panel': FacetPanelSketch,
  'filter-bar': FilterBarSketch,
  'filter-controls': FilterControlsSketch,
  none: HeadlessSketch
};

interface KitEntry {
  approach: string;
  /** Example slug to link to, when one exists. */
  example?: string;
  name: KitChoice;
  title: string;
}

const entries: KitEntry[] = [
  ...registryKits.map((kit) => ({
    approach: kit.approach,
    example: kit.usedBy[0],
    name: kit.name as KitChoice,
    title: kit.title
  })),
  {
    approach: 'Just the hook. Render your own controls from the filters array.',
    name: 'none',
    title: 'Headless'
  }
];

export const KitPicker = ({
  config,
  set
}: {
  config: ProjectConfig;
  set: (patch: Partial<ProjectConfig>) => void;
}) => (
  <div className='grid gap-3 sm:grid-cols-2'>
    {entries.map((entry) => {
      const selected = config.kit === entry.name;
      const Sketch = sketches[entry.name];

      return (
        <div
          key={entry.name}
          className={cn(
            'flex flex-col overflow-hidden rounded-xl border transition-colors',
            selected ? 'border-primary bg-primary/5' : 'hover:border-foreground/25'
          )}
        >
          <button
            className='flex flex-1 flex-col gap-3 p-3 text-left'
            type='button'
            onClick={() => set({ kit: entry.name })}
          >
            <div
              className={cn(
                'bg-muted/30 h-28 w-full rounded-lg border p-2.5 transition-colors',
                selected && 'border-primary/30'
              )}
            >
              <Sketch />
            </div>

            <div className='flex flex-col gap-1'>
              <span className='flex items-center gap-2'>
                <span
                  className={cn(
                    'flex size-4 shrink-0 items-center justify-center rounded-full border',
                    selected && 'border-primary bg-primary text-primary-foreground'
                  )}
                >
                  {selected && <Check className='size-2.5' />}
                </span>
                <span className='text-sm font-medium'>{entry.title}</span>
                {entry.name === DEFAULTS.kit && (
                  <Badge className='text-[10px]' variant='secondary'>
                    Recommended
                  </Badge>
                )}
              </span>
              <span className='text-muted-foreground pl-6 text-xs leading-relaxed'>
                {entry.approach}
              </span>
            </div>
          </button>

          {entry.example && (
            <Link
              className='text-muted-foreground hover:text-foreground hover:bg-muted/50 flex items-center gap-1 border-t px-3 py-2 text-xs transition-colors'
              href={`/examples#${entry.example}`}
              target='_blank'
            >
              See it in a real example
              <ArrowUpRight className='size-3' />
            </Link>
          )}
        </div>
      );
    })}
  </div>
);
