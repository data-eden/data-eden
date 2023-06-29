import { beforeEach, describe, expect, test } from 'vitest';
import { SignalCache } from '../../src/index.js';

describe('SignalCache#parse', () => {
  let cache: SignalCache;

  beforeEach(() => {
    cache = new SignalCache();
  });

  test('basic document', () => {
    const document = {
      __typename: 'Query',
      foo: {
        __typename: 'Foo',
        id: '1234',
      },
    };

    const result = cache.parse(document);

    expect(result.length).toEqual(2);
    expect(result).toMatchInlineSnapshot(`
        [
          {
            "cacheKey": "Foo:1234",
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
            "cacheKey": "Query",
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

    const result = cache.parse(document);

    expect(result.length).toEqual(6);
    expect(result).toMatchInlineSnapshot(`
        [
          {
            "cacheKey": "Person:1",
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
            "cacheKey": "Pet:2",
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
            "cacheKey": "Person:1",
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
            "cacheKey": "Pet:1",
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
            "cacheKey": "Person:1",
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
            "cacheKey": "Query",
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

  test('with embedded entity', () => {
    const document = {
      foo: {
        id: '1',
        __typename: 'Foo',
        bar: {
          blah: 'blah',
          __typename: 'Bar',
        },
      },
      __typename: 'Query',
    };

    const result = cache.parse(document);

    expect(result).toMatchInlineSnapshot(`
        [
          {
            "cacheKey": "Foo:1.bar",
            "entity": {
              "__typename": "Bar",
              "blah": "blah",
            },
            "parent": {
              "__typename": "Foo",
              "bar": {
                "__typename": "Bar",
                "blah": "blah",
              },
              "id": "1",
            },
            "prop": "bar",
          },
          {
            "cacheKey": "Foo:1",
            "entity": {
              "__typename": "Foo",
              "bar": {
                "__typename": "Bar",
                "blah": "blah",
              },
              "id": "1",
            },
            "parent": {
              "__typename": "Query",
              "foo": {
                "__typename": "Foo",
                "bar": {
                  "__typename": "Bar",
                  "blah": "blah",
                },
                "id": "1",
              },
            },
            "prop": "foo",
          },
          {
            "cacheKey": "Query",
            "entity": {
              "__typename": "Query",
              "foo": {
                "__typename": "Foo",
                "bar": {
                  "__typename": "Bar",
                  "blah": "blah",
                },
                "id": "1",
              },
            },
            "parent": null,
            "prop": "Query",
          },
        ]
      `);
  });

  test('with embedded entity pointing to another entity', () => {
    const document = {
      foo: {
        id: '1',
        __typename: 'Foo',
        bar: {
          blah: 'blah',
          owner: {
            id: '1',
            name: 'bob',
            __typename: 'Owner',
          },
          __typename: 'Bar',
        },
      },
      __typename: 'Query',
    };

    const result = cache.parse(document);

    expect(result).toMatchInlineSnapshot(`
        [
          {
            "cacheKey": "Owner:1",
            "entity": {
              "__typename": "Owner",
              "id": "1",
              "name": "bob",
            },
            "parent": {
              "__typename": "Bar",
              "blah": "blah",
              "owner": {
                "__typename": "Owner",
                "id": "1",
                "name": "bob",
              },
            },
            "prop": "owner",
          },
          {
            "cacheKey": "Foo:1.bar",
            "entity": {
              "__typename": "Bar",
              "blah": "blah",
              "owner": {
                "__typename": "Owner",
                "id": "1",
                "name": "bob",
              },
            },
            "parent": {
              "__typename": "Foo",
              "bar": {
                "__typename": "Bar",
                "blah": "blah",
                "owner": {
                  "__typename": "Owner",
                  "id": "1",
                  "name": "bob",
                },
              },
              "id": "1",
            },
            "prop": "bar",
          },
          {
            "cacheKey": "Foo:1",
            "entity": {
              "__typename": "Foo",
              "bar": {
                "__typename": "Bar",
                "blah": "blah",
                "owner": {
                  "__typename": "Owner",
                  "id": "1",
                  "name": "bob",
                },
              },
              "id": "1",
            },
            "parent": {
              "__typename": "Query",
              "foo": {
                "__typename": "Foo",
                "bar": {
                  "__typename": "Bar",
                  "blah": "blah",
                  "owner": {
                    "__typename": "Owner",
                    "id": "1",
                    "name": "bob",
                  },
                },
                "id": "1",
              },
            },
            "prop": "foo",
          },
          {
            "cacheKey": "Query",
            "entity": {
              "__typename": "Query",
              "foo": {
                "__typename": "Foo",
                "bar": {
                  "__typename": "Bar",
                  "blah": "blah",
                  "owner": {
                    "__typename": "Owner",
                    "id": "1",
                    "name": "bob",
                  },
                },
                "id": "1",
              },
            },
            "parent": null,
            "prop": "Query",
          },
        ]
      `);
  });

  test('with embedded entity pointing to array of entities', () => {
    const document = {
      foo: {
        id: '1',
        __typename: 'Foo',
        bar: {
          blah: 'blah',
          things: [
            {
              id: '1',
              __typename: 'Thing',
            },
            {
              id: '2',
              __typename: 'Thing',
            },
          ],
          __typename: 'Bar',
        },
      },
      __typename: 'Query',
    };

    const result = cache.parse(document);

    expect(result).toMatchInlineSnapshot(`
        [
          {
            "cacheKey": "Thing:2",
            "entity": {
              "__typename": "Thing",
              "id": "2",
            },
            "parent": {
              "__typename": "Bar",
              "blah": "blah",
              "things": [
                {
                  "__typename": "Thing",
                  "id": "1",
                },
                {
                  "__typename": "Thing",
                  "id": "2",
                },
              ],
            },
            "prop": [
              "things",
              "1",
            ],
          },
          {
            "cacheKey": "Thing:1",
            "entity": {
              "__typename": "Thing",
              "id": "1",
            },
            "parent": {
              "__typename": "Bar",
              "blah": "blah",
              "things": [
                {
                  "__typename": "Thing",
                  "id": "1",
                },
                {
                  "__typename": "Thing",
                  "id": "2",
                },
              ],
            },
            "prop": [
              "things",
              "0",
            ],
          },
          {
            "cacheKey": "Foo:1.bar",
            "entity": {
              "__typename": "Bar",
              "blah": "blah",
              "things": [
                {
                  "__typename": "Thing",
                  "id": "1",
                },
                {
                  "__typename": "Thing",
                  "id": "2",
                },
              ],
            },
            "parent": {
              "__typename": "Foo",
              "bar": {
                "__typename": "Bar",
                "blah": "blah",
                "things": [
                  {
                    "__typename": "Thing",
                    "id": "1",
                  },
                  {
                    "__typename": "Thing",
                    "id": "2",
                  },
                ],
              },
              "id": "1",
            },
            "prop": "bar",
          },
          {
            "cacheKey": "Foo:1",
            "entity": {
              "__typename": "Foo",
              "bar": {
                "__typename": "Bar",
                "blah": "blah",
                "things": [
                  {
                    "__typename": "Thing",
                    "id": "1",
                  },
                  {
                    "__typename": "Thing",
                    "id": "2",
                  },
                ],
              },
              "id": "1",
            },
            "parent": {
              "__typename": "Query",
              "foo": {
                "__typename": "Foo",
                "bar": {
                  "__typename": "Bar",
                  "blah": "blah",
                  "things": [
                    {
                      "__typename": "Thing",
                      "id": "1",
                    },
                    {
                      "__typename": "Thing",
                      "id": "2",
                    },
                  ],
                },
                "id": "1",
              },
            },
            "prop": "foo",
          },
          {
            "cacheKey": "Query",
            "entity": {
              "__typename": "Query",
              "foo": {
                "__typename": "Foo",
                "bar": {
                  "__typename": "Bar",
                  "blah": "blah",
                  "things": [
                    {
                      "__typename": "Thing",
                      "id": "1",
                    },
                    {
                      "__typename": "Thing",
                      "id": "2",
                    },
                  ],
                },
                "id": "1",
              },
            },
            "parent": null,
            "prop": "Query",
          },
        ]
      `);
  });

  test('entity with array of embedded entities', () => {
    const document = {
      foo: {
        id: '1',
        __typename: 'Foo',
        things: [
          {
            message: 'blah',
            __typename: 'Thing',
          },
          {
            message: 'more blah',
            __typename: 'Thing',
          },
        ],
      },
      __typename: 'Query',
    };

    const result = cache.parse(document);

    expect(result).toMatchInlineSnapshot(`
      [
        {
          "cacheKey": "Foo:1.things.1",
          "entity": {
            "__typename": "Thing",
            "message": "more blah",
          },
          "parent": {
            "__typename": "Foo",
            "id": "1",
            "things": [
              {
                "__typename": "Thing",
                "message": "blah",
              },
              {
                "__typename": "Thing",
                "message": "more blah",
              },
            ],
          },
          "prop": [
            "things",
            "1",
          ],
        },
        {
          "cacheKey": "Foo:1.things.0",
          "entity": {
            "__typename": "Thing",
            "message": "blah",
          },
          "parent": {
            "__typename": "Foo",
            "id": "1",
            "things": [
              {
                "__typename": "Thing",
                "message": "blah",
              },
              {
                "__typename": "Thing",
                "message": "more blah",
              },
            ],
          },
          "prop": [
            "things",
            "0",
          ],
        },
        {
          "cacheKey": "Foo:1",
          "entity": {
            "__typename": "Foo",
            "id": "1",
            "things": [
              {
                "__typename": "Thing",
                "message": "blah",
              },
              {
                "__typename": "Thing",
                "message": "more blah",
              },
            ],
          },
          "parent": {
            "__typename": "Query",
            "foo": {
              "__typename": "Foo",
              "id": "1",
              "things": [
                {
                  "__typename": "Thing",
                  "message": "blah",
                },
                {
                  "__typename": "Thing",
                  "message": "more blah",
                },
              ],
            },
          },
          "prop": "foo",
        },
        {
          "cacheKey": "Query",
          "entity": {
            "__typename": "Query",
            "foo": {
              "__typename": "Foo",
              "id": "1",
              "things": [
                {
                  "__typename": "Thing",
                  "message": "blah",
                },
                {
                  "__typename": "Thing",
                  "message": "more blah",
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
});
