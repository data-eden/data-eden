import { describe, it, expect } from 'vitest';
// TODO: add a tests tsconfig so we can import properly
import { buildCache } from '../src/index';

// TODO: add tests for types

describe('@data-eden/cache', function() {
  describe('with no user registry', function() {
    it('can be built', async function() {
      // TODO: this valid call fails if we switch module resolution to node16
      // see #36
      let cache = buildCache();

      expect(await cache.get('missing-key')).toBeUndefined();
    });

    it('can load serialized values', async function() {
      let cache = buildCache();
      // without a serializer, cache.load assumes serialized entries have values that are structured-cloneable
      await cache.load([
        ['book:1', { title: 'A History of the English speaking peoples' }],
        ['book:2', { title: 'Marlborough: his life and times' }],
      ]);

      let book1 = await cache.get('book:1');
      expect(book1).toMatchInlineSnapshot('Object {title: ""}');
    });
  });

  describe('with a user registry', function() {
    it('can be built', function() { });
  });

  describe('with a user registry and user extension data', function() {
    it('can be built', function() { });
  });
});
