import type { MetadataRoute } from 'next';

import { absoluteUrl, baseUrl } from '@/lib/metadata';

/** Allow all crawlers everywhere and point them at the sitemap. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: absoluteUrl('/sitemap.xml'),
    host: baseUrl.host
  };
}
