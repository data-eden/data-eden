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
    queryId: '4eb0d9d1a2901538f228ca5652d69bf63c60f0864fdc0450e3c1f5d30968bf10',
  },
} as unknown as DocumentNode<PersonQuery, PersonQueryVariables>;
