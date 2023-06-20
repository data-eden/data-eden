import type * as Types from '../../graphql/schema.graphql.js';

import type { PersonFieldsSharedFragment } from '../../components/__generated/DisplayOwner.graphql.js';
import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
export type PetFieldsFragment = { __typename: 'Pet', id: string, name: string, owner: (
    { __typename: 'Person' }
    & PersonFieldsSharedFragment
  ) };
