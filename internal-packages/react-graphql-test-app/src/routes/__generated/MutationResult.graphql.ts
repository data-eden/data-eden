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
    queryId: 'd3e6d41ef1b45d4ebe7c412d84e569b2ea8af1df6676bf86af0e2504fb0e46ab',
    $DEBUG: {
      contents:
        'mutation CreatePet($input: CreatePetInput!) { createPet(input: $input) { __typename id name owner { __typename id pets { __typename id name owner { __typename id name pets { __typename id name owner { __typename id name pets { __typename id name owner { __typename id name } } } } } } } } }',
      ast: {
        kind: 'Document',
        definitions: [
          {
            kind: 'OperationDefinition',
            operation: 'mutation',
            name: { kind: 'Name', value: 'CreatePet' },
            variableDefinitions: [
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
                    name: { kind: 'Name', value: 'CreatePetInput' },
                  },
                },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'createPet' },
                  arguments: [
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
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'owner' },
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
                                          kind: 'Field',
                                          name: { kind: 'Name', value: 'id' },
                                        },
                                        {
                                          kind: 'Field',
                                          name: {
                                            kind: 'Name',
                                            value: '__typename',
                                          },
                                        },
                                        {
                                          kind: 'Field',
                                          name: { kind: 'Name', value: 'name' },
                                        },
                                        {
                                          kind: 'Field',
                                          name: { kind: 'Name', value: 'pets' },
                                          selectionSet: {
                                            kind: 'SelectionSet',
                                            selections: [
                                              {
                                                kind: 'Field',
                                                name: {
                                                  kind: 'Name',
                                                  value: 'id',
                                                },
                                              },
                                              {
                                                kind: 'Field',
                                                name: {
                                                  kind: 'Name',
                                                  value: '__typename',
                                                },
                                              },
                                              {
                                                kind: 'Field',
                                                name: {
                                                  kind: 'Name',
                                                  value: 'name',
                                                },
                                              },
                                              {
                                                kind: 'Field',
                                                name: {
                                                  kind: 'Name',
                                                  value: 'owner',
                                                },
                                                selectionSet: {
                                                  kind: 'SelectionSet',
                                                  selections: [
                                                    {
                                                      kind: 'Field',
                                                      name: {
                                                        kind: 'Name',
                                                        value: 'id',
                                                      },
                                                    },
                                                    {
                                                      kind: 'Field',
                                                      name: {
                                                        kind: 'Name',
                                                        value: '__typename',
                                                      },
                                                    },
                                                    {
                                                      kind: 'Field',
                                                      name: {
                                                        kind: 'Name',
                                                        value: 'name',
                                                      },
                                                    },
                                                    {
                                                      kind: 'Field',
                                                      name: {
                                                        kind: 'Name',
                                                        value: 'pets',
                                                      },
                                                      selectionSet: {
                                                        kind: 'SelectionSet',
                                                        selections: [
                                                          {
                                                            kind: 'Field',
                                                            name: {
                                                              kind: 'Name',
                                                              value: 'id',
                                                            },
                                                          },
                                                          {
                                                            kind: 'Field',
                                                            name: {
                                                              kind: 'Name',
                                                              value:
                                                                '__typename',
                                                            },
                                                          },
                                                          {
                                                            kind: 'Field',
                                                            name: {
                                                              kind: 'Name',
                                                              value: 'name',
                                                            },
                                                          },
                                                          {
                                                            kind: 'Field',
                                                            name: {
                                                              kind: 'Name',
                                                              value: 'owner',
                                                            },
                                                            selectionSet: {
                                                              kind: 'SelectionSet',
                                                              selections: [
                                                                {
                                                                  kind: 'Field',
                                                                  name: {
                                                                    kind: 'Name',
                                                                    value: 'id',
                                                                  },
                                                                },
                                                                {
                                                                  kind: 'Field',
                                                                  name: {
                                                                    kind: 'Name',
                                                                    value:
                                                                      '__typename',
                                                                  },
                                                                },
                                                                {
                                                                  kind: 'Field',
                                                                  name: {
                                                                    kind: 'Name',
                                                                    value:
                                                                      'name',
                                                                  },
                                                                },
                                                              ],
                                                            },
                                                          },
                                                        ],
                                                      },
                                                    },
                                                  ],
                                                },
                                              },
                                            ],
                                          },
                                        },
                                      ],
                                    },
                                  },
                                ],
                              },
                            },
                          ],
                        },
                      },
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
} as unknown as DocumentNode<CreatePetMutation, CreatePetMutationVariables>;
