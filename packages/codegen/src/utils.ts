import { existsSync } from 'fs';
import { extname, parse, format } from 'node:path';
import { cosmiconfig, defaultLoaders, type Loader } from 'cosmiconfig';

import { pathToFileURL } from 'url';

import type { DependencyGraphNode } from './gql/dependency-graph.js';
import type { Definition, UnresolvedFragment } from './gql/types.js';
import type { CodegenConfig, PrimaryKeyAlias } from './types.js';
import { visit, Kind, type ASTNode, type ASTVisitor } from 'graphql';

export function changeExtension(fileName: string, ext: string): string {
  const parts = parse(fileName);

  ext = ext.startsWith('.') ? ext : `.${ext}`;

  return format({
    ...parts,
    ext,
    base: undefined,
  });
}

export function resolvedUnresolvedFragment(
  definitions: Set<DependencyGraphNode>,
  unresolvedFragment: UnresolvedFragment
): Definition | undefined {
  return Array.from(definitions).find((potentialDefinitionLocations) => {
    if (
      unresolvedFragment &&
      unresolvedFragment.type === 'unresolvedFragment' &&
      potentialDefinitionLocations.type !== 'unresolvedFragment' &&
      potentialDefinitionLocations.filePath === unresolvedFragment.filePath
    ) {
      return (
        potentialDefinitionLocations.exportName ===
        unresolvedFragment.exportName
      );
    }
  }) as Definition;
}

export function extensionAwareResolver(
  path: string,
  extensions: string[]
): string | undefined {
  const startingExtensionName = extname(path);
  const fileNameWithNoExtension = path.replace(`${startingExtensionName}`, '');

  return (
    extensions
      .map((ext) => {
        const potentialPath = fileNameWithNoExtension + `${ext}`;

        if (existsSync(potentialPath)) {
          return potentialPath;
        }
        return false;
      })
      .filter((path) => path !== false)[0] || undefined
  );
}

export function addPrimaryKeyAliasToGraphqlAST(
  ast: ASTNode,
  primaryKeyAlias: PrimaryKeyAlias | null
): ASTNode {
  if (!primaryKeyAlias) return ast;

  const visitor: ASTVisitor = {
    FragmentDefinition(node, key, parent, path, ancestors) {
      // Only modify the fields within the Car fragment
      if (primaryKeyAlias.fields[node.typeCondition.name.value]) {
        const selectionSet = node.selectionSet;
        const fields = selectionSet.selections;

        // Create a new FieldNode for the id field
        const idField = {
          kind: Kind.FIELD,
          name: {
            kind: Kind.NAME,
            value: primaryKeyAlias.fields[node.typeCondition.name.value],
          },
          alias: {
            kind: Kind.NAME,
            value: primaryKeyAlias.primaryKey,
          },
        };

        // Add the id field to the existing fields
        const modifiedFields = [...fields, idField];

        // Create a new SelectionSetNode with the modified fields
        const modifiedSelectionSet = {
          kind: Kind.SELECTION_SET,
          selections: modifiedFields,
        };

        // Create a new FragmentDefinition node with the modified selection set
        const modifiedNode = {
          ...node,
          selectionSet: modifiedSelectionSet,
        };

        return modifiedNode;
      }

      // Continue visiting other nodes
      return undefined;
    },
    InlineFragment(node, key, parent, path, ancestors) {
      // Only modify the fields within the Car inline fragment
      if (
        node?.typeCondition?.name?.value &&
        primaryKeyAlias.fields[node.typeCondition.name.value]
      ) {
        const selectionSet = node.selectionSet;
        const fields = selectionSet.selections;

        // Create a new FieldNode for the id field
        const idField = {
          kind: Kind.FIELD,
          name: {
            kind: Kind.NAME,
            value: primaryKeyAlias.fields[node.typeCondition.name.value],
          },
          alias: {
            kind: Kind.NAME,
            value: primaryKeyAlias.primaryKey,
          },
        };

        // Add the id field to the existing fields
        const modifiedFields = [...fields, idField];

        // Create a new SelectionSetNode with the modified fields
        const modifiedSelectionSet = {
          kind: Kind.SELECTION_SET,
          selections: modifiedFields,
        };

        // Create a new InlineFragment node with the modified selection set
        const modifiedNode = {
          ...node,
          selectionSet: modifiedSelectionSet,
        };

        return modifiedNode;
      }

      // Continue visiting other nodes
      return undefined;
    },
  };

  return visit(ast, visitor);
}

// tracking mjs support https://github.com/cosmiconfig/cosmiconfig/issues/224
const loadJs: Loader = async function loadJs(filepath, content) {
  try {
    const { href } = pathToFileURL(filepath);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
    return (await import(href)).default;
  } catch (error) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return defaultLoaders['.js'](filepath, content);
  }
};

export async function loadConfig(
  baseDir: string
): Promise<CodegenConfig | null> {
  const moduleName = 'dataeden';
  const explorer = cosmiconfig(moduleName, {
    loaders: {
      '.mjs': loadJs,
    },
    searchPlaces: [
      // tracking mjs support https://github.com/cosmiconfig/cosmiconfig/issues/224
      'package.json',
      `.${moduleName}rc.js`,
      `.${moduleName}rc.mjs`,
      `.${moduleName}rc.cjs`,
      `.config/${moduleName}rc`,
      `.config/${moduleName}rc.js`,
      `.config/${moduleName}rc.mjs`,
      `.config/${moduleName}rc.cjs`,
      `${moduleName}.config.js`,
      `${moduleName}.config.mjs`,
      `${moduleName}.config.cjs`,
    ],
  });

  const potentialConfig = await explorer.search(baseDir);

  // TODO: we should properly type narrow this
  return potentialConfig?.config as unknown as CodegenConfig;
}

export function defineConfig(config: CodegenConfig): CodegenConfig {
  return config;
}
