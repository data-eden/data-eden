import { athenaCodegen } from './codegen.js';
import { program } from 'commander';

interface Options {
  schemaPath: string;
  documents: Array<string>;
  production: boolean;
  baseDir: string;
  extension: string;
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
    .option(
      '--production',
      'optimize codegen outputs for production builds',
      process.env.NODE_ENV === 'prod'
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
    );

  program.parse();

  const options = program.opts<Options>();

  await athenaCodegen(options);
}
