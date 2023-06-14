import type * as Types from '../../graphql/schema.graphql.js';

import type { PersonFieldsSharedFragment } from './DisplayOwner.graphql.js';
import type { PetFieldsFragment } from '../../aliased/__generated/DisplayPets.graphql.js';
import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
export type CarFieldsFragment = {
  __typename: 'Car';
  id: string;
  make: string;
  model: string;
};

export type PersonQueryVariables = Types.Exact<{
  id: Types.Scalars['ID'];
}>;

export type PersonQuery = {
  __typename: 'Query';
  person: {
    __typename: 'Person';
    car: { __typename: 'Car' } & CarFieldsFragment;
    pets: Array<{ __typename: 'Pet' } & PetFieldsFragment>;
  } & PersonFieldsSharedFragment;
};

export const PersonDocument = {
  __meta__: {
    queryId: 'efa5d31ebaaf11157f92bfdc5de340dc08adf683e486c492e82023e011cebab7',
    $DEBUG: {
      contents:
        'fragment CarFields on Car { __typename id make model } fragment PersonFieldsShared on Person { __typename id name } fragment PetFields on Pet { __typename id name owner { ...PersonFieldsShared } } query Person($id: ID!) { person(id: $id) { __typename car { __typename ...CarFields } pets { __typename ...PetFields } ...PersonFieldsShared } }',
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
                        name: { kind: 'Name', value: 'PersonFieldsShared' },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'car' },
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            {
                              kind: 'FragmentSpread',
                              name: { kind: 'Name', value: 'CarFields' },
                            },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: '__typename' },
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
                              kind: 'FragmentSpread',
                              name: { kind: 'Name', value: 'PetFields' },
                            },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: '__typename' },
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
            name: { kind: 'Name', value: 'PersonFieldsShared' },
            typeCondition: {
              kind: 'NamedType',
              name: { kind: 'Name', value: 'Person' },
            },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: '__typename' } },
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'name' } },
              ],
            },
          },
          {
            kind: 'FragmentDefinition',
            name: { kind: 'Name', value: 'CarFields' },
            typeCondition: {
              kind: 'NamedType',
              name: { kind: 'Name', value: 'Car' },
            },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: '__typename' } },
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'make' } },
                { kind: 'Field', name: { kind: 'Name', value: 'model' } },
              ],
            },
          },
          {
            kind: 'FragmentDefinition',
            name: { kind: 'Name', value: 'PetFields' },
            typeCondition: {
              kind: 'NamedType',
              name: { kind: 'Name', value: 'Pet' },
            },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: '__typename' } },
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'owner' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      {
                        kind: 'FragmentSpread',
                        name: { kind: 'Name', value: 'PersonFieldsShared' },
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
} as unknown as DocumentNode<PersonQuery, PersonQueryVariables>;
