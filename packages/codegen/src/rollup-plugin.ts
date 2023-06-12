import type { Plugin } from 'rollup';
import { transformFileSync } from '@babel/core';

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
        const result = transformFileSync(id, {
          plugins: [babelPlugin],
        });

        return result?.code;
      }

      return code;
    },
  };
}
