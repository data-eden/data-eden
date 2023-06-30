import { beforeEach, describe, expect, test } from 'vitest';
import { Operation, SignalCache } from '../../src/index.js';

describe('SignalCache#resolve', () => {
  let cache: SignalCache;

  beforeEach(() => {
    cache = new SignalCache();
  });

  test('basic', async () => {
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

    const result = cache.readQuery(op);

    expect(result).toMatchInlineSnapshot(`
      {
        "__typename": "Query",
        "person": {
          "__typename": "Person",
          "id": "1",
          "name": "Bob",
        },
      }
    `);
  });
});
