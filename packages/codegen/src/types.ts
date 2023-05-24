import type { DocumentNode, GraphQLSchema } from 'graphql';

export interface Source {
  document?: DocumentNode;
  schema?: GraphQLSchema;
  rawSDL?: string;
  location?: string;
}

interface ResolveOptions {
  basedir: string;
}

export type Resolver = (
  importPath: string,
  options: ResolveOptions
) => string | undefined;

export type PrimaryKeyAlias = {
  primaryKey: string;
  fields: {
    [key: string]: string;
  };
};

export type CodegenConfig = {
  schemaPath: string;
  documents: Array<string>;
  baseDir: string;
  extension: string;
  disableSchemaTypesGeneration: boolean;
  debug?: boolean;
  production: boolean;
  hash?: (document: DocumentNode) => string;
  resolver?: Resolver;
  primaryKeyAlias?: PrimaryKeyAlias;
};

export type OutputFile = {
  location: string;
  contents: string;
};
