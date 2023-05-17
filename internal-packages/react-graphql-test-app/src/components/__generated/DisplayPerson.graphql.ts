import type * as Types from '../../graphql/schema.graphql.js';

import type { PersonFieldsSharedFragment } from './DisplayOwner.graphql.js';
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
    pets: Array<{
      __typename: 'Pet';
      id: string;
      name: string;
      owner: { __typename: 'Person' } & PersonFieldsSharedFragment;
    }>;
  } & PersonFieldsSharedFragment;
};

export const PersonDocument = {
  __meta__: {
    queryId: '2e1f2c9ffa758bb540f9c7556214bc6a1c0b40a14f77d3f8b0f0170170e82c38',
    $DEBUG: {
      contents:
        'fragment CarFields on Car { __typename id make model } fragment PersonFieldsShared on Person { __typename id name } query Person($id: ID!) { person(id: $id) { __typename car { __typename ...CarFields } pets { __typename id name owner { __typename ...PersonFieldsShared } } ...PersonFieldsShared } }',
    },
  },
} as unknown as DocumentNode<PersonQuery, PersonQueryVariables>;
