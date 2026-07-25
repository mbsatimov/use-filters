import type { ReactNode } from 'react';

import { HomeLayout } from 'fumadocs-ui/layouts/home';

import { TooltipProvider } from '@/components/ui/tooltip';
import { baseOptions } from '@/lib/layout.shared';

/** The gallery shares the site header; previews (in iframes) stay bare. */
export default function ExamplesGalleryLayout({ children }: { children: ReactNode }) {
  return (
    <HomeLayout {...baseOptions()}>
      <TooltipProvider delayDuration={200}>{children}</TooltipProvider>
    </HomeLayout>
  );
}
