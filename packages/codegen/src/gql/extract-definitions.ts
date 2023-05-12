import { traverse } from '@babel/core';
import { parse } from '@babel/parser';
import type { GraphQLSchema } from 'graphql';
import { readFileSync } from 'node:fs';
import { createExtractor } from './extractor.js';
import type { Definition } from './types.js';

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

  traverse(parsed, createExtractor(schema, fileName, definitions, 'graphql'));

  const exportedDefinitionMap = new Map<string, Definition>();
  for (const def of definitions) {
    if (def.exportName) {
      exportedDefinitionMap.set(def.exportName, def);
    }
  }

  return {
    definitions,
    exportedDefinitionMap,
  };
}
