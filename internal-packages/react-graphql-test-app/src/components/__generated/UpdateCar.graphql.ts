import type * as Types from '../../graphql/schema.graphql.js';

import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
export type UpdateCarMutationVariables = Types.Exact<{
  carId: Types.Scalars['ID'];
  input: Types.CarInput;
}>;

export type UpdateCarMutation = {
  __typename: 'Mutation';
  updateCar: { __typename: 'Car'; id: string; make: string; model: string };
};

export const UpdateCarDocument = {
  __meta__: {
    queryId: '38a98bbd5e7b6463f8dda2de92b3b99c531ca7d53af036685dbc366e12ffc6da',
    $DEBUG: {
      contents:
        'mutation UpdateCar($carId: ID!, $input: CarInput!) { updateCar(carId: $carId, input: $input) { __typename id make model } }',
      ast: {
        kind: 'Document',
        definitions: [
          {
            kind: 'OperationDefinition',
            operation: 'mutation',
            name: { kind: 'Name', value: 'UpdateCar' },
            variableDefinitions: [
              {
                kind: 'VariableDefinition',
                variable: {
                  kind: 'Variable',
                  name: { kind: 'Name', value: 'carId' },
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
                    name: { kind: 'Name', value: 'CarInput' },
                  },
                },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'updateCar' },
                  arguments: [
                    {
                      kind: 'Argument',
                      name: { kind: 'Name', value: 'carId' },
                      value: {
                        kind: 'Variable',
                        name: { kind: 'Name', value: 'carId' },
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
                      { kind: 'Field', name: { kind: 'Name', value: 'make' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'model' } },
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
} as unknown as DocumentNode<UpdateCarMutation, UpdateCarMutationVariables>;
