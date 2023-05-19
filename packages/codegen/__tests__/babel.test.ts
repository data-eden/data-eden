import { transformFileAsync } from '@babel/core';
import { babelPlugin } from '@data-eden/codegen/babel-plugin.js';
import type { Project } from 'fixturify-project';
import { describe, expect, test } from 'vitest';
import {
  createFixtures,
  gqlFilesMap,
  gqlFilesIgnoreMap,
  gqlFilesMapWithSharedFragmentsTransitive,
} from './utils/project.js';
import * as path from 'node:path';

describe('babel plugin', () => {
  let project: Project;

  test('should transform code that imports @data-ethen/codegen', async () => {
    project = await createFixtures({
      ...gqlFilesMap,
      'User.graphql.ts': `import type * as Types from './schema.graphql.js';

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
      path.join(project.baseDir, 'User.tsx'),
      {
        plugins: [[babelPlugin]],
      }
    );

    expect(result && result.code).toMatchInlineSnapshot(`
      "import { FindUserDocument } from \\"./__generated/User.graphql.ts\\";
      const userFieldsFragment = Symbol.for(\\"build-time-graphql-fragment\\");
      const findUserQuery = FindUserDocument;"
    `);
  });

  test('it works', async () => {
    project = await createFixtures(gqlFilesMapWithSharedFragmentsTransitive);

    const result = await transformFileAsync(
      path.join(project.baseDir, 'User.tsx'),
      {
        plugins: [[babelPlugin, {}]],
      }
    );

    expect(result && result.code).toMatchInlineSnapshot(`
      "import { FindUserDocument } from \\"./__generated/User.graphql.ts\\";
      import { userFieldsFragment } from './UserView.tsx';
      const findUserQuery = FindUserDocument;"
    `);
  });

  test('should not transform code that imports anything but @data-ethen/codegen', async () => {
    project = await createFixtures({
      ...gqlFilesIgnoreMap,
    });

    const result = await transformFileAsync(
      path.join(project.baseDir, 'ignore.tsx'),
      {
        plugins: [[babelPlugin]],
      }
    );

    expect(result && result.code).toMatchInlineSnapshot(`
      "import { gql } from '@something/else';
      const userFieldsFragment = gql\`fragment UserFields on User {
          id
          username
          role
        }
        \`;
      const findUserQuery = gql\`query findUser($userId: ID!) {
          user(id: $userId) {
            \${userFieldsFragment}
          }
        }
        \`;"
    `);
  });
});
