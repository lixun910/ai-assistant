import globals from 'globals';
import pluginJs from '@eslint/js';
import tseslint from 'typescript-eslint';
import pluginReact from 'eslint-plugin-react';

export default [
  { files: ['**/*.{js,mjs,cjs,ts,jsx,tsx}'] },
  {
    ignores: [
      'src/llm/wip/',
      'tailwind.config.js',
      'postcss.config.js',
      'vite.config.ts',
      'test/quick-test.ts',
      'dist/',
    ],
  },
  { settings: { react: { version: 'detect' } } },
  { languageOptions: { globals: globals.browser } },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  pluginReact.configs.flat.recommended,
];
