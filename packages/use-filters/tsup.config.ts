import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  minify: false,
  // Never bundle these — the consuming app supplies its own single copy.
  external: ['react', 'nuqs']
});
