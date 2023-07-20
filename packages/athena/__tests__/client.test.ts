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
import { prepareOperation } from '../src/utils';

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
        getCacheKey: (v: Entity) => {
          if (v?.id) {
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
                  __typename: 'Reaction',
                },
                commentSummary: {
                  count: 0,
                  __typename: 'CommentSummary',
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
              count: 1,
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

      await client.processEntities({
        toggleSocialReaction: {
          socialMetadata: {
            reactionSummaries: [],
            id: 'urn:li:comment:(activity:7070125034782027776,7071631601935249410)',
            commentSummary: {
              count: 1,
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
          .reactionSummaries
      ).toEqual([]);
    });

    test('should be able to handle nested entites that are managed on entites that are not managed', async () => {
      const result = await client.processEntities({
        reactionsPage: {
          id: 'urn:li:reactions:12345678954',
          reactions: [
            {
              actor: {
                firstName: 'Bob',
                lastName: 'Bobberson',
                profilePicture: {
                  url: 'https://media.licdn.com/dms/image/C5603AQGjVp-oZT1bnw/profile-displayphoto-shrink_400_400/0/1561741260600?e=1693440000&v=beta&t=YAiJc0lInvPXvlUuohhyC0oZJ9trFc3hfE8F21CIMkI',
                  __typename: 'Asset',
                },
                id: 'urn:li:member:655184127',
                profileCanonicalUrl: {
                  url: 'https://www.linkedin.com/in/bob-bobberson',
                  __typename: 'ProfileCanonicalUrl',
                },
                __typename: 'Profile',
              },
              type: 'EMPATHY',
              __typename: 'Reaction',
            },
            {
              actor: {
                firstName: 'Chris',
                lastName: 'Freeman',
                profilePicture: {
                  url: 'https://media.licdn.com/dms/image/D5603AQE1vYzjTXjiRA/profile-displayphoto-shrink_400_400/0/1664897400696?e=1693440000&v=beta&t=Lj5VkKd3h-6AQQSNeIPtPDfELpEMUE8QEdxT4D0ll8c',
                  __typename: 'Asset',
                },
                id: 'urn:li:member:96146350',
                profileCanonicalUrl: {
                  url: 'https://www.linkedin.com/in/chris-freeman-2ba24828',
                  __typename: 'ProfileCanonicalUrl',
                },
                __typename: 'Profile',
              },
              type: 'LIKE',
              __typename: 'Reaction',
            },
          ],
          socialMetadata: {
            reactionSummaries: [
              {
                count: 1,
                type: 'LIKE',
                __typename: 'ReactionSummary',
              },
              {
                count: 1,
                type: 'EMPATHY',
                __typename: 'ReactionSummary',
              },
            ],
          },
          __typename: 'ReactionsPage',
        },
      });

      expect(result.reactionsPage.reactions[0].actor).not.toEqual({
        __link: 'Profile:urn:li:member:655184127',
      });
    });
  });

  describe('prepareOperation', async () => {
    test('should be able to prepare a dev operation', async () => {
      expect(prepareOperation(peopleQuery, {})).toMatchInlineSnapshot(`
              {
                "fetchMore": false,
                "query": {
                  "definitions": [
                    {
                      "directives": [],
                      "kind": "OperationDefinition",
                      "loc": {
                        "end": 46,
                        "start": 0,
                      },
                      "name": {
                        "kind": "Name",
                        "loc": {
                          "end": 12,
                          "start": 6,
                        },
                        "value": "people",
                      },
                      "operation": "query",
                      "selectionSet": {
                        "kind": "SelectionSet",
                        "loc": {
                          "end": 46,
                          "start": 13,
                        },
                        "selections": [
                          {
                            "alias": undefined,
                            "arguments": [],
                            "directives": [],
                            "kind": "Field",
                            "loc": {
                              "end": 44,
                              "start": 15,
                            },
                            "name": {
                              "kind": "Name",
                              "loc": {
                                "end": 21,
                                "start": 15,
                              },
                              "value": "people",
                            },
                            "selectionSet": {
                              "kind": "SelectionSet",
                              "loc": {
                                "end": 44,
                                "start": 22,
                              },
                              "selections": [
                                {
                                  "alias": undefined,
                                  "arguments": [],
                                  "directives": [],
                                  "kind": "Field",
                                  "loc": {
                                    "end": 34,
                                    "start": 24,
                                  },
                                  "name": {
                                    "kind": "Name",
                                    "loc": {
                                      "end": 34,
                                      "start": 24,
                                    },
                                    "value": "__typename",
                                  },
                                  "selectionSet": undefined,
                                },
                                {
                                  "alias": undefined,
                                  "arguments": [],
                                  "directives": [],
                                  "kind": "Field",
                                  "loc": {
                                    "end": 37,
                                    "start": 35,
                                  },
                                  "name": {
                                    "kind": "Name",
                                    "loc": {
                                      "end": 37,
                                      "start": 35,
                                    },
                                    "value": "id",
                                  },
                                  "selectionSet": undefined,
                                },
                                {
                                  "alias": undefined,
                                  "arguments": [],
                                  "directives": [],
                                  "kind": "Field",
                                  "loc": {
                                    "end": 42,
                                    "start": 38,
                                  },
                                  "name": {
                                    "kind": "Name",
                                    "loc": {
                                      "end": 42,
                                      "start": 38,
                                    },
                                    "value": "name",
                                  },
                                  "selectionSet": undefined,
                                },
                              ],
                            },
                          },
                        ],
                      },
                      "variableDefinitions": [],
                    },
                  ],
                  "kind": "Document",
                  "loc": {
                    "end": 46,
                    "start": 0,
                  },
                },
                "variables": {},
              }
            `);
    });

    test('should be able to prepare a dev operation (when we do not have debug when doing a prod build)', async () => {
      const prodOperation = JSON.parse(JSON.stringify(peopleQuery)) as any;
      delete prodOperation.__meta__.$DEBUG;
      expect(prepareOperation(prodOperation, {})).toMatchInlineSnapshot(`
        {
          "extensions": {
            "persistedQuery": {
              "sha256Hash": "d7b9cf6b8c7aa35f23d42a522f0af780a5768c142ea16ae7f37aa95a741b970d",
              "version": 1,
            },
          },
          "fetchMore": false,
          "variables": {},
        }
      `);
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
        getCacheKey: (v: Entity) => {
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
              data: mocker.mock(peopleQuery, {
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
