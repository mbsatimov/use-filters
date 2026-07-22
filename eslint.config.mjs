import { eslint } from '@siberiacancode/eslint';

export default eslint(
  {
    typescript: true,
    react: true,
    // Prettier owns formatting for these; the ESLint language plugins also crash
    // under ESLint 10 (unicorn rules on the jsonc language), so keep ESLint to code.
    jsonc: false,
    yaml: false,
    markdown: false,
    // The docs workspace is dev-only — not published, not part of the library
    // build — and has its own tooling. Keep it out of the library's lint gate.
    ignores: ['dist', 'coverage', 'packages/docs']
  },
  {
    rules: {
      // `process.env.NODE_ENV` is the standard build-time flag for a browser
      // library — bundlers replace it statically; `require('process')` is wrong here.
      'node/prefer-global/process': 'off'
    }
  }
);
