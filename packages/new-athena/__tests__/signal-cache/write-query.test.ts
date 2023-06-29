import { beforeEach, describe, expect, test } from 'vitest';
import { Operation, SignalCache } from '../../src/index.js';

describe('SignalCache#writeQuery', () => {
  let cache: SignalCache;

  beforeEach(() => {
    cache = new SignalCache();
  });

  test('basic operation', async () => {
    const op: Operation = {
      name: 'getPerson',
      queryId: '1234',
      type: 'query',
      args: {
        id: '1',
      },
      result: {
        data: {
          __typename: 'Query',
          person: {
            id: '1',
            name: 'Bob',
            __typename: 'Person',
          },
        },
      },
    };

    await cache.writeQuery(op);

    expect(cache.links).toMatchInlineSnapshot(`
        Map {
          "Person:1" => {},
          "query:1234({\\"id\\":\\"1\\"})" => {
            "person": "Person:1",
          },
        }
      `);
    expect(cache.records).toMatchInlineSnapshot(`
        Map {
          "Person:1" => {
            "__typename": "Person",
            "id": "1",
            "name": "Bob",
          },
          "query:1234({\\"id\\":\\"1\\"})" => {
            "__typename": "Query",
          },
        }
      `);
  });
});
