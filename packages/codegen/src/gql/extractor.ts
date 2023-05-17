/* eslint-disable @typescript-eslint/restrict-template-expressions */
import type { NodePath, Visitor } from '@babel/traverse';
import * as t from '@babel/types';
import type {
  TemplateLiteral,
  TemplateElement,
  Identifier,
  TaggedTemplateExpression,
  VariableDeclarator,
  ImportSpecifier,
  ImportDeclaration,
} from '@babel/types';
import * as assert from 'node:assert';
import type {
  DocumentNode,
  FragmentDefinitionNode,
  GraphQLSchema,
} from 'graphql';
import {
  parse as graphqlParse,
  specifiedRules,
  KnownFragmentNamesRule,
  NoUnusedFragmentsRule,
  validate,
} from 'graphql';
import { dirname, join, extname } from 'node:path';
import type {
  OperationDefinitionNodeWithName,
  Definition,
  Fragment,
  UnresolvedFragment,
} from './types.js';
import { createHash } from 'crypto';
import { existsSync } from 'node:fs';

const VALIDATION_RULES = [...specifiedRules].filter(
  // This rules will be applied once we have full depedency graph for the queries resolvedx
  (rule) => rule !== KnownFragmentNamesRule && rule !== NoUnusedFragmentsRule
);

function getDefinition(
  documentAst: DocumentNode,
  filePath: string
): OperationDefinitionNodeWithName | FragmentDefinitionNode {
  if (documentAst.definitions.length !== 1) {
    throw new Error(
      `Only single definitions allowed per usage of the graphql tag at "${filePath}"`
    );
  }
  const definition = documentAst.definitions.at(0)!;

  if (
    definition.kind === 'OperationDefinition' ||
    definition.kind === 'FragmentDefinition'
  ) {
    if (!definition.name) {
      throw new Error('Operations must have names present');
    }
    return definition as OperationDefinitionNodeWithName;
  } else {
    throw new Error(`Unsupported definition ${definition.kind}`);
  }
}

export function getSortedTemplateElements(
  tmplLiteral: TemplateLiteral
): (TemplateElement | Identifier)[] {
  // Literal has no expressions quasis can be returned as is
  if (!tmplLiteral.expressions || tmplLiteral.expressions.length === 0) {
    return tmplLiteral.quasis;
  }

  const hasNonIdentifierExpr = tmplLiteral.expressions.some(
    (expr) => expr.type !== 'Identifier'
  );

  if (hasNonIdentifierExpr) {
    throw new Error(
      'graphql TaggedTemplateExpression must only contain identifiers in ${} references'
    );
  }

  const identifiers = tmplLiteral.expressions as Identifier[];

  const elements = [...identifiers, ...tmplLiteral.quasis];
  elements.sort((a, b) => {
    return (a.start || 0) - (b.start || 0);
  });

  return elements;
}

function getForeignReference(
  elem: Identifier,
  path: NodePath<TaggedTemplateExpression>,
  localDefinitionDeclaratorMap: Map<NodePath<VariableDeclarator>, Definition>
): Fragment | UnresolvedFragment {
  const binding = path.scope.getBinding(elem.name);
  if (!binding) {
    throw new Error(
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      `Unable to find binding for ${elem.name} at ${elem.loc?.filename} ${elem.loc?.start.line}:${elem.loc?.start.column}`
    );
  }

  const identifierDefPath = binding.path;
  let referencedFragment: Fragment | UnresolvedFragment | undefined;

  if (identifierDefPath.type === 'VariableDeclarator') {
    const identifierDef = localDefinitionDeclaratorMap.get(
      identifierDefPath as NodePath<VariableDeclarator>
    );

    if (!identifierDef) {
      throw new Error(
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        `Unable to find referenced definition for ${elem.name} at ${elem.loc?.filename} ${elem.loc?.start.line}:${elem.loc?.start.column}`
      );
    }

    if (identifierDef.type !== 'fragment') {
      throw new Error(
        'Cannot create a foreign reference from a non fragment type'
      );
    }

    referencedFragment = identifierDef;
  } else if (identifierDefPath.type === 'ImportSpecifier') {
    const importSpecifier = identifierDefPath.node as ImportSpecifier;
    const importDeclaration = identifierDefPath.parentPath
      ?.node as ImportDeclaration;

    // todo: figure out why this doesn't exist on the source node
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
    const currentDir = dirname((importDeclaration.source.loc as any).filename);
    // we want to resolve the filename if this is a local reference
    // TODO: ensure this works for external imports because that doesn't work for sure
    // TODO: how do we find the import filepath without thrashing the disk
    const importLocation = importDeclaration.source.value.replace(
      extname(importDeclaration.source.value),
      ''
    );
    const actualExtension = ['.tsx', '.jsx'].find((ext) => {
      return existsSync(join(currentDir, importLocation + ext));
    });

    if (!actualExtension) {
      throw new Error(
        `Can not resolve the extension name for ${
          importDeclaration.source.value
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        } in ${(importDeclaration.source.loc as any).filename}`
      );
    }
    const filename = join(currentDir, importLocation + actualExtension);

    referencedFragment = {
      location: importDeclaration.source.value,
      filePath: filename,
      isExternal: true,
      exportName: (importSpecifier.imported as Identifier).name,
      type: 'unresolvedFragment',
    };
  } else {
    throw new Error(
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      `Unsupported definition node type (${identifierDefPath.type}) in graphql definition for ${elem.name} at ${elem.loc?.filename} ${elem.loc?.start.line}:${elem.loc?.start.column}`
    );
  }

  return referencedFragment;
}

export function createExtractor(
  schema: GraphQLSchema,
  filePath: string,
  definitions: Array<Definition>
) {
  const localDefinitionDeclaratorMap = new Map<
    NodePath<VariableDeclarator>,
    Definition
  >();
  let gqlImportIdentifier: t.Identifier | null = null;

  const extractor: Visitor = {
    ImportDeclaration(path) {
      const { node } = path;

      if (
        t.isStringLiteral(node.source) &&
        node.source.value === '@data-eden/codegen'
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
        }
      }
    },
    TaggedTemplateExpression(path) {
      const node = path.node;

      if (
        !(
          t.isIdentifier(node.tag) &&
          gqlImportIdentifier &&
          node.tag.name === gqlImportIdentifier.name
        )
      ) {
        return;
      }

      const elements = getSortedTemplateElements(node.quasi);

      let placeholder = 0;
      const foreignReferences = new Map<
        string,
        Fragment | UnresolvedFragment
      >();
      const generatedDefinitionString = elements
        .map((elem) => {
          if (elem.type === 'TemplateElement') {
            return elem.value.raw;
          } else {
            const referencedDefinition = getForeignReference(
              elem,
              path,
              localDefinitionDeclaratorMap
            );

            const fragmentPlaceholder = `__FRAGMENT_${createHash('sha256')
              .update(filePath)
              .digest('hex')}_${placeholder++}__`;

            foreignReferences.set(fragmentPlaceholder, referencedDefinition);

            return `...${fragmentPlaceholder}`;
          }
        })
        .join('');

      const documentNode = graphqlParse(generatedDefinitionString);
      const defAst = getDefinition(documentNode, filePath);
      let def: Definition;

      const errors = validate(schema, documentNode, VALIDATION_RULES);
      if (errors.length > 0) {
        const errorMessageHeader = `in graphql query at ${filePath} ${node.loc?.start.line}:${node.loc?.start.column} \n`;
        throw new Error(
          errorMessageHeader + errors.map((error) => error.message).join('\n')
        );
      }

      if (defAst.kind === 'FragmentDefinition') {
        def = {
          filePath,
          foreignReferences,
          outputName: defAst.name.value,
          loc: node.loc,
          ast: defAst,
          type: 'fragment',
        };
      } else {
        def = {
          filePath,
          foreignReferences,
          outputName: defAst.name.value,
          loc: node.loc,
          ast: defAst,
          type: 'operation',
        };
      }

      if (path.parentPath && path.parentPath.type === 'VariableDeclarator') {
        const varDecl = path.parentPath as NodePath<VariableDeclarator>;
        localDefinitionDeclaratorMap.set(varDecl, def);

        if (varDecl.parentPath?.parentPath?.type === 'ExportNamedDeclaration') {
          const idType = varDecl.node.id.type;
          assert.equal(
            idType,
            'Identifier',
            `Expected Identifier but received ${idType}`
          );
          def.exportName = (varDecl.node.id as Identifier).name;
        }
      }

      definitions.push(def);
    },
  };

  return extractor;
}
