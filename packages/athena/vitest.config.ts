import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';
import { rollupPlugin } from '@data-eden/codegen';

export default defineConfig({
  plugins: [
    rollupPlugin({
      baseDir: resolve(__dirname, '__tests__'),
      schemaPath: resolve(
        __dirname,
        '..',
        '..',
        'internal-packages',
        'react-graphql-test-app',
        'src',
        'graphql',
        'schema.graphql'
      ),
      documents: ['**/*.test.ts'],
      extension: '.graphql.ts',
      disableSchemaTypesGeneration: false,
      production: false,
    }),
  ],
  test: {
    testTimeout: 10_000,
    include: ['__tests__/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '@data-eden/athena': resolve(__dirname, './src'),
      '@data-eden/cache': resolve(__dirname, '../cache/src'),
      '@data-eden/mocker': resolve(__dirname, '../mocker/src'),
    },
  },
});
