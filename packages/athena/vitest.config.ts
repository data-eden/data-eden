import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';

export default defineConfig({
  test: {
    testTimeout: 10_000,
  },
  resolve: {
    alias: {
      '@data-eden/athena': resolve(__dirname, './src'),
    },
  },
});
