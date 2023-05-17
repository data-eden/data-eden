import { traverse } from '@babel/core';
import { parse } from '@babel/parser';
import type { GraphQLSchema } from 'graphql';
import { readFileSync } from 'node:fs';
import { createExtractor } from './extractor.js';
import type { Definition, UnresolvedFragment } from './types.js';

export function extractDefinitions(schema: GraphQLSchema, fileName: string) {
  const document = readFileSync(fileName, 'utf-8');
  const parsed = parse(document, {
    sourceType: 'module',
    plugins: ['jsx', 'typescript'],
    sourceFilename: fileName,
  });

  if (!parsed) {
    throw new Error(
      '@data-eden/codegen: There was an issue parsing the schema file.'
    );
  }

  const definitions: Definition[] = [];

  traverse(parsed, createExtractor(schema, fileName, definitions));

  const exportedDefinitionMap = new Map<
    string,
    Definition | UnresolvedFragment
  >();
  for (const def of definitions) {
    if (def.exportName) {
      exportedDefinitionMap.set(def.exportName, def);
    }
    if (def.foreignReferences) {
      for (const foreignReference of def.foreignReferences.entries()) {
        if (
          foreignReference[1].exportName &&
          foreignReference[1].type &&
          foreignReference[1].type === 'unresolvedFragment'
        ) {
          // we are in a file that exports fragments, these are local and not external, but are accessible externally
          exportedDefinitionMap.set(foreignReference[1].exportName, {
            location: foreignReference[1].location,
            filePath: foreignReference[1].filePath,
            exportName: foreignReference[1].exportName,
            isExternal: false,
            type: 'unresolvedFragment',
          });
        }
      }
    }
  }

  return {
    definitions,
    exportedDefinitionMap,
  };
}
