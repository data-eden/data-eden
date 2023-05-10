import { codegen } from '@graphql-codegen/core';
import type { Types } from '@graphql-codegen/plugin-helpers';
import * as typescriptPlugin from '@graphql-codegen/typescript';
import type { DocumentNode } from 'graphql';
import type { OutputFile } from './types.js';

export async function generateSchemaTypes(
  schema: DocumentNode,
  outputPath: string
): Promise<OutputFile> {
  const schemaTypes = {
    location: outputPath,
    contents: await codegen({
      documents: [],
      config: {},
      // used by a plugin internally, although the 'typescript' plugin currently
      // returns the string output, rather than writing to a file
      filename: '__WILL_NOT_BE_USED__',
      schema: schema,
      plugins: [
        {
          typescript: {
            onlyOperationTypes: true,
          },
        },
      ] as Array<Types.ConfiguredPlugin>,
      pluginMap: {
        typescript: typescriptPlugin,
      },
    }),
  };

  return schemaTypes;
}
