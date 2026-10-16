import { createMDX } from 'fumadocs-mdx/next';

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  // `/r/init.json` is generated per request and reads the kit sources off disk
  // at that point, unlike the static `/r/[item]` endpoints which read them at
  // build time. Nothing imports those files, so tracing cannot infer them —
  // without this the route deploys fine and then 500s on the first install.
  outputFileTracingIncludes: {
    '/r/init.json': ['./components/filters/**/*']
  },
  // Guides merged into /docs/guides/project-setup; keep old links working.
  redirects: async () => [
    {
      source: '/docs/guides/shared-setup',
      destination: '/docs/guides/project-setup',
      permanent: true
    },
    {
      source: '/docs/guides/route-loaders',
      destination: '/docs/guides/project-setup#3-route-loaders-with-resolvefilterparams',
      permanent: true
    }
  ]
};

export default withMDX(config);
