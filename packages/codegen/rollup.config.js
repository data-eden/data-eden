import typescript from 'rollup-plugin-typescript2';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import { babel } from '@rollup/plugin-babel';

export default {
  input: ['./src/index.ts', './src/babel-plugin.ts', './src/gql.ts'],
  plugins: [
    typescript({
      tsconfig: './tsconfig.json',
      declaration: true,
    }),
    json(),
    commonjs(),
    nodeResolve({
      preferBuiltins: true,
    }),
    babel({ babelHelpers: 'bundled' }),
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
