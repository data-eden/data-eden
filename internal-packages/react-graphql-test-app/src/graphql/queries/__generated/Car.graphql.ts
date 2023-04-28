import type * as Types from '../../schema.graphql.js';

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
    queryId: '8f6f79e36cbc21beda49d817494f6c85e302231458c543d030d1e8af901c7f36',
    $DEBUG: {
      contents:
        'query Car($id: ID!) { car(id: $id) { __typename id make model owner { __typename id } } }',
    },
  },
} as unknown as DocumentNode<CarQuery, CarQueryVariables>;
