import type { FilterCommitMode, ResolvedFilter } from '@mbsatimov/use-filters';

import { createFilters } from '@mbsatimov/use-filters';
import * as React from 'react';

import { FilterField } from '@/components/filter-field';
import { Hero, TopBar } from '@/components/site-header';
import { StatePanel } from '@/components/state-panel';
import { Card, CardContent } from '@/components/ui/card';
import { TooltipProvider } from '@/components/ui/tooltip';
import { loadOwners, loadProducts, statusOptions, tagOptions } from '@/data/mock-data';

const { useFilters, f } = createFilters({ pagination: { pageKey: 'page', perPageKey: 'perPage' } });

/** Purely presentational grouping — which section each filter key renders under. */
const SECTIONS: { title: string; keys: string[] }[] = [
  { title: 'Search & status', keys: ['q', 'status', 'product'] },
  { title: 'Amounts & toggles', keys: ['min_amount', 'price', 'active'] },
  { title: 'Dates & times', keys: ['created', 'period', 'opens_at', 'hours'] },
  { title: 'Choices', keys: ['labels', 'keywords', 'owners'] }
];

export function App() {
  // Hook-level default `commit` — applies to filters without their own `commit`
  // (min_amount, price, …). q/status/product set their own, so they ignore it.
  const [defaultCommit, setDefaultCommit] = React.useState<FilterCommitMode>('instant');

  const filters = useFilters(
    {
      // Commit modes are the stars of the show:
      q: f.text({ label: 'Search', placeholder: 'debounced 500ms…', commit: { debounce: 500 } }),
      status: f.select({ label: 'Status', options: statusOptions, commit: 'manual' }),
      product: f.asyncSelect({ label: 'Product', loadOptions: loadProducts, commit: 'manual' }),

      // The rest are plain instant filters, one per kind:
      min_amount: f.number({ label: 'Min amount', unit: '$' }),
      price: f.numberRange({ label: 'Price range', unit: '$' }),
      active: f.boolean({ label: 'Active', trueLabel: 'Active', falseLabel: 'Archived' }),
      created: f.date({ label: 'Created on' }),
      period: f.dateRange({ label: 'Period' }),
      opens_at: f.time({ label: 'Opens at' }),
      hours: f.timeRange({ label: 'Business hours' }),
      labels: f.multiSelect({ label: 'Labels', options: tagOptions }),
      keywords: f.tags({ label: 'Keywords', placeholder: 'type + Enter' }),
      owners: f.asyncMultiSelect({
        label: 'Owners',
        loadOptions: loadOwners,
        searchDebounceMs: 500
      })
    },
    { defaultCommit, arraySeparator: '|' }
  );

  const byKey = filters.filterMap as Record<string, ResolvedFilter>;

  return (
    <TooltipProvider delayDuration={200}>
      <div className='bg-background min-h-screen'>
        <TopBar />

        <div className='mx-auto max-w-6xl px-6 pb-16'>
          <Hero />

          <div className='grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px] lg:items-start'>
            <Card className='py-0'>
              <CardContent className='divide-border/70 flex flex-col divide-y px-5'>
                {SECTIONS.map((section) => (
                  <section key={section.title} className='py-5 first:pt-5'>
                    <h2 className='text-muted-foreground mb-1 text-xs font-semibold tracking-wide uppercase'>
                      {section.title}
                    </h2>
                    <div className='divide-border/60 flex flex-col divide-y'>
                      {section.keys.map((key) => (
                        <FilterField key={key} filter={byKey[key]} />
                      ))}
                    </div>
                  </section>
                ))}
              </CardContent>
            </Card>

            <StatePanel
              defaultCommit={defaultCommit}
              onDefaultCommitChange={setDefaultCommit}
              filters={filters}
            />
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
