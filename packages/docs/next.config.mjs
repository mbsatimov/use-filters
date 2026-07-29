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
  }
};

export default withMDX(config);
