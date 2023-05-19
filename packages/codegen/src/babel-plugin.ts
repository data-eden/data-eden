import { template } from '@babel/core';
import { declare } from '@babel/helper-plugin-utils';
import type { NodePath } from '@babel/traverse';
import type { Program } from '@babel/types';
import * as nodePath from 'node:path';
import * as t from '@babel/types';
import { changeExtension } from './utils.js';

/**
 *
  This takes the following example:

  ```
  const memberFeedDetailPageQuery = gql<MemberFeedDetailPageQuery>`
    query MemberFeedDetailPage($urn: Urn!) {}
  `
  ```

  and converts it to:

  export const memberFeedDetailPageQuery = MemberFeedDetailPageDocument
 */
// TODO: we should parse the fragment, query or mutation name from the gql tag content via regex
function createImportName(name: string) {
  /*
  since we want to have the ability to have the following

  export const memberFeedDetailPageQuery = gql<MemberFeedDetailPageQuery>`
    query MemberFeedDetailPage {}
  `

  We want to uppercase the first character of the name to avoid collisions
  ```
  */
  let importName = name;

  importName = importName.charAt(0).toUpperCase() + importName.slice(1);

  if (importName.endsWith('Fragment')) {
    return `${importName}Doc`;
  } else if (importName.endsWith('Query')) {
    return importName.replace('Query', 'Document');
  } else {
    return importName.replace('Mutation', 'Document');
  }
}

const babelPlugin = declare((api) => {
  let program: NodePath<Program>;
  let gqlImportIdentifier: t.Identifier | null = null;
  let currentFileName: string | null | undefined = null;

  return {
    name: 'data-eden-codegen',
    visitor: {
      Program(path) {
        program = path;
      },
      ImportDeclaration(path) {
        const { node } = path;

        if (currentFileName !== this.file.opts.filename) {
          currentFileName = this.file.opts.filename;
          gqlImportIdentifier = null;
        }

        if (
          t.isStringLiteral(node.source) &&
          node.source.value === '@data-eden/codegen/gql'
        ) {
          const gqlSpecifier = node.specifiers.find((specifier) => {
            if (t.isImportSpecifier(specifier)) {
              return (
                t.isIdentifier(specifier.imported) &&
                specifier.imported.name === 'gql'
              );
            }
            return false;
          });

          if (gqlSpecifier) {
            gqlImportIdentifier = gqlSpecifier.local;

            // we do not watch to ship this to the client and it is a dead import at this point.
            path.remove();
          }
        }
      },
      TaggedTemplateExpression(path, state) {
        const { node } = path;

        if (
          t.isIdentifier(node.tag) &&
          gqlImportIdentifier &&
          node.tag.name === gqlImportIdentifier.name
        ) {
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

          const newImportDeclaration = template(`
            import { %%importName%% } from %%importPath%%
          `);

          program.unshiftContainer(
            'body',
            newImportDeclaration({
              importName: api.types.identifier(operationOrFragmentName),
              importPath: api.types.stringLiteral(importPath),
            })
          );

          path.replaceWith(api.types.identifier(operationOrFragmentName));
        }
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
