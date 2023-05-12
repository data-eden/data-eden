import { transformFileAsync } from '@babel/core';
import { babelPlugin } from '../src/babel-plugin.js';
import type { Project } from 'fixturify-project';
import { describe, expect, test } from 'vitest';
import { createFixtures, gqlFilesMap } from './utils/project.js';
import * as path from 'node:path';

describe('babel plugin', () => {
  let project: Project;

  test('it works', async () => {
    project = await createFixtures({
      ...gqlFilesMap,
      'user.graphql.ts': `import type * as Types from './schema.graphql.js';

import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
export type UserFieldsFragment = { __typename: 'User', id: string, username: string, role: Types.Role };

export type FindUserQueryVariables = Types.Exact<{
  userId: Types.Scalars['ID'];
}>;


export type FindUserQuery = { __typename: 'Query', user?: (
    { __typename: 'User' }
    & UserFieldsFragment
  ) | null };

export const UserFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"UserFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"role"}}]}}]} as unknown as DocumentNode<UserFieldsFragment, unknown>;
export const FindUserDocument = {"__meta__":{"queryId":"d17490e4b9ac1f7c227df3da6e5c5cdc6686b24d7194c0cb1bc29a8189a58f5c","$DEBUG":{"contents":"fragment UserFields on User { id role username } query findUser($userId: ID!) { user(id: $userId) { __typename ...UserFields } }"}}} as unknown as DocumentNode<FindUserQuery, FindUserQueryVariables>;`,
    });

    const result = await transformFileAsync(
      path.join(project.baseDir, 'user.tsx'),
      {
        plugins: [
          [
            babelPlugin,
            {
              tagName: 'graphql',
            },
          ],
        ],
      }
    );

    expect(result && result.code).toMatchInlineSnapshot(`
      "import { findUserDocument } from \\"./__generated/user.graphql.ts\\";
      import { userFieldsFragmentDoc } from \\"./__generated/user.graphql.ts\\";
      import { graphql } from '@data-eden/athena';
      const userFieldsFragment = userFieldsFragmentDoc;
      const findUserQuery = findUserDocument;"
    `);
  });
});
