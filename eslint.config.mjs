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
    // `playground` is a dev-only scratch app (not published, not built) — keep
    // it out of the library's lint gate.
    ignores: ['dist', 'coverage', 'playground']
  },
  {
    rules: {
      // `process.env.NODE_ENV` is the standard build-time flag for a browser
      // library — bundlers replace it statically; `require('process')` is wrong here.
      'node/prefer-global/process': 'off'
    }
  }
);
