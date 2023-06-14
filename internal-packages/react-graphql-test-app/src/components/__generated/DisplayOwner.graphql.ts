import type * as Types from '../../graphql/schema.graphql.js';

import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
export type PersonFieldsSharedFragment = {
  __typename: 'Person';
  id: string;
  name: string;
};

export const PersonFieldsSharedFragmentDoc = {
  kind: 'Document',
  definitions: [
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
} as unknown as DocumentNode<PersonFieldsSharedFragment, unknown>;
