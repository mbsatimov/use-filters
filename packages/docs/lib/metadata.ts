import type { Metadata, Viewport } from 'next';

/**
 * Canonical site origin — every absolute URL (canonical, Open Graph, sitemap,
 * robots) derives from it. Override with `NEXT_PUBLIC_SITE_URL` for previews.
 */
export const baseUrl = new URL(
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://use-filters.vercel.app'
);

/** One place for the strings that show up across metadata, JSON-LD, and the manifest. */
export const siteConfig = {
  name: 'use-filters',
  title: 'use-filters — Headless, URL-synced filter state for React',
  description:
    'Declare your filters once as a plain object and get a typed params object for fetching, ready-to-render filter state, and nuqs-backed URL sync. A headless, zero-runtime-dependency React library — bring your own UI.',
  author: { name: 'Mahkambek Satimov', url: 'https://github.com/mbsatimov' },
  repository: 'https://github.com/mbsatimov/use-filters',
  keywords: [
    'react',
    'hooks',
    'filters',
    'nuqs',
    'url-state',
    'query-params',
    'search-params',
    'table-filters',
    'faceted-search',
    'pagination',
    'headless',
    'typescript'
  ]
} as const;

/** Build an absolute URL for a site-relative path. */
export const absoluteUrl = (path = '/'): string => new URL(path, baseUrl).toString();

/** Root metadata applied to every route — Next merges each page's overrides on top. */
export const rootMetadata: Metadata = {
  metadataBase: baseUrl,
  title: { default: siteConfig.title, template: `%s — ${siteConfig.name}` },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  keywords: [...siteConfig.keywords],
  authors: [siteConfig.author],
  creator: siteConfig.author.name,
  publisher: siteConfig.author.name,
  category: 'technology',
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    siteName: siteConfig.name,
    title: siteConfig.title,
    description: siteConfig.description,
    url: baseUrl.toString(),
    locale: 'en_US'
  },
  twitter: {
    card: 'summary_large_image',
    title: siteConfig.title,
    description: siteConfig.description
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1
    }
  },
  icons: {
    icon: [
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' }
    ],
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png'
  },
  manifest: '/manifest.webmanifest',
  formatDetection: { telephone: false },
  verification: { google: 'eNMd6YUcZq1L2zqYcM0mVwsa_oj2IsXk7jSf5trPSF8' }
};

/** Theme color follows the site's light/dark background. */
export const rootViewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' }
  ]
};

interface PageMetaInput {
  description?: string;
  /** Site-relative path, for the canonical URL and `og:url`. Defaults to `/`. */
  path?: string;
  /** Page title (the site name is appended for the tab + social title). */
  title?: string;
}

/**
 * Build a page's `Metadata` with a canonical URL and complete, non-templated
 * Open Graph + Twitter titles. Use in every `page`/`generateMetadata` so each
 * route ships correct social + search metadata; the OG/Twitter image is added
 * site-wide by `app/opengraph-image` / `app/twitter-image`.
 */
export function createMetadata({ title, description, path = '/' }: PageMetaInput = {}): Metadata {
  const socialTitle = title ? `${title} — ${siteConfig.name}` : siteConfig.title;
  const desc = description ?? siteConfig.description;
  const url = absoluteUrl(path);
  return {
    // `absolute` on the home page bypasses the `%s — use-filters` template so
    // the title isn't suffixed twice; inner pages let the template append it.
    title: title ?? { absolute: siteConfig.title },
    description: desc,
    alternates: { canonical: url },
    openGraph: {
      type: 'website',
      siteName: siteConfig.name,
      title: socialTitle,
      description: desc,
      url,
      // Setting `openGraph` replaces the parent's, dropping the file-convention
      // image — so reference the generated card explicitly here.
      images: [{ url: absoluteUrl('/opengraph-image'), width: 1200, height: 630, alt: socialTitle }]
    },
    twitter: {
      card: 'summary_large_image',
      title: socialTitle,
      description: desc,
      images: [absoluteUrl('/twitter-image')]
    }
  };
}

/** JSON-LD graph for the home page: the site plus the software library it documents. */
export const homeJsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': `${baseUrl.toString()}#website`,
      url: baseUrl.toString(),
      name: siteConfig.name,
      description: siteConfig.description,
      inLanguage: 'en'
    },
    {
      '@type': 'SoftwareApplication',
      name: '@mbsatimov/use-filters',
      description: siteConfig.description,
      url: baseUrl.toString(),
      applicationCategory: 'DeveloperApplication',
      operatingSystem: 'Any',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      author: { '@type': 'Person', name: siteConfig.author.name, url: siteConfig.author.url },
      codeRepository: siteConfig.repository,
      programmingLanguage: 'TypeScript',
      license: 'https://opensource.org/licenses/MIT'
    }
  ]
};

/** JSON-LD `TechArticle` for a single docs page. */
export const articleJsonLd = (input: { title: string; description?: string; path: string }) => ({
  '@context': 'https://schema.org',
  '@type': 'TechArticle',
  headline: input.title,
  description: input.description,
  url: absoluteUrl(input.path),
  inLanguage: 'en',
  author: { '@type': 'Person', name: siteConfig.author.name, url: siteConfig.author.url },
  publisher: { '@type': 'Organization', name: siteConfig.name, url: baseUrl.toString() }
});
