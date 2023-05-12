import type * as Types from '../../graphql/schema.graphql.js';

import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
export type CreatePetMutationVariables = Types.Exact<{
  input: Types.CreatePetInput;
}>;

export type CreatePetMutation = {
  __typename: 'Mutation';
  createPet: {
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
  };
};

export const CreatePetDocument = {
  __meta__: {
    queryId: '88dc7e2b9e56893669f01ccda9e1059fc91154cfe6c39404da1e721ac5f97dab',
    $DEBUG: {
      contents:
        'mutation CreatePet($input: CreatePetInput!) { createPet(input: $input) { __typename id name owner { __typename id pets { __typename id name owner { __typename id name pets { __typename id name owner { __typename id name pets { __typename id name owner { __typename id name } } } } } } } } }',
    },
  },
} as unknown as DocumentNode<CreatePetMutation, CreatePetMutationVariables>;
