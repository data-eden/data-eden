import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';

export default defineConfig({
  test: {
    testTimeout: 10_000,
    include: ['__tests__/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '@data-eden/react': resolve(__dirname, './src'),
    },
  },
});
