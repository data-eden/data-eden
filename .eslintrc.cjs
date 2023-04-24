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
      files: ['dev/**/*.[tj]s'],
      env: {
        node: true,
      },
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
        'prefer-const': 'off',
        '@typescript-eslint/no-empty-function': 'off',
        '@typescript-eslint/require-await': 'off',
        '@typescript-eslint/consistent-type-imports': 'error',
        '@typescript-eslint/no-unused-vars': [
          'error',
          {
            args: 'none',
            ignoreRestSiblings: true,
          },
        ],
      },
    },
    // ember files
    {
      files: [
        './packages/ember/.eslintrc.js',
        './packages/ember/.prettierrc.js',
        './packages/ember/.template-lintrc.js',
        './packages/ember/ember-cli-build.js',
        './packages/ember/index.js',
        './packages/ember/testem.js',
        './packages/ember/blueprints/*/index.js',
        './packages/ember/config/**/*.js',
        './packages/ember/tests/dummy/config/**/*.js',
      ],
      parserOptions: {
        sourceType: 'script',
      },
      env: {
        browser: false,
        node: true,
      },
      plugins: ['node'],
      extends: ['plugin:node/recommended'],
    },
    {
      // test files
      files: ['./packages/ember/tests/**/*-test.{js,ts}'],
      extends: ['plugin:qunit/recommended'],
    },
  ],
};
