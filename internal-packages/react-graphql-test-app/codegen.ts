import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  overwrite: true,
  schema: 'http://localhost:4000/graphql',
  documents: [
    'src/graphql/**/*.graphql',
    '!src/graphql/queries/BadQuery.graphql',
  ],
  generates: {
    'src/__generated__/': {
      preset: 'client',
      presetConfig: {
        fragmentMasking: false,
        persistedDocuments: true,
      },
    },
  },
};

export default config;
