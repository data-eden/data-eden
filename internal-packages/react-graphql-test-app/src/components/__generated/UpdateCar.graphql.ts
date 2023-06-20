import type * as Types from '../../graphql/schema.graphql.js';

import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
export type UpdateCarMutationVariables = Types.Exact<{
  carId: Types.Scalars['ID'];
  input: Types.CarInput;
}>;


export type UpdateCarMutation = { __typename: 'Mutation', updateCar: { __typename: 'Car', id: string, make: string, model: string } };


export const UpdateCarDocument = {"__meta__":{"queryId":"38a98bbd5e7b6463f8dda2de92b3b99c531ca7d53af036685dbc366e12ffc6da"}} as unknown as DocumentNode<UpdateCarMutation, UpdateCarMutationVariables>;