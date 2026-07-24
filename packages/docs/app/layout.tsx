import type { ReactNode } from 'react';

import { RootProvider } from 'fumadocs-ui/provider/next';
import { Inter } from 'next/font/google';

import { cn } from '@/lib/utils';

import './global.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html suppressHydrationWarning className={cn('font-sans', inter.variable)} lang='en'>
      <body className='flex min-h-screen flex-col'>
        <RootProvider>{children}</RootProvider>
      </body>
    </html>
  );
}
