import { codegen } from '@graphql-codegen/core';
import { preset } from '@graphql-codegen/near-operation-file-preset';
import type { Types } from '@graphql-codegen/plugin-helpers';
import * as typedDocumentNodePlugin from '@graphql-codegen/typed-document-node';
import * as typescriptOperationsPlugin from '@graphql-codegen/typescript-operations';
import { printExecutableGraphQLDocument } from '@graphql-tools/documents';
import fs from 'fs-extra';
import { readFile } from 'fs/promises';
import { globby } from 'globby';
import type { DocumentNode } from 'graphql';
import { buildSchema, parse } from 'graphql';
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
  const graphqlSchema = buildSchema(rawSchema);
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
  const documentFiles = generateDocumentFiles(graphqlSchema, paths);

  function onExecutableDocumentNode(documentNode: DocumentNode) {
    const materializedDocumentString =
      printExecutableGraphQLDocument(documentNode);

    const queryId = hashFn(documentNode);

    persistedQueries[queryId] = materializedDocumentString.replaceAll(
      /_\d+/g,
      ''
    );

    if (production) {
      return {
        queryId,
      };
    } else {
      return { queryId, $DEBUG: { contents: materializedDocumentString } };
    }
  }

  const configs: Array<Types.GenerateOptions> =
    await preset.buildGeneratesSection({
      baseOutputDir: baseDir,
      config: {
        useTypeImports: true,
      },
      presetConfig: {
        baseTypesPath: path.relative(baseDir, schemaTypesOutputPath),
        folder: '__generated',
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

      const contents = await codegen(config);

      return {
        location: config.filename,
        // Remove the weird deduping suffixes that codegen tries to apply
        contents: contents.replaceAll(/_\d+/g, ''),
      };
    })
  );

  outputFiles.push(...documentTypes, {
    location: path.resolve(baseDir, 'query-identifiers.json'),
    contents: JSON.stringify(persistedQueries, null, 2),
  });

  await Promise.all(
    outputFiles.map(async (file) => {
      await fs.ensureDir(path.dirname(file.location));
      return fs.writeFile(file.location, file.contents);
    })
  );
}
