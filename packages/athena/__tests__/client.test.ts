import { describe, test, expect, beforeEach } from 'vitest';
import { AthenaClient } from '../src/client.js';

import { createSignal } from '@signalis/core';
import type { ReactiveSignal } from '../src/types.js';

function adapter<T>(v: T): ReactiveSignal<T> {
  return createSignal(v, false);
}

type Entity = {
  __typename: string;
  id: string;
};

function hashCode(str: string) {
  let hash = 0;
  for (let i = 0, len = str.length; i < len; i++) {
    let chr = str.charCodeAt(i);
    // eslint-disable-next-line no-bitwise
    hash = (hash << 5) - hash + chr;
    // eslint-disable-next-line no-bitwise
    hash |= 0; // Convert to 32bit integer
  }
  return hash.toString();
}

describe('client', () => {
  let client: AthenaClient;

  beforeEach((test) => {
    client = new AthenaClient({
      url: '/example',
      adapter: adapter,
      getCacheKey: (v: Entity, parent: Entity) => {
        return `${v.__typename}:${(
          v?.id ?? hashCode(JSON.stringify({ ...v, parent: parent?.id }))
        ).replace(/:/g, '&')}`;
      },
    });
  });

  describe('processEntities', () => {
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
            ],
            "id": "1",
          },
        }
      `);
    });
  });
});
