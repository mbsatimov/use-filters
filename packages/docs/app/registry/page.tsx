import type { Metadata } from 'next';

import { ArrowUpRight, FileCode2, Github } from 'lucide-react';
import Link from 'next/link';

import { InstallCommand } from '@/components/registry/install-command';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { examples } from '@/lib/examples';
import { createMetadata } from '@/lib/metadata';
import { installCommand, kitSourceUrl, registryKits } from '@/lib/registry';

export const metadata: Metadata = createMetadata({
  title: 'Registry',
  description:
    'Installable filter UI kits built on use-filters — one shadcn add away. Each kit is a complete approach to filter UI, covering every filter type.',
  path: '/registry'
});

const exampleTitle = (slug: string) => examples.find((example) => example.slug === slug)?.title;

export default function RegistryPage() {
  return (
    <main className='mx-auto w-full max-w-4xl px-4 pb-16 sm:px-6'>
      <section className='flex flex-col gap-4 py-14'>
        <h1 className='text-3xl font-semibold tracking-tight sm:text-4xl'>Registry</h1>
        <p className='text-muted-foreground max-w-2xl leading-relaxed'>
          Complete filter UI kits built on <code className='text-foreground'>use-filters</code>,
          installable with the shadcn CLI. Each kit is a different approach to the same job —
          loop-driven bars that render from your config, or standalone controls you compose by hand
          — and each covers the full set of filter types, ready for a real project.
        </p>
        <p className='text-muted-foreground max-w-2xl text-sm leading-relaxed'>
          Every kit installs its files into{' '}
          <code className='text-foreground'>components/filters/…</code>, adds{' '}
          <code className='text-foreground'>@mbsatimov/use-filters</code> and any missing shadcn/ui
          primitives, and is yours to edit from there.
        </p>
      </section>

      <div className='flex flex-col gap-14'>
        {registryKits.map((kit) => (
          <section key={kit.name} className='scroll-mt-24' id={kit.name}>
            <div className='flex flex-wrap items-center gap-x-3 gap-y-2'>
              <a
                className='text-xl font-semibold tracking-tight hover:underline'
                href={`#${kit.name}`}
              >
                {kit.title}
              </a>
              <Badge className='font-mono text-[11px]' variant='secondary'>
                {kit.name}
              </Badge>
              <Button asChild className='ml-auto' size='sm' variant='ghost'>
                <a href={kitSourceUrl(kit)} rel='noreferrer' target='_blank'>
                  <Github className='size-3.5' /> Source
                </a>
              </Button>
            </div>

            <p className='text-muted-foreground mt-1 text-sm italic'>{kit.approach}</p>
            <p className='text-muted-foreground mt-2 max-w-3xl text-sm leading-relaxed'>
              {kit.description}
            </p>

            <div className='mt-4'>
              <InstallCommand command={installCommand(kit)} />
            </div>

            <div className='text-muted-foreground mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs'>
              <span className='flex items-center gap-1.5'>
                <FileCode2 className='size-3.5' />
                {kit.files.length} {kit.files.length === 1 ? 'file' : 'files'}
              </span>
              <span className='truncate font-mono'>{kit.dir}/</span>
            </div>

            {kit.usedBy.length > 0 && (
              <div className='mt-3 flex flex-wrap items-center gap-2 text-sm'>
                <span className='text-muted-foreground'>Used in:</span>
                {kit.usedBy.map((slug) => (
                  <Link
                    key={slug}
                    className='text-primary inline-flex items-center gap-1 hover:underline'
                    href={`/examples#${slug}`}
                  >
                    {exampleTitle(slug) ?? slug}
                    <ArrowUpRight className='size-3.5' />
                  </Link>
                ))}
              </div>
            )}
          </section>
        ))}
      </div>
    </main>
  );
}
