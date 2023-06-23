import { existsSync } from 'fs';
import { extname, parse, format } from 'node:path';
import { cosmiconfig, defaultLoaders, type Loader } from 'cosmiconfig';

import { pathToFileURL } from 'url';

import type { DependencyGraphNode } from './gql/dependency-graph.js';
import type { Definition, UnresolvedFragment } from './gql/types.js';
import type { CodegenConfig, PrimaryKeyAlias } from './types.js';
import {
  visit,
  Kind,
  type GraphQLSchema,
  type ASTNode,
  type ASTVisitor,
  TypeInfo,
  visitWithTypeInfo,
  getNamedType,
} from 'graphql';

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

export function rewriteAst(
  ast: ASTNode,
  schema: GraphQLSchema,
  primaryKeyAlias: PrimaryKeyAlias | null
): ASTNode {
  if (!primaryKeyAlias) return ast;

  const typeInfo = new TypeInfo(schema);

  const visitor: ASTVisitor = {
    SelectionSet(node) {
      const selectionType = typeInfo.getType();
      const name = getNamedType(selectionType)?.name;

      const selections = [
        {
          kind: Kind.FIELD,
          name: {
            kind: Kind.NAME,
            value: '__typename',
          },
        },
        ...node.selections,
      ];

      if (name && primaryKeyAlias.fields[name]) {
        selections.push({
          kind: Kind.FIELD,
          name: {
            kind: Kind.NAME,
            value: primaryKeyAlias.fields[name],
          },
          alias: {
            kind: Kind.NAME,
            value: primaryKeyAlias.primaryKey,
          },
        });
      }

      return {
        ...node,
        selections,
      };
    },
  };

  return visit(ast, visitWithTypeInfo(typeInfo, visitor));
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
