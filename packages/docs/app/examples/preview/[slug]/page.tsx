import type { Metadata } from 'next';

import { notFound } from 'next/navigation';

import { examples, getExample } from '@/lib/examples';

export function generateStaticParams() {
  return examples.map((example) => ({ slug: example.slug }));
}

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await props.params;
  const example = getExample(slug);
  if (!example) return {};
  return {
    title: `${example.title} — example preview`,
    // The gallery embeds this page; only /examples should rank.
    robots: { index: false }
  };
}

export default async function ExamplePreviewPage(props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params;
  const example = getExample(slug);
  if (!example) notFound();

  const Component = example.Component;
  return (
    <div className='p-4 sm:p-6'>
      <Component />
    </div>
  );
}
