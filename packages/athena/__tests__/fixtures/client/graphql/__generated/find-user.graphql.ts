import type * as Types from '../../schema.graphql.js';

import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
export type FindUserQueryVariables = Types.Exact<{
  userId: Types.Scalars['ID'];
}>;


export type FindUserQuery = { __typename: 'Query', user?: { __typename: 'User', username: string, email: string } | null };


export const FindUserDocument = {"__meta__":{"queryId":"d8663e9c9c0dac658e3e1b750ed8916fa03e7c9956a1adf99337597689b7f501","$DEBUG":{"contents":"query findUser($userId: ID!) { user(id: $userId) { __typename email username } }"}}} as unknown as DocumentNode<FindUserQuery, FindUserQueryVariables>;