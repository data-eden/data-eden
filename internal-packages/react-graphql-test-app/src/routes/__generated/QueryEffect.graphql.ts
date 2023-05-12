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
    queryId: 'b1ac0b3da3bd7a65ff4f77e264b7489d5e90fc148936ec9e574e4175c48eb33a',
    $DEBUG: {
      contents:
        'query Car($id: ID!) { car(id: $id) { __typename id make model owner { __typename id } } }',
    },
  },
} as unknown as DocumentNode<CarQuery, CarQueryVariables>;
