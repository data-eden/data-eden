import { gql } from '@data-eden/codegen/gql';

import { type PersonFieldsSharedFragment as PersonFieldsFragmentType } from './__generated/DisplayOwner.graphql.js';

export const PersonFieldsFragment = gql<PersonFieldsFragmentType>`
  fragment PersonFieldsShared on Person {
    __typename
    id
    name
  }
`;
