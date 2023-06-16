import { gql } from '@data-eden/codegen/gql';

import { type PetFieldsFragment as PetFieldsFragmentType } from './__generated/DisplayPets.graphql.js';
import { PersonFieldsSharedFragment } from '../components/DisplayOwner.js';

export const PetFieldsFragment = gql<PetFieldsFragmentType>`
  fragment PetFields on Pet {
    __typename
    id
    name
    owner {
        ${PersonFieldsSharedFragment}
    }
  }
`;
