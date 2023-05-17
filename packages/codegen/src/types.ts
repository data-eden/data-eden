import type { DocumentNode, GraphQLSchema } from 'graphql';

export interface Source {
  document?: DocumentNode;
  schema?: GraphQLSchema;
  rawSDL?: string;
  location?: string;
}

export interface CodegenArgs {
  schemaPath: string;
  documents: Array<string>;
  baseDir: string;
  extension: string;
  disableSchemaTypesGeneration: boolean;
  debug?: boolean;
  production: boolean;
  hash?: (document: DocumentNode) => string;
}

export type OutputFile = {
  location: string;
  contents: string;
};
