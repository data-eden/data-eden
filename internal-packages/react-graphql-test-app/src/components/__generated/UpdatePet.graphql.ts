import type * as Types from '../../graphql/schema.graphql.js';

import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
export type UpdatePetMutationVariables = Types.Exact<{
  petId: Types.Scalars['ID'];
  input: Types.UpdatePetInput;
}>;


export type UpdatePetMutation = { __typename: 'Mutation', updatePet: { __typename: 'Pet', id: string, name: string } };


export const UpdatePetDocument = {"__meta__":{"queryId":"af5c6749a82a0b93e9bce39adf9627e4fb5fd249da1010f72650417b155a5f65"}} as unknown as DocumentNode<UpdatePetMutation, UpdatePetMutationVariables>;