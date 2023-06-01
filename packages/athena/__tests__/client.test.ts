import { describe, test, expect, beforeEach } from 'vitest';
import { AthenaClient } from '../src/client.js';

import { createSignal } from '@signalis/core';
import type { ReactiveSignal } from '../src/types.js';

function adapter<T>(v: T): ReactiveSignal<T> {
  return createSignal(v, false);
}

describe('client', () => {
  let client: AthenaClient;

  beforeEach((test) => {
    client = new AthenaClient({
      url: '/example',
      adapter: adapter,
      id: (v: any) => {
        return `${v.__typename}:${v.id}`;
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
  });
});
