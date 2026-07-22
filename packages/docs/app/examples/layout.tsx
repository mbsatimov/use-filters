import { NuqsAdapter } from 'nuqs/adapters/next/app';
import { Suspense } from 'react';
import type { ReactNode } from 'react';

// Scoped to /examples only — the shadcn preset's theme tokens here
// (`--background`, `--primary`, …) are a different namespace from the docs
// site's `--fd-*` tokens (app/global.css), so both coexist without a clash.
import './examples.css';

import { TooltipProvider } from '@/components/examples/ui/tooltip';

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
