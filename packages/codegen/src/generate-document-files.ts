import type { Types } from '@graphql-codegen/plugin-helpers';
import type { GraphQLSchema } from 'graphql';
import { parse } from 'graphql';
import { readFileSync } from 'node:fs';
import { extractDefinitions } from './gql/extract-definitions.js';
import { resolveForeignReferences } from './gql/foreign-ref-resolver.js';
import { outputOperations } from './gql/output-operations.js';
import type { ExtractedDefinitions } from './gql/types.js';
import * as path from 'node:path';
import type { DependencyGraph } from './gql/dependency-graph.js';

type FilesMap = {
  gqlFiles: Array<string>;
  gqlTags: Array<string>;
};

export function generateDocumentFiles(
  schema: GraphQLSchema,
  documentPaths: Array<string>
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

  const files = handleGraphQLFiles(gqlFiles);
  const { tags, dependencyGraph } = handleGraphQLTags(schema, gqlTags);

  return {
    gqlFileDocuments: files,
    gqlTagDocuments: tags,
    dependencyGraph,
  };
}

function handleGraphQLFiles(
  documentPaths: Array<string>
): Array<Types.DocumentFile> {
  return documentPaths.map((path) => {
    const contents = readFileSync(path, 'utf-8');
    const parsed = parse(contents);
    return {
      location: path,
      document: parsed,
      rawSDL: contents,
    };
  });
}

function handleGraphQLTags(
  schema: GraphQLSchema,
  documentPaths: Array<string>
): {
  tags: Array<Types.DocumentFile>;
  dependencyGraph: DependencyGraph;
} {
  const extractedQueriesMap: Map<string, ExtractedDefinitions> = new Map();

  documentPaths.forEach((filePath) => {
    const extractedQueries = extractDefinitions(schema, filePath);
    if (extractedQueries.definitions.length > 0) {
      extractedQueriesMap.set(filePath, extractedQueries);
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
