import { describe, it, expect } from 'vitest';
// TODO: add a tests tsconfig so we can import properly
import { buildCache } from '../src/index';

describe('@data-eden/cache', function() {
  describe('with no user registry', function() {
    it('can be built', async function() {
      // TODO: this valid call fails if we switch module resolution to node16
      let cache = buildCache();

      expect(await cache.get('missing-key')).toBeUndefined();
    });
  });

  describe('with a user registry', function() {
    it('can be built', function() { });
  });

  it('can run tests', function() {
    expect(true).toBe(true);
  });
});
