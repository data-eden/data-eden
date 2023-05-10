import { codegen } from '@graphql-codegen/core';
import { preset } from '@graphql-codegen/near-operation-file-preset';
import * as typedDocumentNodePlugin from '@graphql-codegen/typed-document-node';
import * as typescriptOperationsPlugin from '@graphql-codegen/typescript-operations';
import { printExecutableGraphQLDocument } from '@graphql-tools/documents';
import { readFile, writeFile } from 'fs/promises';
import { globby } from 'globby';
import type { DocumentNode } from 'graphql';
import { parse } from 'graphql';
import * as path from 'node:path';
import { defaultHash } from './default-hash.js';
import { generateDocumentFiles } from './generate-document-files.js';
import { generateSchemaTypes } from './generate-schema-types.js';
import type { CodegenArgs, OutputFile } from './types.js';
import { changeExtension } from './utils.js';

export async function athenaCodegen({
  schemaPath: schemaFile,
  documents,
  baseDir,
  extension,
  hash,
  production,
}: CodegenArgs): Promise<void> {
  const outputFiles: Array<OutputFile> = [];
  const persistedQueries: Record<string, string> = {};
  const schemaPath = path.join(baseDir, schemaFile);
  // Read schema
  const rawSchema = await readFile(schemaPath, 'utf-8');
  const parsedSchema = parse(rawSchema);
  const hashFn = hash || defaultHash;

  // Generate schema types and write to root schema file
  const schemaTypesOutputPath = changeExtension(schemaPath, extension);
  const schemaTypes = await generateSchemaTypes(
    parsedSchema,
    schemaTypesOutputPath
  );

  outputFiles.push(schemaTypes);

  // Expand glob patterns and find matching files
  const paths = await globby([...documents, `!${schemaPath}`]);

  // Create DocumentFile objects for use in the preset builder
  const documentFiles = await generateDocumentFiles(paths);

  function onExecutableDocumentNode(documentNode: DocumentNode) {
    const materializedDocumentString =
      printExecutableGraphQLDocument(documentNode);

    const queryId = hashFn(documentNode);

    persistedQueries[queryId] = materializedDocumentString;

    if (production) {
      return {
        queryId,
      };
    } else {
      return { queryId, $DEBUG: { contents: materializedDocumentString } };
    }
  }

  const configs = await preset.buildGeneratesSection({
    baseOutputDir: baseDir,
    config: {
      useTypeImports: true,
    },
    presetConfig: {
      baseTypesPath: path.relative(baseDir, schemaTypesOutputPath),
      extension,
    },
    schema: parsedSchema,
    documents: documentFiles,
    pluginMap: {
      typescriptOperations: typescriptOperationsPlugin,
      typedDocumentNode: typedDocumentNodePlugin,
    },
    plugins: [
      {
        typescriptOperations: {
          nonOptionalTypename: true,
          useTypeImports: true,
          inlineFragmentTypes: 'combine',
        },
      },
      {
        typedDocumentNode: {
          addTypenameToSelectionSets: true,
          unstable_omitDefinitions: true,
          unstable_onExecutableDocumentNode: onExecutableDocumentNode,
        },
      },
    ],
  });

  // Generate types for each document + import statements for Schema types
  const documentTypes = await Promise.all(
    configs.map(async (config) => {
      const [document] = config.documents;
      if (!document) {
        throw new Error(
          `@data-eden/codegen: No document found for ${config.filename}`
        );
      }
      const sdl = document.rawSDL;

      if (!sdl) {
        throw new Error(
          `@data-eden/codgen: No raw SDL found for ${config.filename}`
        );
      }

      return {
        location: config.filename,
        contents: await codegen(config),
      };
    })
  );

  outputFiles.push(...documentTypes, {
    location: path.resolve(baseDir, 'query-identifiers.json'),
    contents: JSON.stringify(persistedQueries, null, 2),
  });

  await Promise.all(
    outputFiles.map((file) => {
      return writeFile(file.location, file.contents);
    })
  );
}
