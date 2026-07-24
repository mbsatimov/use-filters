import type { MetadataRoute } from 'next';

import { examples } from '@/lib/examples';
import { absoluteUrl } from '@/lib/metadata';
import { source } from '@/lib/source';

/** All indexable routes: home, the examples gallery + each example, and every docs page. */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return [
    { url: absoluteUrl('/'), lastModified, changeFrequency: 'monthly', priority: 1 },
    { url: absoluteUrl('/examples'), lastModified, changeFrequency: 'monthly', priority: 0.7 },
    ...source.getPages().map((page) => ({
      url: absoluteUrl(page.url),
      lastModified,
      changeFrequency: 'weekly' as const,
      priority: 0.8
    })),
    ...examples.map((ex) => ({
      url: absoluteUrl(`/examples/${ex.slug}`),
      lastModified,
      changeFrequency: 'monthly' as const,
      priority: 0.6
    }))
  ];
}
