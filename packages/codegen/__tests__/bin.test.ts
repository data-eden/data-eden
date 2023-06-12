import type { Project } from 'fixturify-project';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { describe, expect, test } from 'vitest';
import { createFixtures, graphqlFilesMap } from './utils/project.js';

import { binMain } from '../src/bin';

describe('bin', () => {
  let project: Project;

  async function read(relativePath: string) {
    return await fs.readFile(path.join(project.baseDir, relativePath), 'utf-8');
  }

  test('with graphql files (with config)', async () => {
    project = await createFixtures({
      ...graphqlFilesMap,
      ...{
        '.dataedenrc.js': `
            module.exports = {
                schemaPath: 'schema.graphql',
                documents: ['./**/*.graphql'],
                extension: '.graphql.ts',
                disableSchemaTypesGeneration: false,
                production: false
            }
        `,
      },
    });

    // TODO: fix eslint config
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    await binMain({
      ...process,
      ...{
        argv: Object.assign(process.argv, [
          '.volta/tools/image/node/18.13.0/bin/node',
          './node_modules/.bin/athena-codegen',
          '--project-root',
          project.baseDir,
          '--base-dir',
          project.baseDir,
          '--production',
          true,
        ]),
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


        export const ChatsDocument = {\\"__meta__\\":{\\"queryId\\":\\"a0cd151991e13b081cc250bf42218547f2c8e340282b90c1f7fe36c332de3416\\"}} as unknown as DocumentNode<ChatsQuery, ChatsQueryVariables>;"
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
});
