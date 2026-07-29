import type { MetadataRoute } from 'next';

import { absoluteUrl } from '@/lib/metadata';
import { source } from '@/lib/source';

/**
 * All indexable routes: home, the examples gallery, the registry, and every
 * docs page. Example previews (`/examples/preview/*`) are embedded iframes and
 * marked noindex, so they stay out.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return [
    { url: absoluteUrl('/'), lastModified, changeFrequency: 'monthly', priority: 1 },
    { url: absoluteUrl('/examples'), lastModified, changeFrequency: 'monthly', priority: 0.7 },
    { url: absoluteUrl('/registry'), lastModified, changeFrequency: 'monthly', priority: 0.7 },
    ...source.getPages().map((page) => ({
      url: absoluteUrl(page.url),
      lastModified,
      changeFrequency: 'weekly' as const,
      priority: 0.8
    }))
  ];
}
