import { codegen } from '@graphql-codegen/core';
import { preset } from '@graphql-codegen/near-operation-file-preset';
import type { Types } from '@graphql-codegen/plugin-helpers';
import * as typedDocumentNodePlugin from '@graphql-codegen/typed-document-node';
import * as typescriptOperationsPlugin from '@graphql-codegen/typescript-operations';
import { printExecutableGraphQLDocument } from '@graphql-tools/documents';
import fs from 'fs-extra';
import { hrtime } from 'node:process';
import { readFile } from 'fs/promises';
import { globby } from 'globby';
import type { DocumentNode, FragmentDefinitionNode } from 'graphql';
import { buildSchema, parse } from 'graphql';
import * as path from 'node:path';
import { defaultHash } from './default-hash.js';
import { generateDocumentFiles } from './generate-document-files.js';
import { generateSchemaTypes } from './generate-schema-types.js';
import type { CodegenConfig, OutputFile, Resolver } from './types.js';
import { changeExtension, extensionAwareResolver } from './utils.js';
import { enable as enableDebugging } from './debug.js';

// TODO: replace with https://github.com/dotansimha/graphql-code-generator/blob/86ec182887698742af8e9f47ffe39f07772e54a4/packages/plugins/other/visitor-plugin-common/src/types.ts#L84
type LoadedFragments = {
  name: string;
  onType: string;
  node: FragmentDefinitionNode;
  isExternal: boolean;
  importFrom?: string | null;
};

export async function athenaCodegen({
  schemaPath: schemaFile,
  documents,
  baseDir,
  extension,
  hash,
  debug,
  disableSchemaTypesGeneration,
  production,
  resolver,
  primaryKeyAlias,
}: CodegenConfig): Promise<void> {
  const startTime = hrtime.bigint();

  if (debug === true) {
    enableDebugging();
  }

  const outputFiles: Array<OutputFile> = [];
  const persistedQueries: Record<string, string> = {};
  const schemaPath = path.join(baseDir, schemaFile);
  // Read schema
  const rawSchema = await readFile(schemaPath, 'utf-8');
  const parsedSchema = parse(rawSchema);
  const graphqlSchema = buildSchema(rawSchema);
  const hashFn = hash || defaultHash;

  // User can disable schema type generation (e.g. for cases where they have
  // already compiled their schema types)
  const schemaTypesOutputPath = changeExtension(schemaPath, extension);
  if (!disableSchemaTypesGeneration) {
    // Generate schema types and write to root schema file
    const schemaTypes = await generateSchemaTypes(
      parsedSchema,
      schemaTypesOutputPath
    );

    outputFiles.push(schemaTypes);
  }

  // Expand glob patterns and find matching files
  const paths = await globby([...documents, `!${schemaPath}`], {
    absolute: true,
  });

  // we want to wrap any resolver we are passed with an extension aware resolver
  const defaultResolver: Resolver = (importPath, options) => {
    const extensions = ['.tsx', '.jsx', '.js', '.ts'];
    const potentiallyResolvedValueFromResolver = resolver
      ? resolver(importPath, options)
      : undefined;
    return potentiallyResolvedValueFromResolver
      ? extensionAwareResolver(potentiallyResolvedValueFromResolver, extensions)
      : extensionAwareResolver(
          path.resolve(options.basedir, importPath),
          extensions
        );
  };

  // Create DocumentFile objects for use in the preset builder
  const { gqlTagDocuments, gqlFileDocuments, dependencyGraph } =
    generateDocumentFiles(
      graphqlSchema,
      paths,
      primaryKeyAlias ?? null,
      defaultResolver
    );

  const exportedGqlTagFragments: LoadedFragments[] = Array.from(
    dependencyGraph.fragments.values()
  ).map((fragment) => {
    return {
      name: fragment.ast.name.value,
      isExternal: true,
      importFrom: fragment.filePath,
      node: fragment.ast,
      onType: fragment.ast.typeCondition.name.value,
    };
  });

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

  const configs: Array<Types.GenerateOptions> = [
    ...(await preset.buildGeneratesSection({
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
      documents: gqlFileDocuments,
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
    })),
    ...(await preset.buildGeneratesSection({
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
      documents: gqlTagDocuments,
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
            // Tell typedDocumentNode that all fragments are external to
            // prevent it from generating ASTs for fragments
            //
            // We'll still get the fragment types by way of
            // typescriptOperations
            externalFragments: exportedGqlTagFragments,
            addTypenameToSelectionSets: true,
            unstable_omitDefinitions: true,
            unstable_onExecutableDocumentNode: onExecutableDocumentNode,
          },
        },
      ],
    })),
  ];

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

  const endTime = hrtime.bigint();
  const totalTime = Number(endTime - startTime);
  const timeInSeconds = totalTime / 1000000000;
  console.log(
    `Successfully generated ${outputFiles.length} files in ${timeInSeconds} seconds.`
  );
}
