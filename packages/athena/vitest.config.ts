import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@data-eden/react': resolve(__dirname, '..', 'react', 'src'),
      '@data-eden/athena': resolve(__dirname, 'src'),
      '@data-eden/shared-test-utilities': resolve(__dirname, '..', '..', 'internal-packages', 'shared-test-utilities'),
    }
  },
  test: {
    testTimeout: 10_000,
  },
});
