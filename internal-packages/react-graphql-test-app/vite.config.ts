import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import graphql from '@rollup/plugin-graphql';
import { babelPlugin } from '@data-eden/codegen';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [[babelPlugin, { production: true }]],
      },
    }),
    graphql(),
  ],
});
