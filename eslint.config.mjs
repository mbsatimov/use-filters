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
    // The `apps/*` workspaces (playground, docs) are dev-only — not published,
    // not part of the library build — and have their own tooling. Keep them out
    // of the library's lint gate.
    ignores: ['dist', 'coverage', 'apps']
  },
  {
    rules: {
      // `process.env.NODE_ENV` is the standard build-time flag for a browser
      // library — bundlers replace it statically; `require('process')` is wrong here.
      'node/prefer-global/process': 'off'
    }
  }
);
