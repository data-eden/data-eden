import { describe, expect, test, beforeEach } from 'vitest';
import { SignalCache } from '../src/index.js';

describe('SignalCache', () => {
  let cache: SignalCache;

  describe('#getKey', () => {
    beforeEach(() => {
      cache = new SignalCache({
        keys: {
          Foo: (data) => data.uuid as string,
        },
      });
    });

    test('with root type', () => {
      const key = cache.getKey({
        __typename: 'Query',
        foo: {
          __typename: 'Foo',
          uuid: '1234',
        },
      });

      expect(key).toEqual('Query');
    });

    test('falls back to id when no custom key is found', () => {
      const key = cache.getKey({
        __typename: 'Bar',
        id: '1234',
      });

      expect(key).toEqual('1234');
    });

    test('with a custom key', () => {
      const key = cache.getKey({
        __typename: 'Foo',
        uuid: '1234',
      });

      expect(key).toEqual('1234');
    });

    test('should return null when custom key exists but does not return anything', () => {
      const key = cache.getKey({
        __typename: 'Foo',
        id: '1234',
      });

      expect(key).toEqual(null);
    });

    test('when no key is found', () => {
      const key = cache.getKey({
        __typename: 'Baz',
        uuid: '1234',
      });

      expect(key).toEqual(null);
    });
  });
});
