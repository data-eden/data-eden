import { loadConfig } from '@data-eden/config';
import { program } from 'commander';
import { resolve } from 'path';

import { athenaCodegen } from './codegen.js';
import type { CodegenConfig} from './types.js';
import { type Resolver } from './types.js';

interface Options {
  projectRoot: string;
  schemaPath: string;
  documents: Array<string>;
  debug: boolean;
  disableSchemaTypesGeneration: boolean;
  production: boolean;
  baseDir: string;
  extension: string;
  resolver: Promise<Resolver>;
}

interface ModuleWithDefault {
  default: Resolver;
}

function isResolverModule(o: any): o is Promise<ModuleWithDefault> {
  return typeof o === 'object';
}

export async function binMain(process: NodeJS.Process) {
  program.name('athena-codegen').description('codegen for @data-eden/athena');

  program
    .option('--schema-path <schemaPath>', 'path to your schema file')
    .option(
      '--documents <patterns...>',
      'one or more glob patterns that match the documents you want to process'
    )
    .option('--debug', 'output additional debugging information', false)
    .option(
      '--project-root <projectRoot>',
      'root directory where all other paths originate',
      process.cwd()
    )
    .option(
      '--production',
      'optimize codegen outputs for production builds',
      process.env.NODE_ENV === 'prod'
    )
    .option(
      '--disable-schema-types-generation',
      'skip generating schema types',
      false
    )
    .option(
      '--base-dir <baseDir>',
      'directory where codegen should begin searching for documents'
    )
    .option(
      '--extension <extension>',
      'extension for newly generated files',
      '.graphql.ts'
    )
    .option(
      '--resolver <resolverImportPath>',
      'path to resolver script',
      async (resolverImportPath) => {
        const resolverPath = resolve(process.cwd(), resolverImportPath);

        return import(resolverPath);
      }
    );

  program.parse(process.argv);

  // we prioritize options based on (args -> config -> defaults)
  const options = program.opts<Options>();

  const loadedConfig = await loadConfig(options.projectRoot);

  let resolverFromArgs = isResolverModule(options.resolver)
    ? (await options.resolver).default
    : undefined;

  // TODO: we need to check the values before we passed to codegen for required fields to actually exist
  let optionsMerged: CodegenConfig = Object.assign(
    loadedConfig?.codegen || {},
    Object.assign(options, {
      resolver: resolverFromArgs || loadedConfig?.codegen?.resolver,
    })
  );

  if (!optionsMerged.baseDir) {
    optionsMerged.baseDir = process.cwd();
  }

  await athenaCodegen(optionsMerged);
}
