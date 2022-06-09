'use strict';

module.exports = {
  root: true,
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
  extends: ['eslint:recommended', 'prettier'],
  rules: {},
  overrides: [
    // node files
    {
      files: ['**/*.cjs'],
      parserOptions: {
        sourceType: 'script',
      },
      env: {
        node: true,
      },
      plugins: ['node'],
      extends: ['plugin:node/recommended'],
    },
    {
      files: ['**/*.ts'],
      parser: '@typescript-eslint/parser',
      parserOptions: {
        tsconfigRootDir: __dirname,
        project: ['./tsconfig.eslint.json', './packages/*/tsconfig.json'],
      },
      plugins: ['@typescript-eslint'],
      extends: [
        'plugin:@typescript-eslint/recommended',
        'plugin:@typescript-eslint/recommended-requiring-type-checking',
      ],
      rules: {
        '@typescript-eslint/no-unused-vars': [
          'error',
          { argsIgnorePattern: '^_.*$' },
        ],
      },
    },
  ],
};
