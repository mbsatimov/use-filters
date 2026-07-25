import type { ReactNode } from 'react';

import { NuqsAdapter } from 'nuqs/adapters/next/app';
import { Suspense } from 'react';

import { TooltipProvider } from '@/components/ui/tooltip';

/**
 * The bare shell the gallery's iframes load: no site chrome, just the example.
 *
 * The examples are real, standalone `useFilters` instances — they read and
 * write their document's URL, so they need a real nuqs adapter. nuqs reads
 * `useSearchParams()`, which Next requires a Suspense boundary around during
 * static prerendering.
 */
export default function ExamplePreviewLayout({ children }: { children: ReactNode }) {
  return (
    <NuqsAdapter>
      <TooltipProvider delayDuration={200}>
        <div className='bg-background text-foreground min-h-screen'>
          <Suspense>{children}</Suspense>
        </div>
      </TooltipProvider>
    </NuqsAdapter>
  );
}
