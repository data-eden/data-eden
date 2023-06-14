import type * as Types from '../../schema.graphql.js';

import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
export type UpdatePetMutationVariables = Types.Exact<{
  petId: Types.Scalars['ID'];
  input: Types.UpdatePetInput;
}>;

export type UpdatePetMutation = {
  __typename: 'Mutation';
  updatePet: { __typename: 'Pet'; id: string; name: string };
};

export const UpdatePetDocument = {
  __meta__: {
    queryId: 'af5c6749a82a0b93e9bce39adf9627e4fb5fd249da1010f72650417b155a5f65',
    $DEBUG: {
      contents:
        'mutation UpdatePet($input: UpdatePetInput!, $petId: ID!) { updatePet(petId: $petId, input: $input) { __typename id name } }',
      ast: {
        kind: 'Document',
        definitions: [
          {
            kind: 'OperationDefinition',
            operation: 'mutation',
            name: { kind: 'Name', value: 'UpdatePet' },
            variableDefinitions: [
              {
                kind: 'VariableDefinition',
                variable: {
                  kind: 'Variable',
                  name: { kind: 'Name', value: 'petId' },
                },
                type: {
                  kind: 'NonNullType',
                  type: {
                    kind: 'NamedType',
                    name: { kind: 'Name', value: 'ID' },
                  },
                },
              },
              {
                kind: 'VariableDefinition',
                variable: {
                  kind: 'Variable',
                  name: { kind: 'Name', value: 'input' },
                },
                type: {
                  kind: 'NonNullType',
                  type: {
                    kind: 'NamedType',
                    name: { kind: 'Name', value: 'UpdatePetInput' },
                  },
                },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'updatePet' },
                  arguments: [
                    {
                      kind: 'Argument',
                      name: { kind: 'Name', value: 'petId' },
                      value: {
                        kind: 'Variable',
                        name: { kind: 'Name', value: 'petId' },
                      },
                    },
                    {
                      kind: 'Argument',
                      name: { kind: 'Name', value: 'input' },
                      value: {
                        kind: 'Variable',
                        name: { kind: 'Name', value: 'input' },
                      },
                    },
                  ],
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: '__typename' },
                      },
                      { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  },
} as unknown as DocumentNode<UpdatePetMutation, UpdatePetMutationVariables>;
