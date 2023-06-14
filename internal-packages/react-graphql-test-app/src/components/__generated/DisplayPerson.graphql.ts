import type * as Types from '../../graphql/schema.graphql.js';

import type { PersonFieldsSharedFragment } from './DisplayOwner.graphql.js';
import type { PetFieldsFragment } from '../../aliased/__generated/DisplayPets.graphql.js';
import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
export type CarFieldsFragment = { __typename: 'Car', id: string, make: string, model: string };

export type PersonQueryVariables = Types.Exact<{
  id: Types.Scalars['ID'];
}>;


export type PersonQuery = { __typename: 'Query', person: (
    { __typename: 'Person', car: (
      { __typename: 'Car' }
      & CarFieldsFragment
    ), pets: Array<(
      { __typename: 'Pet' }
      & PetFieldsFragment
    )> }
    & PersonFieldsSharedFragment
  ) };


export const PersonDocument = {"__meta__":{"queryId":"efa5d31ebaaf11157f92bfdc5de340dc08adf683e486c492e82023e011cebab7","$DEBUG":{"contents":"fragment CarFields on Car { __typename id make model } fragment PersonFieldsShared on Person { __typename id name } fragment PetFields on Pet { __typename id name owner { ...PersonFieldsShared } } query Person($id: ID!) { person(id: $id) { __typename car { __typename ...CarFields } pets { __typename ...PetFields } ...PersonFieldsShared } }"}}} as unknown as DocumentNode<PersonQuery, PersonQueryVariables>;