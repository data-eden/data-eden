import { describe, it, expect } from 'vitest';
// TODO: add a tests tsconfig so we can import properly
import { buildCache } from '@data-eden/cache';

// TODO: add tests for types

describe('@data-eden/cache', function () {
  describe('with no user registry', function () {
    it('can be built', async function () {
      // TODO: this valid call fails if we switch module resolution to node16
      // see #36
      let cache = buildCache();

      expect(await cache.get('missing-key')).toBeUndefined();
    });

    it('can load serialized values', async function () {
      let cache = buildCache();
      // without a serializer, cache.load assumes serialized entries have values that are structured-cloneable
      // TODO: update to put these in the LRU
      await cache.load([
        ['book:1', { title: 'A History of the English speaking peoples' }],
        ['book:2', { title: 'Marlborough: his life and times' }],
      ]);

      let book1 = await cache.get('book:1');
      expect(book1).toMatchInlineSnapshot(`
        {
          "title": "A History of the English speaking peoples",
        }
      `);
    });

    // TODO: test entries (load then for of cache.entries)
    // TODO: test cache iterator (load then for of cache)
    // TODO: test keys iterator
    // TODO: test values iterator

    // TODO: test clear (load, get, clear, get)

    // TODO: test save (with values, save then clear, then load, values should be restored)

    // transaction testing ----------------
    // TODO: test transactions

    // memory testing -------------------
    // TODO: test lru (unit test lru)
    // TODO: test ttl?

    // TODO: --expose-gc + setTimeout global.gc() + another setTimeout() + assert weakly held things are cleaned up
  });

  describe('with a user registry', function () {
    // let cache = buildCache<UserRegistry>()
    // see https:/tsplay.dev/NrnDlN
    // TODO: try to test the types with expect-type
    it('can be built', function () {});
  });

  describe('with a user registry and user extension data', function () {
    it('can be built', function () {});
  });
});
