import type * as Types from '../../graphql/schema.graphql.js';

import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
export type PetsForAdoptionQueryVariables = Types.Exact<{ [key: string]: never; }>;


export type PetsForAdoptionQuery = { __typename: 'Query', petsForAdoption: { __typename: 'PetsForAdoption', id: string, pets: Array<{ __typename: 'Pet', id: string, name: string, owner: { __typename: 'Person', id: string, name: string } }> } };


export const PetsForAdoptionDocument = {"__meta__":{"queryId":"c14630fad5e9dcdd6b37a7a7d1d836c1a7eea9950778e188d7705b1d119540ac"}} as unknown as DocumentNode<PetsForAdoptionQuery, PetsForAdoptionQueryVariables>;