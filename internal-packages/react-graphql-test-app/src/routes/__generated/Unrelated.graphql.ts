import type * as Types from '../../graphql/schema.graphql.js';

import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
export type CarQueryVariables = Types.Exact<{
  id: Types.Scalars['ID'];
}>;

export type CarQuery = {
  __typename: 'Query';
  car: {
    __typename: 'Car';
    id: string;
    make: string;
    model: string;
    owner: { __typename: 'Person'; id: string };
  };
};

export const CarDocument = {
  __meta__: {
    queryId: '5f155f5eb56ce6dc4fdd2732532a82421fa72dc1794a13edf6d51a4fd9474ee9',
    $DEBUG: {
      contents:
        'query Car($id: ID!) { car(id: $id) { __typename id make model owner { __typename id } } }',
    },
  },
} as unknown as DocumentNode<CarQuery, CarQueryVariables>;
