import typescript from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';

export default {
  input: ['src/index.ts', 'src/babel-plugin.ts', 'src/gql.ts'],
  plugins: [
    json(),
    commonjs(),
    nodeResolve({
      preferBuiltins: true,
    }),
    typescript({
      tsconfig: './tsconfig.json',
      declaration: true,
    }),
  ],
  output: [
    {
      dir: `dist/`,
      entryFileNames: '[name].cjs',
      format: 'cjs',
      sourcemap: true,
    },
    {
      dir: `dist/`,
      entryFileNames: '[name].js',
      format: 'esm',
      sourcemap: true,
    },
  ],
};
