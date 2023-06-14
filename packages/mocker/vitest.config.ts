import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';

import { rollupPlugin } from '@data-eden/codegen';

export default defineConfig({
  plugins: [
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    rollupPlugin({
      documents: ['__tests__/**/*.ts'],
      baseDir: __dirname,
      schemaPath:
        '../../internal-packages/react-graphql-test-app/src/graphql/schema.graphql',
      extension: '.graphql.ts',
      disableSchemaTypesGeneration: false,
      production: false,
    }),
  ],
  test: {
    testTimeout: 10_000,
  },
  resolve: {
    alias: {
      '@data-eden/mocker': resolve(__dirname, './src'),
    },
  },
});
