import type * as Types from '../../schema.graphql.js';

import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
export type UpdatePersonMutationVariables = Types.Exact<{
  personId: Types.Scalars['ID'];
  input: Types.PersonInput;
}>;

export type UpdatePersonMutation = {
  __typename: 'Mutation';
  updatePerson: { __typename: 'Person'; id: string; name: string };
};

export const UpdatePersonDocument = {
  __meta__: {
    queryId: '1eb1de91b9d83bd2e44c39aa32ebc7fa50cf65176be52f403c5abef75f6defef',
    $DEBUG: {
      contents:
        'mutation UpdatePerson($input: PersonInput!, $personId: ID!) { updatePerson(personId: $personId, input: $input) { __typename id name } }',
      ast: {
        kind: 'Document',
        definitions: [
          {
            kind: 'OperationDefinition',
            operation: 'mutation',
            name: { kind: 'Name', value: 'UpdatePerson' },
            variableDefinitions: [
              {
                kind: 'VariableDefinition',
                variable: {
                  kind: 'Variable',
                  name: { kind: 'Name', value: 'personId' },
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
                    name: { kind: 'Name', value: 'PersonInput' },
                  },
                },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'updatePerson' },
                  arguments: [
                    {
                      kind: 'Argument',
                      name: { kind: 'Name', value: 'personId' },
                      value: {
                        kind: 'Variable',
                        name: { kind: 'Name', value: 'personId' },
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
} as unknown as DocumentNode<
  UpdatePersonMutation,
  UpdatePersonMutationVariables
>;
