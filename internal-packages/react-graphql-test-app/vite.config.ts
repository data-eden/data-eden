import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import graphql from '@rollup/plugin-graphql';
import { rollupPlugin } from '@data-eden/codegen';

import { resolve } from 'node:path';
import { readFileSync } from 'node:fs';
import { createMatchPath } from 'tsconfig-paths';

const tsConfig = JSON.parse(readFileSync('./tsconfig.json', 'utf8'));
const matcher = createMatchPath(process.cwd(), tsConfig.compilerOptions.paths);

export default defineConfig({
  plugins: [
    rollupPlugin({
      baseDir: 'src/graphql',
      schemaPath: 'schema.graphql',
      documents: ['**/*.graphql', '**/*.tsx'],
      extension: '.graphql.ts',
      disableSchemaTypesGeneration: false,
      production: true,
      resolver: function resolver(path) {
        const extensions = ['.tsx', '.jsx', '.js', '.ts'];

        return matcher(path, undefined, undefined, extensions);
      },
    }),
    react(),
    graphql(),
  ],
  resolve: {
    alias: {
      '@aliased': resolve(__dirname, 'src', 'aliased'),
    },
  },
});
