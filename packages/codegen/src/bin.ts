import { athenaCodegen } from './codegen.js';
import { program } from 'commander';
import { resolve } from 'path';

import { type Resolver } from './types.js';

interface Options {
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

export async function binMain() {
  program.name('athena-codegen').description('codegen for @data-eden/athena');

  program
    .requiredOption('--schema-path <schemaPath>', 'path to your schema file')
    .requiredOption(
      '--documents <patterns...>',
      'one or more glob patterns that match the documents you want to process',
      ','
    )
    .option('--debug', 'output additional debugging information', false)
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
      'directory where codegen should begin searching for documents',
      process.cwd()
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

  program.parse();

  const options = program.opts<Options>();

  let resolver = isResolverModule(options.resolver)
    ? (await options.resolver).default
    : undefined;

  await athenaCodegen({
    ...options,
    resolver,
  });
}
