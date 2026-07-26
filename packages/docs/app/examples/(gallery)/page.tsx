import type { Metadata } from 'next';

import { ArrowRight, Github } from 'lucide-react';
import Link from 'next/link';
import fs from 'node:fs/promises';
import path from 'node:path';

import type { BlockFile } from '@/components/examples/block-viewer';

import { BlockViewer } from '@/components/examples/block-viewer';
import { CodeBlock } from '@/components/examples/code-block';
import { Button } from '@/components/ui/button';
import { examples, exampleSourceUrl } from '@/lib/examples';
import { createMetadata, siteConfig } from '@/lib/metadata';

export const metadata: Metadata = createMetadata({
  title: 'Examples',
  description:
    'Production filtering patterns built with use-filters — from a two-filter table to a config-driven filter menu. Preview each one live and copy the code.',
  path: '/examples'
});

export default async function ExamplesPage() {
  // Read each example's source at build time and pre-highlight it on the
  // server, so the Code tab costs nothing on the client.
  const blocks = await Promise.all(
    examples.map(async (example) => ({
      example,
      files: await Promise.all(
        example.files.map(async (file): Promise<BlockFile> => {
          const raw = await fs.readFile(path.join(process.cwd(), file.path), 'utf8');
          return {
            name: file.name,
            path: file.path,
            raw,
            code: <CodeBlock code={raw} lang={file.name.endsWith('.tsx') ? 'tsx' : 'ts'} />
          };
        })
      )
    }))
  );

  return (
    <main className='mx-auto w-full max-w-6xl px-4 pb-12 sm:px-6'>
      {/* Hero */}
      <section className='flex flex-col items-center gap-5 py-16 text-center sm:py-24'>
        <Link
          className='bg-muted/60 text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm transition-colors'
          href='/docs'
        >
          URL-synced filters for React
          <ArrowRight className='size-3.5' />
        </Link>
        <h1 className='max-w-3xl text-4xl font-bold tracking-tight text-balance sm:text-6xl'>
          Filter patterns, ready to ship
        </h1>
        <p className='text-muted-foreground max-w-2xl text-balance leading-relaxed sm:text-lg'>
          Real screens built with <code className='text-foreground'>use-filters</code>, from a
          two-filter table to a config-driven filter menu. Copy and paste into your apps. Every
          filter lives in the URL — shareable, refresh-safe, back-button friendly.
        </p>
        <div className='mt-1 flex items-center gap-2'>
          <Button asChild size='lg'>
            <a href='#basic'>Browse examples</a>
          </Button>
          <Button asChild size='lg' variant='ghost'>
            <Link href='/docs'>Read the docs</Link>
          </Button>
        </div>
      </section>

      {/* In-page nav */}
      <nav className='flex flex-wrap items-center gap-2'>
        {examples.map((example, index) => (
          <a
            key={example.slug}
            className='text-muted-foreground hover:border-foreground/30 hover:text-foreground inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm transition-colors'
            href={`#${example.slug}`}
          >
            <span className='font-mono text-xs'>{String(index + 1).padStart(2, '0')}</span>
            {example.title}
          </a>
        ))}
        <Button asChild className='ml-auto' size='sm' variant='outline'>
          <a
            href={`${siteConfig.repository}/tree/main/packages/docs/components/examples`}
            rel='noreferrer'
            target='_blank'
          >
            <Github className='size-3.5' /> View source
          </a>
        </Button>
      </nav>

      <div className='mt-14 flex flex-col gap-20'>
        {blocks.map(({ example, files }) => (
          <BlockViewer
            key={example.slug}
            defaultViewport={example.defaultViewport}
            files={files}
            iframeHeight={example.iframeHeight}
            kits={example.kits}
            slug={example.slug}
            sourceUrl={exampleSourceUrl(example)}
            tagline={example.tagline}
            title={example.title}
          />
        ))}
      </div>
    </main>
  );
}
