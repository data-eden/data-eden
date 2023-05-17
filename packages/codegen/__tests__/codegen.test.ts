import { printExecutableGraphQLDocument } from '@graphql-tools/documents';
import type { Project } from 'fixturify-project';
import { visit } from 'graphql';
import * as crypto from 'node:crypto';
import * as fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import * as path from 'node:path';
import { describe, expect, test } from 'vitest';
import { athenaCodegen } from '../src/index.js';
import {
  createFixtures,
  gqlFilesIgnoreMap,
  gqlFilesMap,
  gqlFilesMapWithReExportedFragments,
  gqlFilesMapWithSharedFragments,
  gqlFilesMapWithSharedFragmentsTransitive,
  gqlFilesMapWithSharedFragmentsUsedAndExported,
  graphqlFilesMap,
} from './utils/project.js';

describe('codegen', () => {
  let project: Project;

  async function read(relativePath: string) {
    return await fs.readFile(path.join(project.baseDir, relativePath), 'utf-8');
  }

  test('with graphql files', async () => {
    project = await createFixtures(graphqlFilesMap);

    await athenaCodegen({
      schemaPath: 'schema.graphql',
      documents: [`${project.baseDir}/**/*.graphql`],
      baseDir: project.baseDir,
      extension: '.graphql.ts',
      disableSchemaTypesGeneration: false,
      production: false,
    });

    expect(await read('queries/__generated/my-chats.graphql.ts'))
      .toMatchInlineSnapshot(`
        "import type * as Types from '../../schema.graphql.js';

        import type { ChatFieldsFragment } from '../../fragments/__generated/chat-fields-fragment.graphql.js';
        import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
        export type ChatsQueryVariables = Types.Exact<{
          userId: Types.Scalars['ID'];
        }>;


        export type ChatsQuery = { __typename: 'Query', myChats: Array<(
            { __typename: 'Chat' }
            & ChatFieldsFragment
          )> };


        export const ChatsDocument = {\\"__meta__\\":{\\"queryId\\":\\"a0cd151991e13b081cc250bf42218547f2c8e340282b90c1f7fe36c332de3416\\",\\"$DEBUG\\":{\\"contents\\":\\"fragment ChatFields on Chat { id messages { content id user { id username } } users { ...UserFields } } fragment UserFields on User { id role username } query chats($userId: ID!) { myChats { __typename ...ChatFields } }\\"}}} as unknown as DocumentNode<ChatsQuery, ChatsQueryVariables>;"
      `);

    expect(await read('query-identifiers.json')).toMatchInlineSnapshot(`
      "{
        \\"d17490e4b9ac1f7c227df3da6e5c5cdc6686b24d7194c0cb1bc29a8189a58f5c\\": \\"fragment UserFields on User { id role username } query findUser($userId: ID!) { user(id: $userId) { __typename ...UserFields } }\\",
        \\"a0cd151991e13b081cc250bf42218547f2c8e340282b90c1f7fe36c332de3416\\": \\"fragment ChatFields on Chat { id messages { content id user { id username } } users { ...UserFields } } fragment UserFields on User { id role username } query chats($userId: ID!) { myChats { __typename ...ChatFields } }\\"
      }"
    `);

    expect(await read('schema.graphql.ts')).toMatchInlineSnapshot(`
      "export type Maybe<T> = T | null;
      export type InputMaybe<T> = Maybe<T>;
      export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
      export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
      export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
      /** All built-in and custom scalars, mapped to their actual values */
      export type Scalars = {
        ID: string;
        String: string;
        Boolean: boolean;
        Int: number;
        Float: number;
        Date: any;
      };

      export enum Role {
        User = 'USER',
        Admin = 'ADMIN'
      }
      "
    `);
  });

  test('with graphql files (production)', async () => {
    project = await createFixtures(graphqlFilesMap);

    await athenaCodegen({
      schemaPath: 'schema.graphql',
      documents: [`${project.baseDir}/**/*.graphql`],
      baseDir: project.baseDir,
      extension: '.graphql.ts',
      disableSchemaTypesGeneration: false,
      production: true,
    });

    expect(await read('queries/__generated/my-chats.graphql.ts'))
      .toMatchInlineSnapshot(`
        "import type * as Types from '../../schema.graphql.js';

        import type { ChatFieldsFragment } from '../../fragments/__generated/chat-fields-fragment.graphql.js';
        import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
        export type ChatsQueryVariables = Types.Exact<{
          userId: Types.Scalars['ID'];
        }>;


        export type ChatsQuery = { __typename: 'Query', myChats: Array<(
            { __typename: 'Chat' }
            & ChatFieldsFragment
          )> };


        export const ChatsDocument = {\\"__meta__\\":{\\"queryId\\":\\"a0cd151991e13b081cc250bf42218547f2c8e340282b90c1f7fe36c332de3416\\"}} as unknown as DocumentNode<ChatsQuery, ChatsQueryVariables>;"
      `);

    expect(await read('query-identifiers.json')).toMatchInlineSnapshot(`
      "{
        \\"d17490e4b9ac1f7c227df3da6e5c5cdc6686b24d7194c0cb1bc29a8189a58f5c\\": \\"fragment UserFields on User { id role username } query findUser($userId: ID!) { user(id: $userId) { __typename ...UserFields } }\\",
        \\"a0cd151991e13b081cc250bf42218547f2c8e340282b90c1f7fe36c332de3416\\": \\"fragment ChatFields on Chat { id messages { content id user { id username } } users { ...UserFields } } fragment UserFields on User { id role username } query chats($userId: ID!) { myChats { __typename ...ChatFields } }\\"
      }"
    `);

    expect(await read('schema.graphql.ts')).toMatchSnapshot();
  });

  test('with custom hash function', async () => {
    project = await createFixtures(graphqlFilesMap);

    await athenaCodegen({
      schemaPath: 'schema.graphql',
      documents: [`${project.baseDir}/**/*.graphql`],
      baseDir: project.baseDir,
      extension: '.graphql.ts',
      disableSchemaTypesGeneration: false,
      production: false,
      hash(document) {
        let operationName = 'Document';

        visit(document, {
          OperationDefinition(node) {
            let name = node.name?.value;

            if (name) {
              operationName = name;
            }
          },
        });

        const hash = crypto
          .createHash('sha256')
          .update(printExecutableGraphQLDocument(document))
          .digest('hex');

        return `${operationName}-${hash}`;
      },
    });

    expect(await read('queries/__generated/my-chats.graphql.ts'))
      .toMatchInlineSnapshot(`
        "import type * as Types from '../../schema.graphql.js';

        import type { ChatFieldsFragment } from '../../fragments/__generated/chat-fields-fragment.graphql.js';
        import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
        export type ChatsQueryVariables = Types.Exact<{
          userId: Types.Scalars['ID'];
        }>;


        export type ChatsQuery = { __typename: 'Query', myChats: Array<(
            { __typename: 'Chat' }
            & ChatFieldsFragment
          )> };


        export const ChatsDocument = {\\"__meta__\\":{\\"queryId\\":\\"chats-a0cd151991e13b081cc250bf42218547f2c8e340282b90c1f7fe36c332de3416\\",\\"$DEBUG\\":{\\"contents\\":\\"fragment ChatFields on Chat { id messages { content id user { id username } } users { ...UserFields } } fragment UserFields on User { id role username } query chats($userId: ID!) { myChats { __typename ...ChatFields } }\\"}}} as unknown as DocumentNode<ChatsQuery, ChatsQueryVariables>;"
      `);

    expect(await read('query-identifiers.json')).toMatchInlineSnapshot(`
      "{
        \\"findUser-d17490e4b9ac1f7c227df3da6e5c5cdc6686b24d7194c0cb1bc29a8189a58f5c\\": \\"fragment UserFields on User { id role username } query findUser($userId: ID!) { user(id: $userId) { __typename ...UserFields } }\\",
        \\"chats-a0cd151991e13b081cc250bf42218547f2c8e340282b90c1f7fe36c332de3416\\": \\"fragment ChatFields on Chat { id messages { content id user { id username } } users { ...UserFields } } fragment UserFields on User { id role username } query chats($userId: ID!) { myChats { __typename ...ChatFields } }\\"
      }"
    `);

    expect(await read('schema.graphql.ts')).toMatchSnapshot();

    project.dispose();
  });

  test('with gql tags', async () => {
    project = await createFixtures(gqlFilesMap);

    await athenaCodegen({
      schemaPath: 'schema.graphql',
      documents: [`${project.baseDir}/**/*.tsx`],
      baseDir: project.baseDir,
      extension: '.graphql.ts',
      disableSchemaTypesGeneration: false,
      production: false,
    });

    expect(await read('schema.graphql.ts')).toMatchSnapshot();

    expect(await read('__generated/user.graphql.ts')).toMatchInlineSnapshot(`
      "import type * as Types from '../schema.graphql.js';

      import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
      export type UserFieldsFragment = { __typename: 'User', id: string, username: string, role: Types.Role };

      export type FindUserQueryVariables = Types.Exact<{
        userId: Types.Scalars['ID'];
      }>;


      export type FindUserQuery = { __typename: 'Query', user?: (
          { __typename: 'User' }
          & UserFieldsFragment
        ) | null };


      export const FindUserDocument = {\\"__meta__\\":{\\"queryId\\":\\"d17490e4b9ac1f7c227df3da6e5c5cdc6686b24d7194c0cb1bc29a8189a58f5c\\",\\"$DEBUG\\":{\\"contents\\":\\"fragment UserFields on User { id role username } query findUser($userId: ID!) { user(id: $userId) { __typename ...UserFields } }\\"}}} as unknown as DocumentNode<FindUserQuery, FindUserQueryVariables>;"
    `);
  });

  test('with gql tags (production)', async () => {
    project = await createFixtures(gqlFilesMap);

    await athenaCodegen({
      schemaPath: 'schema.graphql',
      documents: [`${project.baseDir}/**/*.tsx`],
      baseDir: project.baseDir,
      extension: '.graphql.ts',
      disableSchemaTypesGeneration: false,
      production: true,
    });

    expect(await read('schema.graphql.ts')).toMatchSnapshot();

    expect(await read('__generated/user.graphql.ts')).toMatchInlineSnapshot(`
      "import type * as Types from '../schema.graphql.js';

      import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
      export type UserFieldsFragment = { __typename: 'User', id: string, username: string, role: Types.Role };

      export type FindUserQueryVariables = Types.Exact<{
        userId: Types.Scalars['ID'];
      }>;


      export type FindUserQuery = { __typename: 'Query', user?: (
          { __typename: 'User' }
          & UserFieldsFragment
        ) | null };


      export const FindUserDocument = {\\"__meta__\\":{\\"queryId\\":\\"d17490e4b9ac1f7c227df3da6e5c5cdc6686b24d7194c0cb1bc29a8189a58f5c\\"}} as unknown as DocumentNode<FindUserQuery, FindUserQueryVariables>;"
    `);
  });

  test('should not parse tags that do not come from @data-eden/codegen', async () => {
    project = await createFixtures(gqlFilesIgnoreMap);

    await athenaCodegen({
      schemaPath: 'schema.graphql',
      documents: [`${project.baseDir}/**/*.tsx`],
      baseDir: project.baseDir,
      extension: '.graphql.ts',
      disableSchemaTypesGeneration: false,
      production: false,
    });

    expect(
      existsSync(
        path.join(project.baseDir, '__generated', 'invalid.graphql.ts')
      )
    ).toBeFalsy();
  });

  test('gql tags with shared fragments', async () => {
    project = await createFixtures(gqlFilesMapWithSharedFragments);

    await athenaCodegen({
      schemaPath: 'schema.graphql',
      documents: [`${project.baseDir}/**/*.tsx`],
      baseDir: project.baseDir,
      extension: '.graphql.ts',
      disableSchemaTypesGeneration: false,
      production: false,
    });

    expect(await read('schema.graphql.ts')).toMatchSnapshot();

    expect(await read('__generated/UserView.graphql.ts'))
      .toMatchInlineSnapshot(`
        "import type * as Types from '../schema.graphql.js';

        import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
        export type UserFieldsFragment = { __typename: 'User', id: string, username: string, email: string, role: Types.Role };
        "
      `);

    expect(await read('__generated/User.graphql.ts')).toMatchInlineSnapshot(`
      "import type * as Types from '../schema.graphql.js';

      import type { UserFieldsFragment } from './UserView.graphql.js';
      import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
      export type FindUserQueryVariables = Types.Exact<{
        userId: Types.Scalars['ID'];
      }>;


      export type FindUserQuery = { __typename: 'Query', user?: (
          { __typename: 'User' }
          & UserFieldsFragment
        ) | null };


      export const FindUserDocument = {\\"__meta__\\":{\\"queryId\\":\\"2a3590156c3f32f68e767b1f7bb03462e515e373190ef90bfea2f9a9cbd82ddb\\",\\"$DEBUG\\":{\\"contents\\":\\"fragment UserFields on User { email id role username } query findUser($userId: ID!) { user(id: $userId) { __typename ...UserFields } }\\"}}} as unknown as DocumentNode<FindUserQuery, FindUserQueryVariables>;"
    `);
  });

  test('gql tags with shared fragments transitive', async () => {
    project = await createFixtures(gqlFilesMapWithSharedFragmentsTransitive);

    await athenaCodegen({
      schemaPath: 'schema.graphql',
      documents: [`${project.baseDir}/**/*.tsx`],
      baseDir: project.baseDir,
      extension: '.graphql.ts',
      disableSchemaTypesGeneration: false,
      production: false,
    });

    expect(await read('schema.graphql.ts')).toMatchSnapshot();

    expect(await read('__generated/MessageView.graphql.ts'))
      .toMatchInlineSnapshot(`
        "import type * as Types from '../schema.graphql.js';

        import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
        export type MessageFieldsFragment = { __typename: 'ChatMessage', id: string, content: string, time: any };
        "
      `);

    expect(await read('__generated/ChatView.graphql.ts'))
      .toMatchInlineSnapshot(`
        "import type * as Types from '../schema.graphql.js';

        import type { MessageFieldsFragment } from './MessageView.graphql.js';
        import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
        export type ChatFieldsFragment = { __typename: 'Chat', id: string, users: Array<{ __typename: 'User', id: string, username: string }>, messages: Array<(
            { __typename: 'ChatMessage' }
            & MessageFieldsFragment
          )> };
        "
      `);

    expect(await read('__generated/UserView.graphql.ts'))
      .toMatchInlineSnapshot(`
        "import type * as Types from '../schema.graphql.js';

        import type { ChatFieldsFragment } from './ChatView.graphql.js';
        import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
        export type UserFieldsFragment = { __typename: 'User', id: string, username: string, role: Types.Role, chats: Array<(
            { __typename: 'Chat' }
            & ChatFieldsFragment
          ) | null> };
        "
      `);

    expect(await read('__generated/User.graphql.ts')).toMatchInlineSnapshot(`
      "import type * as Types from '../schema.graphql.js';

      import type { UserFieldsFragment } from './UserView.graphql.js';
      import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
      export type FindUserQueryVariables = Types.Exact<{
        userId: Types.Scalars['ID'];
      }>;


      export type FindUserQuery = { __typename: 'Query', user?: (
          { __typename: 'User' }
          & UserFieldsFragment
        ) | null };


      export const FindUserDocument = {\\"__meta__\\":{\\"queryId\\":\\"c2143ab7d20638afd504d251c36c3a62fc1a6f383b93f7bf366ecfba2a3f4e11\\",\\"$DEBUG\\":{\\"contents\\":\\"fragment ChatFields on Chat { id messages { ...MessageFields } users { id username } } fragment MessageFields on ChatMessage { content id time } fragment UserFields on User { chats { ...ChatFields } id role username } query findUser($userId: ID!) { user(id: $userId) { __typename ...UserFields } }\\"}}} as unknown as DocumentNode<FindUserQuery, FindUserQueryVariables>;"
    `);
  });

  // TODO: gql tags with re-exported fragments
  test.skip('gql tags with re-exported fragments', async () => {
    project = await createFixtures(gqlFilesMapWithReExportedFragments);

    await athenaCodegen({
      schemaPath: 'schema.graphql',
      documents: [`${project.baseDir}/**/*.tsx`],
      baseDir: project.baseDir,
      extension: '.graphql.ts',
      disableSchemaTypesGeneration: false,
      production: false,
    });

    expect(await read('schema.graphql.ts')).toMatchSnapshot();

    expect(
      await read('__generated/ChatView.graphql.ts')
    ).toMatchInlineSnapshot();
    expect(
      await read('__generated/UserView.graphql.ts')
    ).toMatchInlineSnapshot();
  });

  test('gql tags with fragments locally used + exported', async () => {
    project = await createFixtures(
      gqlFilesMapWithSharedFragmentsUsedAndExported
    );

    await athenaCodegen({
      schemaPath: 'schema.graphql',
      documents: [`${project.baseDir}/**/*.tsx`],
      baseDir: project.baseDir,
      extension: '.graphql.ts',
      disableSchemaTypesGeneration: false,
      production: false,
    });

    expect(await read('schema.graphql.ts')).toMatchSnapshot();

    expect(await read('__generated/ChatView.graphql.ts'))
      .toMatchInlineSnapshot(`
      "import type * as Types from '../schema.graphql.js';

      import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
      export type ChatFieldsFragment = { __typename: 'Chat', id: string, users: Array<{ __typename: 'User', id: string, username: string }> };

      export type FindMyChatsQueryVariables = Types.Exact<{ [key: string]: never; }>;


      export type FindMyChatsQuery = { __typename: 'Query', myChats: Array<(
          { __typename: 'Chat' }
          & ChatFieldsFragment
        )> };


      export const FindMyChatsDocument = {\\"__meta__\\":{\\"queryId\\":\\"9a1cceea656312633d2f6890193132c1776249e695be24f6e5e2e3da8259a162\\",\\"$DEBUG\\":{\\"contents\\":\\"fragment ChatFields on Chat { id users { id username } } query findMyChats { myChats { __typename ...ChatFields } }\\"}}} as unknown as DocumentNode<FindMyChatsQuery, FindMyChatsQueryVariables>;"
    `);
    expect(await read('__generated/User.graphql.ts')).toMatchInlineSnapshot(`
      "import type * as Types from '../schema.graphql.js';

      import type { ChatFieldsFragment } from './ChatView.graphql.js';
      import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
      export type FindUserQueryVariables = Types.Exact<{
        userId: Types.Scalars['ID'];
      }>;


      export type FindUserQuery = { __typename: 'Query', user?: { __typename: 'User', chats: Array<(
            { __typename: 'Chat' }
            & ChatFieldsFragment
          ) | null> } | null };


      export const FindUserDocument = {\\"__meta__\\":{\\"queryId\\":\\"fbb63dc6cd9b42699045d88fb71d7c15042668eec947a17f21acb655c258d031\\",\\"$DEBUG\\":{\\"contents\\":\\"fragment ChatFields on Chat { id users { id username } } query findUser($userId: ID!) { user(id: $userId) { __typename chats { __typename ...ChatFields } } }\\"}}} as unknown as DocumentNode<FindUserQuery, FindUserQueryVariables>;"
    `);
  });

  // TODO: import fragment with aliasing
  //
  // TODO: import fragment from foo.graphql inside a .tsx
  // TODO: import fragment from foo.tsx inside a .graphql
});
