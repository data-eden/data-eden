import type * as Types from '../../graphql/schema.graphql.js';

import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
export type RemovePetMutationVariables = Types.Exact<{
  id: Types.Scalars['ID'];
}>;

export type RemovePetMutation = {
  __typename: 'Mutation';
  removePet: Array<{
    __typename: 'Pet';
    id: string;
    name: string;
    owner: {
      __typename: 'Person';
      id: string;
      pets: Array<{
        __typename: 'Pet';
        id: string;
        name: string;
        owner: {
          __typename: 'Person';
          id: string;
          name: string;
          pets: Array<{
            __typename: 'Pet';
            id: string;
            name: string;
            owner: { __typename: 'Person'; id: string; name: string };
          }>;
        };
      }>;
    };
  }>;
};

export const RemovePetDocument = {
  __meta__: {
    queryId: '402b683c9e489fa1c769d7cd5815b644acdfb36179d8a9cfa7055e0f128698dd',
    $DEBUG: {
      contents:
        'mutation RemovePet($id: ID!) { removePet(id: $id) { __typename id name owner { __typename id pets { __typename id name owner { __typename id name pets { __typename id name owner { __typename id name } } } } } } }',
    },
  },
} as unknown as DocumentNode<RemovePetMutation, RemovePetMutationVariables>;
