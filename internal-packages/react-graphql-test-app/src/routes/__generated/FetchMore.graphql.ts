import type * as Types from '../../graphql/schema.graphql.js';

import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
export type PetsForAdoptionQueryVariables = Types.Exact<{
  [key: string]: never;
}>;

export type PetsForAdoptionQuery = {
  __typename: 'Query';
  petsForAdoption: Array<{
    __typename: 'Pet';
    id: string;
    name: string;
    owner: { __typename: 'Person'; id: string; name: string };
  }>;
};

export const PetsForAdoptionDocument = {
  __meta__: {
    queryId: '4cb4a35af8031dd99d81abbfcd1356bcf80d15e873447e14f113544b1a88953e',
  },
} as unknown as DocumentNode<
  PetsForAdoptionQuery,
  PetsForAdoptionQueryVariables
>;
