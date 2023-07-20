import type { Types } from '@graphql-codegen/plugin-helpers';
import type { DocumentNode, GraphQLSchema } from 'graphql';
import { Source, parse } from 'graphql';
import { readFileSync } from 'node:fs';
import { extractDefinitions } from './gql/extract-definitions.js';
import { resolveForeignReferences } from './gql/foreign-ref-resolver.js';
import { outputOperations } from './gql/output-operations.js';
import type { ExtractedDefinitions } from './gql/types.js';
import * as path from 'node:path';
import type { DependencyGraph } from './gql/dependency-graph.js';
import type { PrimaryKeyAlias } from './types.js';
import { type Resolver } from './types.js';
import { createDebug } from './debug.js';
import { rewriteAst } from './utils.js';

const debug = createDebug('generate-document-files');

type FilesMap = {
  gqlFiles: Array<string>;
  gqlTags: Array<string>;
};

export function generateDocumentFiles(
  schema: GraphQLSchema,
  documentPaths: Array<string>,
  primaryKeyAlias: PrimaryKeyAlias | null,
  resolver: Resolver
): {
  gqlFileDocuments: Array<Types.DocumentFile>;
  gqlTagDocuments: Array<Types.DocumentFile>;
  dependencyGraph: DependencyGraph;
} {
  const { gqlFiles, gqlTags } = documentPaths.reduce<FilesMap>(
    (acc, docPath) => {
      const ext = path.extname(docPath);

      if (['.gql', '.graphql'].includes(ext)) {
        acc.gqlFiles.push(docPath);
      } else {
        acc.gqlTags.push(docPath);
      }

      return acc;
    },
    {
      gqlFiles: [],
      gqlTags: [],
    }
  );

  const files = handleGraphQLFiles(schema, gqlFiles, primaryKeyAlias);
  const { tags, dependencyGraph } = handleGraphQLTags(
    schema,
    gqlTags,
    resolver,
    primaryKeyAlias
  );

  return {
    gqlFileDocuments: files,
    gqlTagDocuments: tags,
    dependencyGraph,
  };
}

// TODO: resolver should be passed here to be able to resolve import paths
function handleGraphQLFiles(
  schema: GraphQLSchema,
  documentPaths: Array<string>,
  primaryKeyAlias: PrimaryKeyAlias | null
): Array<Types.DocumentFile> {
  return documentPaths.map((path) => {
    debug(`compile .graphql: ${path}`);

    try {
      const contents = readFileSync(path, 'utf-8');
      const parsed = rewriteAst(
        parse(new Source(contents, path)),
        schema,
        primaryKeyAlias
      ) as DocumentNode;

      return {
        location: path,
        document: parsed,
        rawSDL: contents,
      };
    } catch (e) {
      if (e instanceof Error) {
        e.message = `[@data-eden/codegen]: Error processing .graphql file ${path}: ${e?.message}`;
      }
      throw e;
    }
  });
}

function handleGraphQLTags(
  schema: GraphQLSchema,
  documentPaths: Array<string>,
  resolver: Resolver,
  primaryKeyAlias: PrimaryKeyAlias | null
): {
  tags: Array<Types.DocumentFile>;
  dependencyGraph: DependencyGraph;
} {
  const extractedQueriesMap: Map<string, ExtractedDefinitions> = new Map();

  documentPaths.forEach((filePath) => {
    debug(`compile gql tags in : ${filePath}`);
    try {
      const extractedQueries = extractDefinitions(
        schema,
        filePath,
        resolver,
        primaryKeyAlias
      );
      if (extractedQueries.definitions.length > 0) {
        extractedQueriesMap.set(filePath, extractedQueries);
      }
    } catch (e) {
      if (e instanceof Error) {
        e.message = `[@data-eden/codegen]: Error processing gql tags in ${filePath}: ${e?.message}`;
      }
      throw e;
    }
  });

  const moduleAliasMap: Record<string, string> = {};

  const dependencyGraph = resolveForeignReferences(
    extractedQueriesMap,
    moduleAliasMap,
    schema
  );

  return { tags: outputOperations(dependencyGraph), dependencyGraph };
}
