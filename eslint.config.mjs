import { eslint } from '@siberiacancode/eslint';

export default eslint(
  {
    typescript: true,
    react: true,
    jsonc: false,
    yaml: false,
    markdown: false,
    ignores: ['dist', 'coverage', '**/.source']
  },
  {
    rules: {
      // `process.env.NODE_ENV` is the standard build-time flag for a browser
      // library — bundlers replace it statically; `require('process')` is wrong here.
      'node/prefer-global/process': 'off',
      'ts/no-use-before-define': 'off',
      'siberiacancode/function-component-definition': 'off'
    }
  }
);
