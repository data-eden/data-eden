import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';

export default defineConfig({
  test: {
    include: ['__tests__/**/*-test.ts'],
    testTimeout: 10_000,
  },
  resolve: {
    alias: {
      '@data-eden/cache': resolve(__dirname, './src'),
    },
  },
});
