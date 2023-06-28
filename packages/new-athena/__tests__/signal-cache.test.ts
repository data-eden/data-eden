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

  describe('#parse', () => {
    beforeEach(() => {
      cache = new SignalCache();
    });

    test('blah', () => {
      const document = {
        __typename: 'Query',
        foo: {
          __typename: 'Foo',
          id: '1234',
        },
      };

      const result = cache.parse(document.__typename, document);

      expect(result.length).toEqual(2);
      expect(result).toMatchInlineSnapshot(`
        [
          {
            "entity": {
              "__typename": "Foo",
              "id": "1234",
            },
            "parent": {
              "__typename": "Query",
              "foo": {
                "__typename": "Foo",
                "id": "1234",
              },
            },
            "prop": "foo",
          },
          {
            "entity": {
              "__typename": "Query",
              "foo": {
                "__typename": "Foo",
                "id": "1234",
              },
            },
            "parent": null,
            "prop": "Query",
          },
        ]
      `);
    });

    test('document with multiple levels', () => {
      const document = {
        __typename: 'Query',
        person: {
          id: '1',
          name: 'foo',
          __typename: 'Person',
          pets: [
            {
              id: '1',
              name: 'Hitch',
              owner: {
                id: '1',
                name: 'foo',
                __typename: 'Person',
              },
              __typename: 'Pet',
            },
            {
              id: '2',
              name: 'Dre',
              owner: {
                id: '1',
                name: 'foo',
                __typename: 'Person',
              },
              __typename: 'Pet',
            },
          ],
        },
      };

      const result = cache.parse(document.__typename, document);

      expect(result.length).toEqual(6);
      expect(result).toMatchInlineSnapshot(`
        [
          {
            "entity": {
              "__typename": "Person",
              "id": "1",
              "name": "foo",
            },
            "parent": {
              "__typename": "Pet",
              "id": "2",
              "name": "Dre",
              "owner": {
                "__typename": "Person",
                "id": "1",
                "name": "foo",
              },
            },
            "prop": "owner",
          },
          {
            "entity": {
              "__typename": "Pet",
              "id": "2",
              "name": "Dre",
              "owner": {
                "__typename": "Person",
                "id": "1",
                "name": "foo",
              },
            },
            "parent": {
              "__typename": "Person",
              "id": "1",
              "name": "foo",
              "pets": [
                {
                  "__typename": "Pet",
                  "id": "1",
                  "name": "Hitch",
                  "owner": {
                    "__typename": "Person",
                    "id": "1",
                    "name": "foo",
                  },
                },
                {
                  "__typename": "Pet",
                  "id": "2",
                  "name": "Dre",
                  "owner": {
                    "__typename": "Person",
                    "id": "1",
                    "name": "foo",
                  },
                },
              ],
            },
            "prop": [
              "pets",
              "1",
            ],
          },
          {
            "entity": {
              "__typename": "Person",
              "id": "1",
              "name": "foo",
            },
            "parent": {
              "__typename": "Pet",
              "id": "1",
              "name": "Hitch",
              "owner": {
                "__typename": "Person",
                "id": "1",
                "name": "foo",
              },
            },
            "prop": "owner",
          },
          {
            "entity": {
              "__typename": "Pet",
              "id": "1",
              "name": "Hitch",
              "owner": {
                "__typename": "Person",
                "id": "1",
                "name": "foo",
              },
            },
            "parent": {
              "__typename": "Person",
              "id": "1",
              "name": "foo",
              "pets": [
                {
                  "__typename": "Pet",
                  "id": "1",
                  "name": "Hitch",
                  "owner": {
                    "__typename": "Person",
                    "id": "1",
                    "name": "foo",
                  },
                },
                {
                  "__typename": "Pet",
                  "id": "2",
                  "name": "Dre",
                  "owner": {
                    "__typename": "Person",
                    "id": "1",
                    "name": "foo",
                  },
                },
              ],
            },
            "prop": [
              "pets",
              "0",
            ],
          },
          {
            "entity": {
              "__typename": "Person",
              "id": "1",
              "name": "foo",
              "pets": [
                {
                  "__typename": "Pet",
                  "id": "1",
                  "name": "Hitch",
                  "owner": {
                    "__typename": "Person",
                    "id": "1",
                    "name": "foo",
                  },
                },
                {
                  "__typename": "Pet",
                  "id": "2",
                  "name": "Dre",
                  "owner": {
                    "__typename": "Person",
                    "id": "1",
                    "name": "foo",
                  },
                },
              ],
            },
            "parent": {
              "__typename": "Query",
              "person": {
                "__typename": "Person",
                "id": "1",
                "name": "foo",
                "pets": [
                  {
                    "__typename": "Pet",
                    "id": "1",
                    "name": "Hitch",
                    "owner": {
                      "__typename": "Person",
                      "id": "1",
                      "name": "foo",
                    },
                  },
                  {
                    "__typename": "Pet",
                    "id": "2",
                    "name": "Dre",
                    "owner": {
                      "__typename": "Person",
                      "id": "1",
                      "name": "foo",
                    },
                  },
                ],
              },
            },
            "prop": "person",
          },
          {
            "entity": {
              "__typename": "Query",
              "person": {
                "__typename": "Person",
                "id": "1",
                "name": "foo",
                "pets": [
                  {
                    "__typename": "Pet",
                    "id": "1",
                    "name": "Hitch",
                    "owner": {
                      "__typename": "Person",
                      "id": "1",
                      "name": "foo",
                    },
                  },
                  {
                    "__typename": "Pet",
                    "id": "2",
                    "name": "Dre",
                    "owner": {
                      "__typename": "Person",
                      "id": "1",
                      "name": "foo",
                    },
                  },
                ],
              },
            },
            "parent": null,
            "prop": "Query",
          },
        ]
      `);
    });

    test('should account for multiple levels of unmanaged entity', () => {
      const document = {
        foo: {
          id: '1',
          __typename: 'Foo',
          bar: {
            baz: {
              blah: 'blah',
              owner: {
                id: '1',
                name: 'bob',
                __typename: 'Owner',
              },
              __typename: 'Baz',
            },
            __typename: 'Bar',
          },
        },
        __typename: 'Query',
      };

      const result = cache.parse(document.__typename, document);

      console.log(result);
    });
  });
});
