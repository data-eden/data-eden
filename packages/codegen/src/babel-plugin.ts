import type { PluginObj } from '@babel/core';
import { template } from '@babel/core';
import { declare } from '@babel/helper-plugin-utils';
import type { NodePath } from '@babel/traverse';
import type { Program } from '@babel/types';
import * as nodePath from 'node:path';
import * as t from '@babel/types';
import { changeExtension } from './utils.js';

interface PluginOptions {
  tagName: string;
}

function createImportName(name: string): string {
  if (name.endsWith('Fragment')) {
    return `${name}Doc`;
  } else if (name.endsWith('Query')) {
    return name.replace('Query', 'Document');
  } else {
    return name.replace('Mutation', 'Document');
  }
}

const babelPlugin = declare<PluginOptions>((api, options): PluginObj => {
  let program: NodePath<Program>;

  return {
    name: 'data-eden-codegen',
    visitor: {
      Program(path) {
        program = path;
      },
      TaggedTemplateExpression(path, state) {
        const { node } = path;

        if (!(t.isIdentifier(node.tag) && node.tag.name === options.tagName)) {
          return;
        }

        const parentNode = path.parentPath.node;

        if (!t.isVariableDeclarator(parentNode)) {
          return;
        }

        t.assertIdentifier(parentNode.id);

        const operationOrFragmentName = createImportName(parentNode.id.name);

        const filePath = state.filename;

        if (!filePath) {
          throw new Error('@data-eden/codegen: Unable to resolve filepath.');
        }

        const importPath = getRelativeImportPath(filePath);

        const importDeclaration = template(`
          import { %%importName%% } from %%importPath%%
        `);

        program.unshiftContainer(
          'body',
          importDeclaration({
            importName: api.types.identifier(operationOrFragmentName),
            importPath: api.types.stringLiteral(importPath),
          })
        );
        path.replaceWith(api.types.identifier(operationOrFragmentName));
      },
    },
  };
});

function getRelativeImportPath(filePath: string): string {
  const fullImportPath = nodePath.join(
    nodePath.dirname(filePath),
    '__generated',
    changeExtension(nodePath.basename(filePath), '.graphql.ts')
  );

  const relative = nodePath.relative(
    nodePath.dirname(filePath),
    nodePath.resolve(fullImportPath)
  );

  const prefix = relative === '' || !relative.startsWith('.') ? './' : '';

  const importPath = prefix + relative;

  return importPath;
}

export { babelPlugin };
