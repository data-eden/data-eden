import { printExecutableGraphQLDocument } from '@graphql-tools/documents';
import type { Project } from 'fixturify-project';
import { visit } from 'graphql';
import * as crypto from 'node:crypto';
import * as fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import * as path from 'node:path';
import { describe, expect, test } from 'vitest';
import { athenaCodegen } from '@data-eden/codegen';
import {
  createFixtures,
  gqlFilesIgnoreMap,
  gqlFilesMap,
  gqlFilesMapWithReExportedFragments,
  gqlFilesMapWithSharedFragments,
  gqlFilesMapWithSharedFragmentsTransitive,
  gqlFilesMapWithSharedFragmentsUsedAndExported,
  graphqlFilesMap,
  gqlFilesMapWithAliasedPaths,
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


        export const ChatsDocument = {\\"__meta__\\":{\\"queryId\\":\\"a0cd151991e13b081cc250bf42218547f2c8e340282b90c1f7fe36c332de3416\\",\\"$DEBUG\\":{\\"contents\\":\\"fragment ChatFields on Chat { id messages { content id user { id username } } users { ...UserFields } } fragment UserFields on User { id role username } query chats($userId: ID!) { myChats { __typename ...ChatFields } }\\",\\"ast\\":{\\"kind\\":\\"Document\\",\\"definitions\\":[{\\"kind\\":\\"OperationDefinition\\",\\"operation\\":\\"query\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"chats\\"},\\"variableDefinitions\\":[{\\"kind\\":\\"VariableDefinition\\",\\"variable\\":{\\"kind\\":\\"Variable\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"userId\\"}},\\"type\\":{\\"kind\\":\\"NonNullType\\",\\"type\\":{\\"kind\\":\\"NamedType\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"ID\\"}}}}],\\"selectionSet\\":{\\"kind\\":\\"SelectionSet\\",\\"selections\\":[{\\"kind\\":\\"Field\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"myChats\\"},\\"selectionSet\\":{\\"kind\\":\\"SelectionSet\\",\\"selections\\":[{\\"kind\\":\\"FragmentSpread\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"ChatFields\\"}},{\\"kind\\":\\"Field\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"__typename\\"}}]}}]}},{\\"kind\\":\\"FragmentDefinition\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"UserFields\\"},\\"typeCondition\\":{\\"kind\\":\\"NamedType\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"User\\"}},\\"selectionSet\\":{\\"kind\\":\\"SelectionSet\\",\\"selections\\":[{\\"kind\\":\\"Field\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"id\\"}},{\\"kind\\":\\"Field\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"username\\"}},{\\"kind\\":\\"Field\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"role\\"}}]}},{\\"kind\\":\\"FragmentDefinition\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"ChatFields\\"},\\"typeCondition\\":{\\"kind\\":\\"NamedType\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"Chat\\"}},\\"selectionSet\\":{\\"kind\\":\\"SelectionSet\\",\\"selections\\":[{\\"kind\\":\\"Field\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"id\\"}},{\\"kind\\":\\"Field\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"users\\"},\\"selectionSet\\":{\\"kind\\":\\"SelectionSet\\",\\"selections\\":[{\\"kind\\":\\"FragmentSpread\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"UserFields\\"}}]}},{\\"kind\\":\\"Field\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"messages\\"},\\"selectionSet\\":{\\"kind\\":\\"SelectionSet\\",\\"selections\\":[{\\"kind\\":\\"Field\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"id\\"}},{\\"kind\\":\\"Field\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"content\\"}},{\\"kind\\":\\"Field\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"user\\"},\\"selectionSet\\":{\\"kind\\":\\"SelectionSet\\",\\"selections\\":[{\\"kind\\":\\"Field\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"id\\"}},{\\"kind\\":\\"Field\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"username\\"}}]}}]}}]}}]}}}} as unknown as DocumentNode<ChatsQuery, ChatsQueryVariables>;"
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

    const cwdRegex = new RegExp(process.cwd(), 'g');

    expect((await read('query-identifiers.json')).replace(cwdRegex, ''))
      .toMatchInlineSnapshot(`
        "{
          \\"d17490e4b9ac1f7c227df3da6e5c5cdc6686b24d7194c0cb1bc29a8189a58f5c\\": {
            \\"fileSource\\": \\"fragment UserFields on User { id role username } query findUser($userId: ID!) { user(id: $userId) { __typename ...UserFields } }\\",
            \\"filePath\\": \\"/__tests__/__graphql-project/queries/find-user.graphql\\"
          },
          \\"a0cd151991e13b081cc250bf42218547f2c8e340282b90c1f7fe36c332de3416\\": {
            \\"fileSource\\": \\"fragment ChatFields on Chat { id messages { content id user { id username } } users { ...UserFields } } fragment UserFields on User { id role username } query chats($userId: ID!) { myChats { __typename ...ChatFields } }\\",
            \\"filePath\\": \\"/__tests__/__graphql-project/queries/my-chats.graphql\\"
          }
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


        export const ChatsDocument = {\\"__meta__\\":{\\"queryId\\":\\"chats-a0cd151991e13b081cc250bf42218547f2c8e340282b90c1f7fe36c332de3416\\",\\"$DEBUG\\":{\\"contents\\":\\"fragment ChatFields on Chat { id messages { content id user { id username } } users { ...UserFields } } fragment UserFields on User { id role username } query chats($userId: ID!) { myChats { __typename ...ChatFields } }\\",\\"ast\\":{\\"kind\\":\\"Document\\",\\"definitions\\":[{\\"kind\\":\\"OperationDefinition\\",\\"operation\\":\\"query\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"chats\\"},\\"variableDefinitions\\":[{\\"kind\\":\\"VariableDefinition\\",\\"variable\\":{\\"kind\\":\\"Variable\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"userId\\"}},\\"type\\":{\\"kind\\":\\"NonNullType\\",\\"type\\":{\\"kind\\":\\"NamedType\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"ID\\"}}}}],\\"selectionSet\\":{\\"kind\\":\\"SelectionSet\\",\\"selections\\":[{\\"kind\\":\\"Field\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"myChats\\"},\\"selectionSet\\":{\\"kind\\":\\"SelectionSet\\",\\"selections\\":[{\\"kind\\":\\"FragmentSpread\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"ChatFields\\"}},{\\"kind\\":\\"Field\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"__typename\\"}}]}}]}},{\\"kind\\":\\"FragmentDefinition\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"UserFields\\"},\\"typeCondition\\":{\\"kind\\":\\"NamedType\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"User\\"}},\\"selectionSet\\":{\\"kind\\":\\"SelectionSet\\",\\"selections\\":[{\\"kind\\":\\"Field\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"id\\"}},{\\"kind\\":\\"Field\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"username\\"}},{\\"kind\\":\\"Field\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"role\\"}}]}},{\\"kind\\":\\"FragmentDefinition\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"ChatFields\\"},\\"typeCondition\\":{\\"kind\\":\\"NamedType\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"Chat\\"}},\\"selectionSet\\":{\\"kind\\":\\"SelectionSet\\",\\"selections\\":[{\\"kind\\":\\"Field\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"id\\"}},{\\"kind\\":\\"Field\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"users\\"},\\"selectionSet\\":{\\"kind\\":\\"SelectionSet\\",\\"selections\\":[{\\"kind\\":\\"FragmentSpread\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"UserFields\\"}}]}},{\\"kind\\":\\"Field\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"messages\\"},\\"selectionSet\\":{\\"kind\\":\\"SelectionSet\\",\\"selections\\":[{\\"kind\\":\\"Field\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"id\\"}},{\\"kind\\":\\"Field\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"content\\"}},{\\"kind\\":\\"Field\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"user\\"},\\"selectionSet\\":{\\"kind\\":\\"SelectionSet\\",\\"selections\\":[{\\"kind\\":\\"Field\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"id\\"}},{\\"kind\\":\\"Field\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"username\\"}}]}}]}}]}}]}}}} as unknown as DocumentNode<ChatsQuery, ChatsQueryVariables>;"
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

    expect(await read('__generated/User.graphql.ts')).toMatchInlineSnapshot(`
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

      export const UserFieldsFragmentDoc = {\\"kind\\":\\"Document\\",\\"definitions\\":[{\\"kind\\":\\"FragmentDefinition\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"UserFields\\"},\\"typeCondition\\":{\\"kind\\":\\"NamedType\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"User\\"}},\\"selectionSet\\":{\\"kind\\":\\"SelectionSet\\",\\"selections\\":[{\\"kind\\":\\"Field\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"id\\"}},{\\"kind\\":\\"Field\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"username\\"}},{\\"kind\\":\\"Field\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"role\\"}}]}}]} as unknown as DocumentNode<UserFieldsFragment, unknown>;
      export const FindUserDocument = {\\"__meta__\\":{\\"queryId\\":\\"d17490e4b9ac1f7c227df3da6e5c5cdc6686b24d7194c0cb1bc29a8189a58f5c\\",\\"$DEBUG\\":{\\"contents\\":\\"fragment UserFields on User { id role username } query findUser($userId: ID!) { user(id: $userId) { __typename ...UserFields } }\\",\\"ast\\":{\\"kind\\":\\"Document\\",\\"definitions\\":[{\\"kind\\":\\"OperationDefinition\\",\\"operation\\":\\"query\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"findUser\\"},\\"variableDefinitions\\":[{\\"kind\\":\\"VariableDefinition\\",\\"variable\\":{\\"kind\\":\\"Variable\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"userId\\"}},\\"type\\":{\\"kind\\":\\"NonNullType\\",\\"type\\":{\\"kind\\":\\"NamedType\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"ID\\"}}}}],\\"selectionSet\\":{\\"kind\\":\\"SelectionSet\\",\\"selections\\":[{\\"kind\\":\\"Field\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"user\\"},\\"arguments\\":[{\\"kind\\":\\"Argument\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"id\\"},\\"value\\":{\\"kind\\":\\"Variable\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"userId\\"}}}],\\"selectionSet\\":{\\"kind\\":\\"SelectionSet\\",\\"selections\\":[{\\"kind\\":\\"FragmentSpread\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"UserFields\\"}},{\\"kind\\":\\"Field\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"__typename\\"}}]}}]}},{\\"kind\\":\\"FragmentDefinition\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"UserFields\\"},\\"typeCondition\\":{\\"kind\\":\\"NamedType\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"User\\"}},\\"selectionSet\\":{\\"kind\\":\\"SelectionSet\\",\\"selections\\":[{\\"kind\\":\\"Field\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"id\\"}},{\\"kind\\":\\"Field\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"username\\"}},{\\"kind\\":\\"Field\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"role\\"}}]}}]}}}} as unknown as DocumentNode<FindUserQuery, FindUserQueryVariables>;"
    `);
  });

  test('with gql tags and fieldInjection', async () => {
    project = await createFixtures(gqlFilesMap);

    await athenaCodegen({
      schemaPath: 'schema.graphql',
      documents: [`${project.baseDir}/**/*.tsx`],
      baseDir: project.baseDir,
      extension: '.graphql.ts',
      disableSchemaTypesGeneration: false,
      fieldInjection: {
        User: {
          name: 'role',
          alias: 'userRole',
        },
      },
      production: false,
    });

    expect(await read('schema.graphql.ts')).toMatchSnapshot();

    expect(await read('__generated/User.graphql.ts')).toMatchInlineSnapshot(`
      "import type * as Types from '../schema.graphql.js';

      import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
      export type UserFieldsFragment = { __typename: 'User', id: string, username: string, role: Types.Role, userRole: Types.Role };

      export type FindUserQueryVariables = Types.Exact<{
        userId: Types.Scalars['ID'];
      }>;


      export type FindUserQuery = { __typename: 'Query', user?: (
          { __typename: 'User', userRole: Types.Role }
          & UserFieldsFragment
        ) | null };

      export const UserFieldsFragmentDoc = {\\"kind\\":\\"Document\\",\\"definitions\\":[{\\"kind\\":\\"FragmentDefinition\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"UserFields\\"},\\"typeCondition\\":{\\"kind\\":\\"NamedType\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"User\\"}},\\"selectionSet\\":{\\"kind\\":\\"SelectionSet\\",\\"selections\\":[{\\"kind\\":\\"Field\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"__typename\\"}},{\\"kind\\":\\"Field\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"id\\"}},{\\"kind\\":\\"Field\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"username\\"}},{\\"kind\\":\\"Field\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"role\\"}},{\\"kind\\":\\"Field\\",\\"alias\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"userRole\\"},\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"role\\"}}]}}]} as unknown as DocumentNode<UserFieldsFragment, unknown>;
      export const FindUserDocument = {\\"__meta__\\":{\\"queryId\\":\\"3a9f3082d5081da4492ebd6b21557e04a19accc62db2d158c4675fb54bd3b619\\",\\"$DEBUG\\":{\\"contents\\":\\"fragment UserFields on User { __typename id role userRole: role username } query findUser($userId: ID!) { __typename user(id: $userId) { __typename userRole: role ...UserFields } }\\",\\"ast\\":{\\"kind\\":\\"Document\\",\\"definitions\\":[{\\"kind\\":\\"OperationDefinition\\",\\"operation\\":\\"query\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"findUser\\"},\\"variableDefinitions\\":[{\\"kind\\":\\"VariableDefinition\\",\\"variable\\":{\\"kind\\":\\"Variable\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"userId\\"}},\\"type\\":{\\"kind\\":\\"NonNullType\\",\\"type\\":{\\"kind\\":\\"NamedType\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"ID\\"}}}}],\\"selectionSet\\":{\\"kind\\":\\"SelectionSet\\",\\"selections\\":[{\\"kind\\":\\"Field\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"__typename\\"}},{\\"kind\\":\\"Field\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"user\\"},\\"arguments\\":[{\\"kind\\":\\"Argument\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"id\\"},\\"value\\":{\\"kind\\":\\"Variable\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"userId\\"}}}],\\"selectionSet\\":{\\"kind\\":\\"SelectionSet\\",\\"selections\\":[{\\"kind\\":\\"Field\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"__typename\\"}},{\\"kind\\":\\"FragmentSpread\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"UserFields\\"}},{\\"kind\\":\\"Field\\",\\"alias\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"userRole\\"},\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"role\\"}}]}}]}},{\\"kind\\":\\"FragmentDefinition\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"UserFields\\"},\\"typeCondition\\":{\\"kind\\":\\"NamedType\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"User\\"}},\\"selectionSet\\":{\\"kind\\":\\"SelectionSet\\",\\"selections\\":[{\\"kind\\":\\"Field\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"__typename\\"}},{\\"kind\\":\\"Field\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"id\\"}},{\\"kind\\":\\"Field\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"username\\"}},{\\"kind\\":\\"Field\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"role\\"}},{\\"kind\\":\\"Field\\",\\"alias\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"userRole\\"},\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"role\\"}}]}}]}}}} as unknown as DocumentNode<FindUserQuery, FindUserQueryVariables>;"
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

    expect(await read('__generated/User.graphql.ts')).toMatchInlineSnapshot(`
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

        export const UserFieldsFragmentDoc = {\\"kind\\":\\"Document\\",\\"definitions\\":[{\\"kind\\":\\"FragmentDefinition\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"UserFields\\"},\\"typeCondition\\":{\\"kind\\":\\"NamedType\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"User\\"}},\\"selectionSet\\":{\\"kind\\":\\"SelectionSet\\",\\"selections\\":[{\\"kind\\":\\"Field\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"id\\"}},{\\"kind\\":\\"Field\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"username\\"}},{\\"kind\\":\\"Field\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"email\\"}},{\\"kind\\":\\"Field\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"role\\"}}]}}]} as unknown as DocumentNode<UserFieldsFragment, unknown>;"
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


      export const FindUserDocument = {\\"__meta__\\":{\\"queryId\\":\\"2a3590156c3f32f68e767b1f7bb03462e515e373190ef90bfea2f9a9cbd82ddb\\",\\"$DEBUG\\":{\\"contents\\":\\"fragment UserFields on User { email id role username } query findUser($userId: ID!) { user(id: $userId) { __typename ...UserFields } }\\",\\"ast\\":{\\"kind\\":\\"Document\\",\\"definitions\\":[{\\"kind\\":\\"OperationDefinition\\",\\"operation\\":\\"query\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"findUser\\"},\\"variableDefinitions\\":[{\\"kind\\":\\"VariableDefinition\\",\\"variable\\":{\\"kind\\":\\"Variable\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"userId\\"}},\\"type\\":{\\"kind\\":\\"NonNullType\\",\\"type\\":{\\"kind\\":\\"NamedType\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"ID\\"}}}}],\\"selectionSet\\":{\\"kind\\":\\"SelectionSet\\",\\"selections\\":[{\\"kind\\":\\"Field\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"user\\"},\\"arguments\\":[{\\"kind\\":\\"Argument\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"id\\"},\\"value\\":{\\"kind\\":\\"Variable\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"userId\\"}}}],\\"selectionSet\\":{\\"kind\\":\\"SelectionSet\\",\\"selections\\":[{\\"kind\\":\\"FragmentSpread\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"UserFields\\"}},{\\"kind\\":\\"Field\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"__typename\\"}}]}}]}},{\\"kind\\":\\"FragmentDefinition\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"UserFields\\"},\\"typeCondition\\":{\\"kind\\":\\"NamedType\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"User\\"}},\\"selectionSet\\":{\\"kind\\":\\"SelectionSet\\",\\"selections\\":[{\\"kind\\":\\"Field\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"id\\"}},{\\"kind\\":\\"Field\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"username\\"}},{\\"kind\\":\\"Field\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"email\\"}},{\\"kind\\":\\"Field\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"role\\"}}]}}]}}}} as unknown as DocumentNode<FindUserQuery, FindUserQueryVariables>;"
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

        export const MessageFieldsFragmentDoc = {\\"kind\\":\\"Document\\",\\"definitions\\":[{\\"kind\\":\\"FragmentDefinition\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"MessageFields\\"},\\"typeCondition\\":{\\"kind\\":\\"NamedType\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"ChatMessage\\"}},\\"selectionSet\\":{\\"kind\\":\\"SelectionSet\\",\\"selections\\":[{\\"kind\\":\\"Field\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"id\\"}},{\\"kind\\":\\"Field\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"content\\"}},{\\"kind\\":\\"Field\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"time\\"}}]}}]} as unknown as DocumentNode<MessageFieldsFragment, unknown>;"
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

        export const ChatFieldsFragmentDoc = {\\"kind\\":\\"Document\\",\\"definitions\\":[{\\"kind\\":\\"FragmentDefinition\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"ChatFields\\"},\\"typeCondition\\":{\\"kind\\":\\"NamedType\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"Chat\\"}},\\"selectionSet\\":{\\"kind\\":\\"SelectionSet\\",\\"selections\\":[{\\"kind\\":\\"Field\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"id\\"}},{\\"kind\\":\\"Field\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"users\\"},\\"selectionSet\\":{\\"kind\\":\\"SelectionSet\\",\\"selections\\":[{\\"kind\\":\\"Field\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"id\\"}},{\\"kind\\":\\"Field\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"username\\"}}]}},{\\"kind\\":\\"Field\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"messages\\"},\\"selectionSet\\":{\\"kind\\":\\"SelectionSet\\",\\"selections\\":[{\\"kind\\":\\"FragmentSpread\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"MessageFields\\"}}]}}]}},{\\"kind\\":\\"FragmentDefinition\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"MessageFields\\"},\\"typeCondition\\":{\\"kind\\":\\"NamedType\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"ChatMessage\\"}},\\"selectionSet\\":{\\"kind\\":\\"SelectionSet\\",\\"selections\\":[{\\"kind\\":\\"Field\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"id\\"}},{\\"kind\\":\\"Field\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"content\\"}},{\\"kind\\":\\"Field\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"time\\"}}]}}]} as unknown as DocumentNode<ChatFieldsFragment, unknown>;"
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

        export const UserFieldsFragmentDoc = {\\"kind\\":\\"Document\\",\\"definitions\\":[{\\"kind\\":\\"FragmentDefinition\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"UserFields\\"},\\"typeCondition\\":{\\"kind\\":\\"NamedType\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"User\\"}},\\"selectionSet\\":{\\"kind\\":\\"SelectionSet\\",\\"selections\\":[{\\"kind\\":\\"Field\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"id\\"}},{\\"kind\\":\\"Field\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"username\\"}},{\\"kind\\":\\"Field\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"role\\"}},{\\"kind\\":\\"Field\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"chats\\"},\\"selectionSet\\":{\\"kind\\":\\"SelectionSet\\",\\"selections\\":[{\\"kind\\":\\"FragmentSpread\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"ChatFields\\"}}]}}]}},{\\"kind\\":\\"FragmentDefinition\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"MessageFields\\"},\\"typeCondition\\":{\\"kind\\":\\"NamedType\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"ChatMessage\\"}},\\"selectionSet\\":{\\"kind\\":\\"SelectionSet\\",\\"selections\\":[{\\"kind\\":\\"Field\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"id\\"}},{\\"kind\\":\\"Field\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"content\\"}},{\\"kind\\":\\"Field\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"time\\"}}]}},{\\"kind\\":\\"FragmentDefinition\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"ChatFields\\"},\\"typeCondition\\":{\\"kind\\":\\"NamedType\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"Chat\\"}},\\"selectionSet\\":{\\"kind\\":\\"SelectionSet\\",\\"selections\\":[{\\"kind\\":\\"Field\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"id\\"}},{\\"kind\\":\\"Field\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"users\\"},\\"selectionSet\\":{\\"kind\\":\\"SelectionSet\\",\\"selections\\":[{\\"kind\\":\\"Field\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"id\\"}},{\\"kind\\":\\"Field\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"username\\"}}]}},{\\"kind\\":\\"Field\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"messages\\"},\\"selectionSet\\":{\\"kind\\":\\"SelectionSet\\",\\"selections\\":[{\\"kind\\":\\"FragmentSpread\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"MessageFields\\"}}]}}]}}]} as unknown as DocumentNode<UserFieldsFragment, unknown>;"
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


      export const FindUserDocument = {\\"__meta__\\":{\\"queryId\\":\\"c2143ab7d20638afd504d251c36c3a62fc1a6f383b93f7bf366ecfba2a3f4e11\\",\\"$DEBUG\\":{\\"contents\\":\\"fragment ChatFields on Chat { id messages { ...MessageFields } users { id username } } fragment MessageFields on ChatMessage { content id time } fragment UserFields on User { chats { ...ChatFields } id role username } query findUser($userId: ID!) { user(id: $userId) { __typename ...UserFields } }\\",\\"ast\\":{\\"kind\\":\\"Document\\",\\"definitions\\":[{\\"kind\\":\\"OperationDefinition\\",\\"operation\\":\\"query\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"findUser\\"},\\"variableDefinitions\\":[{\\"kind\\":\\"VariableDefinition\\",\\"variable\\":{\\"kind\\":\\"Variable\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"userId\\"}},\\"type\\":{\\"kind\\":\\"NonNullType\\",\\"type\\":{\\"kind\\":\\"NamedType\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"ID\\"}}}}],\\"selectionSet\\":{\\"kind\\":\\"SelectionSet\\",\\"selections\\":[{\\"kind\\":\\"Field\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"user\\"},\\"arguments\\":[{\\"kind\\":\\"Argument\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"id\\"},\\"value\\":{\\"kind\\":\\"Variable\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"userId\\"}}}],\\"selectionSet\\":{\\"kind\\":\\"SelectionSet\\",\\"selections\\":[{\\"kind\\":\\"FragmentSpread\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"UserFields\\"}},{\\"kind\\":\\"Field\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"__typename\\"}}]}}]}},{\\"kind\\":\\"FragmentDefinition\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"MessageFields\\"},\\"typeCondition\\":{\\"kind\\":\\"NamedType\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"ChatMessage\\"}},\\"selectionSet\\":{\\"kind\\":\\"SelectionSet\\",\\"selections\\":[{\\"kind\\":\\"Field\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"id\\"}},{\\"kind\\":\\"Field\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"content\\"}},{\\"kind\\":\\"Field\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"time\\"}}]}},{\\"kind\\":\\"FragmentDefinition\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"ChatFields\\"},\\"typeCondition\\":{\\"kind\\":\\"NamedType\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"Chat\\"}},\\"selectionSet\\":{\\"kind\\":\\"SelectionSet\\",\\"selections\\":[{\\"kind\\":\\"Field\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"id\\"}},{\\"kind\\":\\"Field\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"users\\"},\\"selectionSet\\":{\\"kind\\":\\"SelectionSet\\",\\"selections\\":[{\\"kind\\":\\"Field\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"id\\"}},{\\"kind\\":\\"Field\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"username\\"}}]}},{\\"kind\\":\\"Field\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"messages\\"},\\"selectionSet\\":{\\"kind\\":\\"SelectionSet\\",\\"selections\\":[{\\"kind\\":\\"FragmentSpread\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"MessageFields\\"}}]}}]}},{\\"kind\\":\\"FragmentDefinition\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"UserFields\\"},\\"typeCondition\\":{\\"kind\\":\\"NamedType\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"User\\"}},\\"selectionSet\\":{\\"kind\\":\\"SelectionSet\\",\\"selections\\":[{\\"kind\\":\\"Field\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"id\\"}},{\\"kind\\":\\"Field\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"username\\"}},{\\"kind\\":\\"Field\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"role\\"}},{\\"kind\\":\\"Field\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"chats\\"},\\"selectionSet\\":{\\"kind\\":\\"SelectionSet\\",\\"selections\\":[{\\"kind\\":\\"FragmentSpread\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"ChatFields\\"}}]}}]}}]}}}} as unknown as DocumentNode<FindUserQuery, FindUserQueryVariables>;"
    `);
  });

  test('gql tags with shared fragments coming from aliased modules', async () => {
    project = await createFixtures(gqlFilesMapWithAliasedPaths);

    await athenaCodegen({
      schemaPath: 'schema.graphql',
      documents: [`${project.baseDir}/**/*.tsx`],
      baseDir: project.baseDir,
      extension: '.graphql.ts',
      production: false,
      disableSchemaTypesGeneration: false,
      // This is an extremely basic example of the resolver
      // For typescript, babel or webpack aliases see the example app for more in depth examples
      resolver: (importPath, options) => {
        if (importPath === '@components/UserView.tsx') {
          return path.resolve(options.basedir, 'UserView.tsx');
        }
      },
    });

    expect(await read('schema.graphql.ts')).toMatchSnapshot();

    expect(await read('__generated/UserView.graphql.ts'))
      .toMatchInlineSnapshot(`
        "import type * as Types from '../schema.graphql.js';

        import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
        export type UserFieldsFragment = { __typename: 'User', id: string, username: string, email: string, role: Types.Role };

        export const UserFieldsFragmentDoc = {\\"kind\\":\\"Document\\",\\"definitions\\":[{\\"kind\\":\\"FragmentDefinition\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"UserFields\\"},\\"typeCondition\\":{\\"kind\\":\\"NamedType\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"User\\"}},\\"selectionSet\\":{\\"kind\\":\\"SelectionSet\\",\\"selections\\":[{\\"kind\\":\\"Field\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"id\\"}},{\\"kind\\":\\"Field\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"username\\"}},{\\"kind\\":\\"Field\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"email\\"}},{\\"kind\\":\\"Field\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"role\\"}}]}}]} as unknown as DocumentNode<UserFieldsFragment, unknown>;"
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


      export const FindUserDocument = {\\"__meta__\\":{\\"queryId\\":\\"2a3590156c3f32f68e767b1f7bb03462e515e373190ef90bfea2f9a9cbd82ddb\\",\\"$DEBUG\\":{\\"contents\\":\\"fragment UserFields on User { email id role username } query findUser($userId: ID!) { user(id: $userId) { __typename ...UserFields } }\\",\\"ast\\":{\\"kind\\":\\"Document\\",\\"definitions\\":[{\\"kind\\":\\"OperationDefinition\\",\\"operation\\":\\"query\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"findUser\\"},\\"variableDefinitions\\":[{\\"kind\\":\\"VariableDefinition\\",\\"variable\\":{\\"kind\\":\\"Variable\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"userId\\"}},\\"type\\":{\\"kind\\":\\"NonNullType\\",\\"type\\":{\\"kind\\":\\"NamedType\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"ID\\"}}}}],\\"selectionSet\\":{\\"kind\\":\\"SelectionSet\\",\\"selections\\":[{\\"kind\\":\\"Field\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"user\\"},\\"arguments\\":[{\\"kind\\":\\"Argument\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"id\\"},\\"value\\":{\\"kind\\":\\"Variable\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"userId\\"}}}],\\"selectionSet\\":{\\"kind\\":\\"SelectionSet\\",\\"selections\\":[{\\"kind\\":\\"FragmentSpread\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"UserFields\\"}},{\\"kind\\":\\"Field\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"__typename\\"}}]}}]}},{\\"kind\\":\\"FragmentDefinition\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"UserFields\\"},\\"typeCondition\\":{\\"kind\\":\\"NamedType\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"User\\"}},\\"selectionSet\\":{\\"kind\\":\\"SelectionSet\\",\\"selections\\":[{\\"kind\\":\\"Field\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"id\\"}},{\\"kind\\":\\"Field\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"username\\"}},{\\"kind\\":\\"Field\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"email\\"}},{\\"kind\\":\\"Field\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"role\\"}}]}}]}}}} as unknown as DocumentNode<FindUserQuery, FindUserQueryVariables>;"
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

        export const ChatFieldsFragmentDoc = {\\"kind\\":\\"Document\\",\\"definitions\\":[{\\"kind\\":\\"FragmentDefinition\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"ChatFields\\"},\\"typeCondition\\":{\\"kind\\":\\"NamedType\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"Chat\\"}},\\"selectionSet\\":{\\"kind\\":\\"SelectionSet\\",\\"selections\\":[{\\"kind\\":\\"Field\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"id\\"}},{\\"kind\\":\\"Field\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"users\\"},\\"selectionSet\\":{\\"kind\\":\\"SelectionSet\\",\\"selections\\":[{\\"kind\\":\\"Field\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"id\\"}},{\\"kind\\":\\"Field\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"username\\"}}]}}]}}]} as unknown as DocumentNode<ChatFieldsFragment, unknown>;
        export const FindMyChatsDocument = {\\"__meta__\\":{\\"queryId\\":\\"9a1cceea656312633d2f6890193132c1776249e695be24f6e5e2e3da8259a162\\",\\"$DEBUG\\":{\\"contents\\":\\"fragment ChatFields on Chat { id users { id username } } query findMyChats { myChats { __typename ...ChatFields } }\\",\\"ast\\":{\\"kind\\":\\"Document\\",\\"definitions\\":[{\\"kind\\":\\"OperationDefinition\\",\\"operation\\":\\"query\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"findMyChats\\"},\\"selectionSet\\":{\\"kind\\":\\"SelectionSet\\",\\"selections\\":[{\\"kind\\":\\"Field\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"myChats\\"},\\"selectionSet\\":{\\"kind\\":\\"SelectionSet\\",\\"selections\\":[{\\"kind\\":\\"FragmentSpread\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"ChatFields\\"}},{\\"kind\\":\\"Field\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"__typename\\"}}]}}]}},{\\"kind\\":\\"FragmentDefinition\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"ChatFields\\"},\\"typeCondition\\":{\\"kind\\":\\"NamedType\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"Chat\\"}},\\"selectionSet\\":{\\"kind\\":\\"SelectionSet\\",\\"selections\\":[{\\"kind\\":\\"Field\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"id\\"}},{\\"kind\\":\\"Field\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"users\\"},\\"selectionSet\\":{\\"kind\\":\\"SelectionSet\\",\\"selections\\":[{\\"kind\\":\\"Field\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"id\\"}},{\\"kind\\":\\"Field\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"username\\"}}]}}]}}]}}}} as unknown as DocumentNode<FindMyChatsQuery, FindMyChatsQueryVariables>;"
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


      export const FindUserDocument = {\\"__meta__\\":{\\"queryId\\":\\"fbb63dc6cd9b42699045d88fb71d7c15042668eec947a17f21acb655c258d031\\",\\"$DEBUG\\":{\\"contents\\":\\"fragment ChatFields on Chat { id users { id username } } query findUser($userId: ID!) { user(id: $userId) { __typename chats { __typename ...ChatFields } } }\\",\\"ast\\":{\\"kind\\":\\"Document\\",\\"definitions\\":[{\\"kind\\":\\"OperationDefinition\\",\\"operation\\":\\"query\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"findUser\\"},\\"variableDefinitions\\":[{\\"kind\\":\\"VariableDefinition\\",\\"variable\\":{\\"kind\\":\\"Variable\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"userId\\"}},\\"type\\":{\\"kind\\":\\"NonNullType\\",\\"type\\":{\\"kind\\":\\"NamedType\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"ID\\"}}}}],\\"selectionSet\\":{\\"kind\\":\\"SelectionSet\\",\\"selections\\":[{\\"kind\\":\\"Field\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"user\\"},\\"arguments\\":[{\\"kind\\":\\"Argument\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"id\\"},\\"value\\":{\\"kind\\":\\"Variable\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"userId\\"}}}],\\"selectionSet\\":{\\"kind\\":\\"SelectionSet\\",\\"selections\\":[{\\"kind\\":\\"Field\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"chats\\"},\\"selectionSet\\":{\\"kind\\":\\"SelectionSet\\",\\"selections\\":[{\\"kind\\":\\"FragmentSpread\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"ChatFields\\"}},{\\"kind\\":\\"Field\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"__typename\\"}}]}},{\\"kind\\":\\"Field\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"__typename\\"}}]}}]}},{\\"kind\\":\\"FragmentDefinition\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"ChatFields\\"},\\"typeCondition\\":{\\"kind\\":\\"NamedType\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"Chat\\"}},\\"selectionSet\\":{\\"kind\\":\\"SelectionSet\\",\\"selections\\":[{\\"kind\\":\\"Field\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"id\\"}},{\\"kind\\":\\"Field\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"users\\"},\\"selectionSet\\":{\\"kind\\":\\"SelectionSet\\",\\"selections\\":[{\\"kind\\":\\"Field\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"id\\"}},{\\"kind\\":\\"Field\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"username\\"}}]}}]}}]}}}} as unknown as DocumentNode<FindUserQuery, FindUserQueryVariables>;"
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


      export const FindUserDocument = {\\"__meta__\\":{\\"queryId\\":\\"fbb63dc6cd9b42699045d88fb71d7c15042668eec947a17f21acb655c258d031\\",\\"$DEBUG\\":{\\"contents\\":\\"fragment ChatFields on Chat { id users { id username } } query findUser($userId: ID!) { user(id: $userId) { __typename chats { __typename ...ChatFields } } }\\",\\"ast\\":{\\"kind\\":\\"Document\\",\\"definitions\\":[{\\"kind\\":\\"OperationDefinition\\",\\"operation\\":\\"query\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"findUser\\"},\\"variableDefinitions\\":[{\\"kind\\":\\"VariableDefinition\\",\\"variable\\":{\\"kind\\":\\"Variable\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"userId\\"}},\\"type\\":{\\"kind\\":\\"NonNullType\\",\\"type\\":{\\"kind\\":\\"NamedType\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"ID\\"}}}}],\\"selectionSet\\":{\\"kind\\":\\"SelectionSet\\",\\"selections\\":[{\\"kind\\":\\"Field\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"user\\"},\\"arguments\\":[{\\"kind\\":\\"Argument\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"id\\"},\\"value\\":{\\"kind\\":\\"Variable\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"userId\\"}}}],\\"selectionSet\\":{\\"kind\\":\\"SelectionSet\\",\\"selections\\":[{\\"kind\\":\\"Field\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"chats\\"},\\"selectionSet\\":{\\"kind\\":\\"SelectionSet\\",\\"selections\\":[{\\"kind\\":\\"FragmentSpread\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"ChatFields\\"}},{\\"kind\\":\\"Field\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"__typename\\"}}]}},{\\"kind\\":\\"Field\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"__typename\\"}}]}}]}},{\\"kind\\":\\"FragmentDefinition\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"ChatFields\\"},\\"typeCondition\\":{\\"kind\\":\\"NamedType\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"Chat\\"}},\\"selectionSet\\":{\\"kind\\":\\"SelectionSet\\",\\"selections\\":[{\\"kind\\":\\"Field\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"id\\"}},{\\"kind\\":\\"Field\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"users\\"},\\"selectionSet\\":{\\"kind\\":\\"SelectionSet\\",\\"selections\\":[{\\"kind\\":\\"Field\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"id\\"}},{\\"kind\\":\\"Field\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"username\\"}}]}}]}}]}}}} as unknown as DocumentNode<FindUserQuery, FindUserQueryVariables>;"
    `);
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
      primaryKeyAlias: {
        primaryKey: 'entityUrn',
        fields: {
          Profile: 'profileUrn',
        },
      },
    });

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

        export const ChatFieldsFragmentDoc = {\\"kind\\":\\"Document\\",\\"definitions\\":[{\\"kind\\":\\"FragmentDefinition\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"ChatFields\\"},\\"typeCondition\\":{\\"kind\\":\\"NamedType\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"Chat\\"}},\\"selectionSet\\":{\\"kind\\":\\"SelectionSet\\",\\"selections\\":[{\\"kind\\":\\"Field\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"__typename\\"}},{\\"kind\\":\\"Field\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"id\\"}},{\\"kind\\":\\"Field\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"users\\"},\\"selectionSet\\":{\\"kind\\":\\"SelectionSet\\",\\"selections\\":[{\\"kind\\":\\"Field\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"__typename\\"}},{\\"kind\\":\\"Field\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"id\\"}},{\\"kind\\":\\"Field\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"username\\"}}]}}]}}]} as unknown as DocumentNode<ChatFieldsFragment, unknown>;
        export const FindMyChatsDocument = {\\"__meta__\\":{\\"queryId\\":\\"b6b7acb7f4d21f51d98d3e7dec07fc83f97fc66d1af2c52bcae4e65b0db7416d\\",\\"$DEBUG\\":{\\"contents\\":\\"fragment ChatFields on Chat { __typename id users { __typename id username } } query findMyChats { __typename myChats { __typename ...ChatFields } }\\",\\"ast\\":{\\"kind\\":\\"Document\\",\\"definitions\\":[{\\"kind\\":\\"OperationDefinition\\",\\"operation\\":\\"query\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"findMyChats\\"},\\"selectionSet\\":{\\"kind\\":\\"SelectionSet\\",\\"selections\\":[{\\"kind\\":\\"Field\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"__typename\\"}},{\\"kind\\":\\"Field\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"myChats\\"},\\"selectionSet\\":{\\"kind\\":\\"SelectionSet\\",\\"selections\\":[{\\"kind\\":\\"Field\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"__typename\\"}},{\\"kind\\":\\"FragmentSpread\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"ChatFields\\"}}]}}]}},{\\"kind\\":\\"FragmentDefinition\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"ChatFields\\"},\\"typeCondition\\":{\\"kind\\":\\"NamedType\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"Chat\\"}},\\"selectionSet\\":{\\"kind\\":\\"SelectionSet\\",\\"selections\\":[{\\"kind\\":\\"Field\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"__typename\\"}},{\\"kind\\":\\"Field\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"id\\"}},{\\"kind\\":\\"Field\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"users\\"},\\"selectionSet\\":{\\"kind\\":\\"SelectionSet\\",\\"selections\\":[{\\"kind\\":\\"Field\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"__typename\\"}},{\\"kind\\":\\"Field\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"id\\"}},{\\"kind\\":\\"Field\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"username\\"}}]}}]}}]}}}} as unknown as DocumentNode<FindMyChatsQuery, FindMyChatsQueryVariables>;"
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


      export const FindUserDocument = {\\"__meta__\\":{\\"queryId\\":\\"1405a050d19cb6e071cc5645a34381fde882f2d981cd5c1fdcd702b354c2fe9c\\",\\"$DEBUG\\":{\\"contents\\":\\"fragment ChatFields on Chat { __typename id users { __typename id username } } query findUser($userId: ID!) { __typename user(id: $userId) { __typename chats { __typename ...ChatFields } } }\\",\\"ast\\":{\\"kind\\":\\"Document\\",\\"definitions\\":[{\\"kind\\":\\"OperationDefinition\\",\\"operation\\":\\"query\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"findUser\\"},\\"variableDefinitions\\":[{\\"kind\\":\\"VariableDefinition\\",\\"variable\\":{\\"kind\\":\\"Variable\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"userId\\"}},\\"type\\":{\\"kind\\":\\"NonNullType\\",\\"type\\":{\\"kind\\":\\"NamedType\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"ID\\"}}}}],\\"selectionSet\\":{\\"kind\\":\\"SelectionSet\\",\\"selections\\":[{\\"kind\\":\\"Field\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"__typename\\"}},{\\"kind\\":\\"Field\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"user\\"},\\"arguments\\":[{\\"kind\\":\\"Argument\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"id\\"},\\"value\\":{\\"kind\\":\\"Variable\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"userId\\"}}}],\\"selectionSet\\":{\\"kind\\":\\"SelectionSet\\",\\"selections\\":[{\\"kind\\":\\"Field\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"__typename\\"}},{\\"kind\\":\\"Field\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"chats\\"},\\"selectionSet\\":{\\"kind\\":\\"SelectionSet\\",\\"selections\\":[{\\"kind\\":\\"Field\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"__typename\\"}},{\\"kind\\":\\"FragmentSpread\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"ChatFields\\"}}]}}]}}]}},{\\"kind\\":\\"FragmentDefinition\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"ChatFields\\"},\\"typeCondition\\":{\\"kind\\":\\"NamedType\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"Chat\\"}},\\"selectionSet\\":{\\"kind\\":\\"SelectionSet\\",\\"selections\\":[{\\"kind\\":\\"Field\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"__typename\\"}},{\\"kind\\":\\"Field\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"id\\"}},{\\"kind\\":\\"Field\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"users\\"},\\"selectionSet\\":{\\"kind\\":\\"SelectionSet\\",\\"selections\\":[{\\"kind\\":\\"Field\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"__typename\\"}},{\\"kind\\":\\"Field\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"id\\"}},{\\"kind\\":\\"Field\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"username\\"}}]}}]}}]}}}} as unknown as DocumentNode<FindUserQuery, FindUserQueryVariables>;"
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


      export const FindUserDocument = {\\"__meta__\\":{\\"queryId\\":\\"1405a050d19cb6e071cc5645a34381fde882f2d981cd5c1fdcd702b354c2fe9c\\",\\"$DEBUG\\":{\\"contents\\":\\"fragment ChatFields on Chat { __typename id users { __typename id username } } query findUser($userId: ID!) { __typename user(id: $userId) { __typename chats { __typename ...ChatFields } } }\\",\\"ast\\":{\\"kind\\":\\"Document\\",\\"definitions\\":[{\\"kind\\":\\"OperationDefinition\\",\\"operation\\":\\"query\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"findUser\\"},\\"variableDefinitions\\":[{\\"kind\\":\\"VariableDefinition\\",\\"variable\\":{\\"kind\\":\\"Variable\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"userId\\"}},\\"type\\":{\\"kind\\":\\"NonNullType\\",\\"type\\":{\\"kind\\":\\"NamedType\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"ID\\"}}}}],\\"selectionSet\\":{\\"kind\\":\\"SelectionSet\\",\\"selections\\":[{\\"kind\\":\\"Field\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"__typename\\"}},{\\"kind\\":\\"Field\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"user\\"},\\"arguments\\":[{\\"kind\\":\\"Argument\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"id\\"},\\"value\\":{\\"kind\\":\\"Variable\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"userId\\"}}}],\\"selectionSet\\":{\\"kind\\":\\"SelectionSet\\",\\"selections\\":[{\\"kind\\":\\"Field\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"__typename\\"}},{\\"kind\\":\\"Field\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"chats\\"},\\"selectionSet\\":{\\"kind\\":\\"SelectionSet\\",\\"selections\\":[{\\"kind\\":\\"Field\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"__typename\\"}},{\\"kind\\":\\"FragmentSpread\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"ChatFields\\"}}]}}]}}]}},{\\"kind\\":\\"FragmentDefinition\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"ChatFields\\"},\\"typeCondition\\":{\\"kind\\":\\"NamedType\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"Chat\\"}},\\"selectionSet\\":{\\"kind\\":\\"SelectionSet\\",\\"selections\\":[{\\"kind\\":\\"Field\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"__typename\\"}},{\\"kind\\":\\"Field\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"id\\"}},{\\"kind\\":\\"Field\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"users\\"},\\"selectionSet\\":{\\"kind\\":\\"SelectionSet\\",\\"selections\\":[{\\"kind\\":\\"Field\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"__typename\\"}},{\\"kind\\":\\"Field\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"id\\"}},{\\"kind\\":\\"Field\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"username\\"}}]}}]}}]}}}} as unknown as DocumentNode<FindUserQuery, FindUserQueryVariables>;"
    `);
  });

  // TODO: import fragment from foo.graphql inside a .tsx
  // TODO: import fragment from foo.tsx inside a .graphql
  // TODO: catch throw when multiple things are defined in one gql tag
});
