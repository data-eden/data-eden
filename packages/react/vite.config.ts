import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    sourcemap: true,
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: '@data-eden/react',
      fileName: 'data-eden-react',
    },
    rollupOptions: {
      external: ['react', '@data-eden/athena'],
    },
  },
});
