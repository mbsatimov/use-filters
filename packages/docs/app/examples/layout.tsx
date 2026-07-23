import { NuqsAdapter } from 'nuqs/adapters/next/app';
import { Suspense } from 'react';
import type { ReactNode } from 'react';

import { TooltipProvider } from '@/components/ui/tooltip';

export default function ExamplesLayout({ children }: { children: ReactNode }) {
  // The examples are real, standalone useFilters instances — they read and
  // write the actual browser URL, so they need a real nuqs adapter. nuqs reads
  // `useSearchParams()`, which Next requires a Suspense boundary around during
  // static prerendering.
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
