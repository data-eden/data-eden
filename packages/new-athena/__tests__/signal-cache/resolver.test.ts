import { describe, expect, test } from 'vitest';
import { SignalCache } from '../../src/index.js';

interface Pet {
  id: string;
  name: string;
  __typename: 'Pet';
}

describe('SignalCache#resolvers', () => {
  let cache: SignalCache;

  test('can transform an existing field', () => {
    cache = new SignalCache({
      resolvers: {
        Pet: {
          name: (parent) => {
            return (parent as unknown as Pet).name.toUpperCase();
          },
        },
      },
    });

    cache.storeEntity('Pet:1', {
      id: '1',
      __typename: 'Pet',
      name: 'hitch',
    });

    const result = cache.resolve('Pet:1');

    expect(result).toMatchInlineSnapshot(`
      {
        "__typename": "Pet",
        "id": "1",
        "name": "HITCH",
      }
    `);
  });

  test('can add a virtual field', () => {
    cache = new SignalCache({
      resolvers: {
        Pet: {
          nameLength: (parent) => {
            return (parent as unknown as Pet).name.length;
          },
        },
      },
    });

    cache.storeEntity('Pet:1', {
      id: '1',
      __typename: 'Pet',
      name: 'hitch',
    });

    const result = cache.resolve('Pet:1');

    expect(result).toMatchInlineSnapshot(`
      {
        "__typename": "Pet",
        "id": "1",
        "name": "hitch",
        "nameLength": 5,
      }
    `);
  });
});
