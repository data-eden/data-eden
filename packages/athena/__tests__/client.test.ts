import {
  describe,
  test,
  expect,
  beforeEach,
  beforeAll,
  afterAll,
  afterEach,
} from 'vitest';
import http from 'http';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { createServer } from '@data-eden/shared-test-utilities';

import { createSignal } from '@signalis/core';

import { gql } from '@data-eden/codegen/gql';
import { Mocker } from '@data-eden/mocker';

import { type PeopleQuery } from './__generated/client.test.graphql';
import { AthenaClient } from '../src/client.js';
import type { ReactiveSignal } from '../src/types.js';

const schema = readFileSync(
  resolve(
    __dirname,
    '..',
    '..',
    '..',
    'internal-packages/react-graphql-test-app/src/graphql/schema.graphql'
  ),
  'utf8'
);

const peopleQuery = gql<PeopleQuery>`
  query people {
    people {
      id
      name
    }
  }
`;

function adapter<T>(v: T): ReactiveSignal<T> {
  return createSignal(v, false);
}

type Entity = {
  __typename: string;
  id: string;
};

const mocker = new Mocker({
  schema,
});

describe('client', () => {
  describe('processEntities', () => {
    let client: AthenaClient;

    beforeEach((test) => {
      client = new AthenaClient({
        url: '/example',
        adapter: adapter,
        getCacheKey: (v: Entity, parent: Entity) => {
          if (v.id) {
            return `${v.__typename}:${v?.id}`;
          }
        },
      });
    });

    test('parses a single entity', async () => {
      const document = {
        person: {
          id: '1',
          name: 'foo',
          __typename: 'Person',
        },
      };

      const result = await client.processEntities(document);

      expect(result).toMatchInlineSnapshot(`
        {
          "person": {
            "__typename": "Person",
            "id": "1",
            "name": "foo",
          },
        }
      `);
    });

    test('parses an entity with a nested entity', async () => {
      const document = {
        person: {
          id: '1',
          name: 'foo',
          __typename: 'Person',
          car: {
            id: '1',
            make: 'Ford',
            model: 'Mustang',
            __typename: 'Car',
          },
        },
      };

      const result = await client.processEntities(document);

      expect(result).toMatchInlineSnapshot(`
        {
          "person": {
            "__typename": "Person",
            "car": {
              "__typename": "Car",
              "id": "1",
              "make": "Ford",
              "model": "Mustang",
            },
            "id": "1",
            "name": "foo",
          },
        }
      `);
    });

    test('parses an entity with an array of nested entities', async () => {
      const document = {
        person: {
          id: '1',
          name: 'foo',
          __typename: 'Person',
          pets: [
            {
              id: '1',
              name: 'Hitch',
              __typename: 'Pet',
            },
            {
              id: '2',
              name: 'Dre',
              __typename: 'Pet',
            },
          ],
        },
      };

      const result = await client.processEntities(document);

      expect(result).toMatchInlineSnapshot(`
        {
          "person": {
            "__typename": "Person",
            "id": "1",
            "name": "foo",
            "pets": [
              {
                "__typename": "Pet",
                "id": "1",
                "name": "Hitch",
              },
              {
                "__typename": "Pet",
                "id": "2",
                "name": "Dre",
              },
            ],
          },
        }
      `);
    });

    test('parses a document with two sibling entities', async () => {
      const document = {
        person: {
          id: '1',
          name: 'foo',
          __typename: 'Person',
        },
        car: {
          id: '1',
          make: 'Ford',
          model: 'Mustang',
          __typename: 'Car',
        },
      };

      const result = await client.processEntities(document);

      expect(result).toMatchInlineSnapshot(`
        {
          "car": {
            "__typename": "Car",
            "id": "1",
            "make": "Ford",
            "model": "Mustang",
          },
          "person": {
            "__typename": "Person",
            "id": "1",
            "name": "foo",
          },
        }
      `);
    });

    test('parses a document with an array of entities at the root', async () => {
      const document = {
        someOperation: [
          {
            id: '1',
            name: 'foo',
            __typename: 'Person',
          },
          {
            id: '1',
            make: 'Ford',
            model: 'Mustang',
            __typename: 'Car',
          },
        ],
      };

      const result = await client.processEntities(document);

      expect(result).toMatchInlineSnapshot(`
        {
          "someOperation": [
            {
              "__typename": "Person",
              "id": "1",
              "name": "foo",
            },
            {
              "__typename": "Car",
              "id": "1",
              "make": "Ford",
              "model": "Mustang",
            },
          ],
        }
      `);
    });

    test('resolves all links in an array where the entities have the same link', async () => {
      const document = {
        foo: {
          id: '1',
          __typename: 'Foo',
          comments: [
            {
              id: '1',
              __typename: 'Comment',
              message: 'first comment',
              author: {
                id: '1',
                __typename: 'Author',
                name: 'Foo',
              },
            },
            {
              id: '2',
              __typename: 'Comment',
              message: 'second comment',
              author: {
                id: '1',
                __typename: 'Author',
                name: 'Foo',
              },
            },
            {
              id: '3',
              __typename: 'Comment',
              message: 'third comment',
              author: {
                id: '1',
                __typename: 'Author',
                name: 'Foo',
              },
            },
            {
              id: '4',
              __typename: 'Comment',
              message: 'fourth comment',
              author: {
                id: '1',
                __typename: 'Author',
                name: 'Foo',
              },
            },
          ],
        },
      };

      const result = await client.processEntities(document);

      expect(result).toMatchInlineSnapshot(`
        {
          "foo": {
            "__typename": "Foo",
            "comments": [
              {
                "__typename": "Comment",
                "author": {
                  "__typename": "Author",
                  "id": "1",
                  "name": "Foo",
                },
                "id": "1",
                "message": "first comment",
              },
              {
                "__typename": "Comment",
                "author": {
                  "__typename": "Author",
                  "id": "1",
                  "name": "Foo",
                },
                "id": "2",
                "message": "second comment",
              },
              {
                "__typename": "Comment",
                "author": {
                  "__typename": "Author",
                  "id": "1",
                  "name": "Foo",
                },
                "id": "3",
                "message": "third comment",
              },
              {
                "__typename": "Comment",
                "author": {
                  "__typename": "Author",
                  "id": "1",
                  "name": "Foo",
                },
                "id": "4",
                "message": "fourth comment",
              },
            ],
            "id": "1",
          },
        }
      `);
    });

    test('should be able to handle entities with no cacheable nested values', async () => {
      const document = {
        paginatedCommentsPage: {
          threadUrn: 'urn:li:activity:7070125034782027776',
          id: 'urn:li:activity:7070125034782027776',
          comments: [
            {
              socialMetadata: {
                reactionSummaries: [
                  {
                    count: 1,
                    type: 'APPRECIATION',
                    __typename: 'ReactionSummary',
                  },
                ],
                id: 'urn:li:comment:(activity:7070125034782027776,7071631601935249410)',
                viewerReaction: {
                  type: 'APPRECIATION',
                },
                commentSummary: {
                  count: 0,
                },
                __typename: 'SocialMetadata',
              },
              createdAt: 1686008358464,
              id: 'urn:li:comment:(urn:li:activity:7070125034782027776,7071631601935249410)',
              author: {
                firstName: 'Bob',
                lastName: 'Bobberson',
                profilePicture: {
                  url: 'https://media.licdn.com/dms/image/C5603AQGjVp-oZT1bnw/profile-displayphoto-shrink_400_400/0/1561741260600?e=1692835200&v=beta&t=kUlBHG3Fe5z4ao2vgCyP8DVR6nERCy4fTXxAnCxo9F8',
                },
                id: 'urn:li:member:655184127',
                profileCanonicalUrl: {
                  url: 'https://www.linkedin.com/in/bob-bobberson',
                },
                __typename: 'Profile',
                memberUrn: 'urn:li:member:655184127',
                networkDistance: {
                  distance: 'SELF',
                },
                headline: 'Code Janitor at LinkedIn',
              },
              __typename: 'Comment',
              media: [],
              message: [
                {
                  __typename: 'AttributedTextSegment',
                  text: "hello again'",
                },
              ],
            },
          ],
          __typename: 'PaginatedCommentsPage',
        },
      };

      const result = await client.processEntities(document);

      expect(
        result.paginatedCommentsPage.comments[0].socialMetadata
          .reactionSummaries[0].type
      ).toEqual('APPRECIATION');
      expect(
        result.paginatedCommentsPage.comments[0].socialMetadata
          .reactionSummaries[0].count
      ).toEqual(1);
      expect(
        result.paginatedCommentsPage.comments[0].socialMetadata.viewerReaction
          .type
      ).toEqual('APPRECIATION');

      await client.processEntities({
        toggleSocialReaction: {
          socialMetadata: {
            reactionSummaries: [
              {
                count: 1,
                type: 'INTEREST',
                __typename: 'ReactionSummary',
              },
            ],
            id: 'urn:li:comment:(activity:7070125034782027776,7071631601935249410)',
            viewerReaction: {
              type: 'INTEREST',
              __typename: 'Reaction',
            },
            commentSummary: {
              count: 0,
              __typename: 'CommentSummary',
            },
            __typename: 'SocialMetadata',
          },
          __typename: 'ToggleSocialReactionResult',
          responseCode: 'OK_200',
        },
      });

      expect(
        result.paginatedCommentsPage.comments[0].socialMetadata
          .reactionSummaries[0].type
      ).toEqual('INTEREST');
      expect(
        result.paginatedCommentsPage.comments[0].socialMetadata.viewerReaction
          .type
      ).toEqual('INTEREST');
    });
  });

  describe('query', async () => {
    const server = await createServer();

    beforeAll(async () => await server.listen());
    afterEach(() => server.reset());
    afterAll(() => server.close());

    test('should be able to query a basic endpoint', async () => {
      const client = new AthenaClient({
        url: server.buildUrl('/graphql'),
        adapter: adapter,
        getCacheKey: (v: Entity, parent: Entity) => {
          if (v.id) {
            return `${v.__typename}:${v?.id}`;
          }
        },
      });

      server.post(
        '/graphql',
        async (
          request: http.IncomingMessage,
          response: http.ServerResponse
        ) => {
          response.writeHead(200, { 'Content-Type': 'application/json' });
          response.end(
            JSON.stringify({
              data: await mocker.mock(peopleQuery, {
                people: [
                  {
                    id: 12,
                    name: 'Bob',
                  },
                ],
              }),
            })
          );
        }
      );

      const { data, error } = await client.query(peopleQuery, {});

      expect(error).toBeUndefined();
      expect(data).toMatchInlineSnapshot(`
        {
          "people": [
            {
              "__typename": "Person",
              "id": 12,
              "name": "Bob",
            },
          ],
        }
      `);
    });
  });
});
