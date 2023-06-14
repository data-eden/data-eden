import type * as Types from '../../graphql/schema.graphql.js';

import type { PersonFieldsSharedFragment } from '../../components/__generated/DisplayOwner.graphql.js';
import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
export type PetFieldsFragment = {
  __typename: 'Pet';
  id: string;
  name: string;
  owner: { __typename: 'Person' } & PersonFieldsSharedFragment;
};

export const PetFieldsFragmentDoc = {
  kind: 'Document',
  definitions: [
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
  ],
} as unknown as DocumentNode<PetFieldsFragment, unknown>;
