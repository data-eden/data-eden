import type * as Types from '../../graphql/schema.graphql.js';

import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
export type UpdatePersonMutationVariables = Types.Exact<{
  personId: Types.Scalars['ID'];
  input: Types.PersonInput;
}>;


export type UpdatePersonMutation = { __typename: 'Mutation', updatePerson: { __typename: 'Person', id: string, name: string } };


export const UpdatePersonDocument = {"__meta__":{"queryId":"1eb1de91b9d83bd2e44c39aa32ebc7fa50cf65176be52f403c5abef75f6defef","$DEBUG":{"contents":"mutation UpdatePerson($input: PersonInput!, $personId: ID!) { updatePerson(personId: $personId, input: $input) { __typename id name } }"}}} as unknown as DocumentNode<UpdatePersonMutation, UpdatePersonMutationVariables>;