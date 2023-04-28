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
    queryId: 'c716249d6e62dfe347cd1dbcba70fa7289eafaa59b1a88beda2d705d8ba73f3d',
    $DEBUG: {
      contents:
        'mutation CreatePet($input: CreatePetInput!) { createPet(input: $input) { __typename id name owner { __typename id pets { __typename id name owner { __typename id name pets { __typename id name owner { __typename id name pets { __typename id name owner { __typename id name } } } } } } } } }',
    },
  },
} as unknown as DocumentNode<CreatePetMutation, CreatePetMutationVariables>;
