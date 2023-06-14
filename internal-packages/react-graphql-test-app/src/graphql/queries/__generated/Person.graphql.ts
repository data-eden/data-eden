import type * as Types from '../../schema.graphql.js';

import type { PersonFieldsFragment } from '../../fragments/__generated/PersonFields.graphql.js';
import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
export type PersonQueryVariables = Types.Exact<{
  id: Types.Scalars['ID'];
}>;

export type PersonQuery = {
  __typename: 'Query';
  person: {
    __typename: 'Person';
    car: { __typename: 'Car'; id: string; make: string; model: string };
    pets: Array<{
      __typename: 'Pet';
      id: string;
      name: string;
      owner: { __typename: 'Person' } & PersonFieldsFragment;
    }>;
  } & PersonFieldsFragment;
};

export const PersonDocument = {
  __meta__: {
    queryId: '2b0fc416adc23e2c7cc9761a868714cb5662650a21e9fe14bfa358d98c68b82c',
    $DEBUG: {
      contents:
        'fragment PersonFields on Person { __typename id name } query Person($id: ID!) { person(id: $id) { __typename car { __typename id make model } pets { __typename id name owner { __typename ...PersonFields } } ...PersonFields } }',
      ast: {
        kind: 'Document',
        definitions: [
          {
            kind: 'OperationDefinition',
            operation: 'query',
            name: { kind: 'Name', value: 'Person' },
            variableDefinitions: [
              {
                kind: 'VariableDefinition',
                variable: {
                  kind: 'Variable',
                  name: { kind: 'Name', value: 'id' },
                },
                type: {
                  kind: 'NonNullType',
                  type: {
                    kind: 'NamedType',
                    name: { kind: 'Name', value: 'ID' },
                  },
                },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'person' },
                  arguments: [
                    {
                      kind: 'Argument',
                      name: { kind: 'Name', value: 'id' },
                      value: {
                        kind: 'Variable',
                        name: { kind: 'Name', value: 'id' },
                      },
                    },
                  ],
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      {
                        kind: 'FragmentSpread',
                        name: { kind: 'Name', value: 'PersonFields' },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'car' },
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'id' },
                            },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: '__typename' },
                            },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'make' },
                            },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'model' },
                            },
                          ],
                        },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'pets' },
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'id' },
                            },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: '__typename' },
                            },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'name' },
                            },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'owner' },
                              selectionSet: {
                                kind: 'SelectionSet',
                                selections: [
                                  {
                                    kind: 'FragmentSpread',
                                    name: {
                                      kind: 'Name',
                                      value: 'PersonFields',
                                    },
                                  },
                                  {
                                    kind: 'Field',
                                    name: { kind: 'Name', value: '__typename' },
                                  },
                                ],
                              },
                            },
                          ],
                        },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: '__typename' },
                      },
                    ],
                  },
                },
              ],
            },
          },
          {
            kind: 'FragmentDefinition',
            name: { kind: 'Name', value: 'PersonFields' },
            typeCondition: {
              kind: 'NamedType',
              name: { kind: 'Name', value: 'Person' },
            },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: '__typename' } },
                { kind: 'Field', name: { kind: 'Name', value: 'name' } },
              ],
            },
          },
        ],
      },
    },
  },
} as unknown as DocumentNode<PersonQuery, PersonQueryVariables>;
