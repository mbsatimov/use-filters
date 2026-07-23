import { ArrowLeft } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import fs from 'node:fs/promises';
import path from 'node:path';

import { CodeBlock } from '@/components/examples/code-block';
import { ExampleFrame, type ExampleFile } from '@/components/examples/example-frame';
import { examples, getExample } from '@/lib/examples';

export function generateStaticParams() {
  return examples.map((e) => ({ slug: e.slug }));
}

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await props.params;
  const ex = getExample(slug);
  return ex ? { title: `${ex.title} — Examples`, description: ex.description } : {};
}

export default async function ExamplePage(props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params;
  const ex = getExample(slug);
  if (!ex) notFound();

  // Read each source file at build time and pre-highlight it on the server.
  // Paths are repo-relative because an example's sources span `components/` and
  // `lib/` (shared data lives in `lib`).
  const baseDir = process.cwd();
  const files: ExampleFile[] = await Promise.all(
    ex.files.map(async (file) => {
      const raw = await fs.readFile(path.join(baseDir, file.path), 'utf8');
      const lang = file.lang ?? (file.name.endsWith('.tsx') ? 'tsx' : 'ts');
      return { name: file.name, raw, code: <CodeBlock code={raw} lang={lang} /> };
    })
  );

  const Component = ex.Component;

  return (
    <div className='mx-auto max-w-6xl px-6 py-10'>
      <Link
        href='/examples'
        className='text-muted-foreground hover:text-foreground mb-6 inline-flex items-center gap-1.5 text-sm'
      >
        <ArrowLeft className='size-4' /> All examples
      </Link>
      <h1 className='text-2xl font-semibold tracking-tight'>{ex.title}</h1>
      <p className='text-muted-foreground mt-1.5 mb-6 max-w-2xl text-sm leading-relaxed'>
        {ex.description}
      </p>
      <ExampleFrame preview={<Component />} files={files} />
    </div>
  );
}
