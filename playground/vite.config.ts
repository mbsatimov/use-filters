import { resolve } from 'node:path';

import { defineConfig } from 'vite';

/**
 * Dev-only playground for exercising every filter kind and commit mode against
 * the live `src`. Never part of the published package: `package.json#files`
 * ships only `dist`, and the library build (`tsup`) bundles only `src/index.ts`,
 * so nothing here can leak into the minified output.
 *
 * Uses Vite's built-in esbuild JSX transform (no `@vitejs/plugin-react`) to keep
 * the toolchain dependency-free — you lose React Fast Refresh, which a scratch
 * playground doesn't need.
 */
export default defineConfig({
  root: __dirname,
  esbuild: { jsx: 'automatic', jsxImportSource: 'react' },
  resolve: {
    // Import the library by its published name so the playground mirrors real usage.
    alias: { '@mbsatimov/use-filters': resolve(__dirname, '../src/index.ts') }
  },
  server: { open: true },
  // Static build for Vercel — emitted under `playground/dist` (Vercel's output dir).
  build: { outDir: 'dist', emptyOutDir: true }
});
