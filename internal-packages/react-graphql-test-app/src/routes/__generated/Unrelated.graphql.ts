import type * as Types from '../../graphql/schema.graphql.js';

import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
export type CarQueryVariables = Types.Exact<{
  id: Types.Scalars['ID'];
}>;


export type CarQuery = { __typename: 'Query', car: { __typename: 'Car', id: string, make: string, model: string, owner: { __typename: 'Person', id: string } | { __typename: 'Company' } } };


export const CarDocument = {"__meta__":{"queryId":"fb1de7b0677530702610754ef9906528b8f6d42dfc76d34f9acfd51850c4c52e"}} as unknown as DocumentNode<CarQuery, CarQueryVariables>;