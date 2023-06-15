import type { Plugin } from 'rollup';
import { transformSync } from '@babel/core';

import { babelPlugin } from './babel-plugin.js';
import { athenaCodegen } from './codegen.js';
import type { CodegenConfig } from './types.js';

export function rollupPlugin(options: CodegenConfig): Plugin {
  return {
    name: '@data-eden/codegen',

    async buildStart() {
      await athenaCodegen(options);
    },

    transform(code, id) {
      if (code.indexOf('@data-eden/codegen/gql') > -1) {
        const result = transformSync(code, {
          plugins: [[babelPlugin, options]],
          filename: id,
        });

        return result?.code;
      }

      return code;
    },
  };
}
