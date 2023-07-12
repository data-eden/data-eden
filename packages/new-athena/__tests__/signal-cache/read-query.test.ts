import { describe, expect, test } from 'vitest';
import { Operation, SignalCache } from '../../src/index.js';

describe('SignalCache#resolve', () => {
  let cache: SignalCache;

  test('basic', async () => {
    cache = new SignalCache();

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

  test('with a single child', async () => {
    cache = new SignalCache();

    const op: Operation = {
      name: 'getPersonWithCar',
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
            car: {
              id: '1',
              __typename: 'Car',
              make: 'Ford',
              model: 'Bronco',
            },
          },
        },
      },
    };

    await cache.writeQuery(op);

    expect(cache.links).toMatchInlineSnapshot(`
      Map {
        "Car:1" => {},
        "Person:1" => {
          "car": "Car:1",
        },
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
          "car": {
            "__typename": "Car",
            "id": "1",
            "make": "Ford",
            "model": "Bronco",
          },
          "id": "1",
          "name": "Bob",
        },
      }
    `);
  });

  test('with a single child that refers to its parent', async () => {
    cache = new SignalCache();

    const op: Operation = {
      name: 'getPersonWithCar',
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
            car: {
              id: '1',
              __typename: 'Car',
              make: 'Ford',
              model: 'Bronco',
              owner: {
                id: '1',
                __typename: 'Person',
              },
            },
          },
        },
      },
    };

    await cache.writeQuery(op);

    expect(cache.links).toMatchInlineSnapshot(`
      Map {
        "Person:1" => {
          "car": "Car:1",
        },
        "Car:1" => {
          "owner": "Person:1",
        },
        "query:1234({\\"id\\":\\"1\\"})" => {
          "person": "Person:1",
        },
      }
    `);

    delete op.result;

    const result = cache.readQuery(op);

    expect(result).toMatchInlineSnapshot(`
      {
        "__typename": "Query",
        "person": {
          "__typename": "Person",
          "car": {
            "__typename": "Car",
            "id": "1",
            "make": "Ford",
            "model": "Bronco",
            "owner": [Circular],
          },
          "id": "1",
          "name": "Bob",
        },
      }
    `);
  });

  test('with an array of children', async () => {
    cache = new SignalCache();

    const op: Operation = {
      name: 'getPersonWithCar',
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
            pets: [
              {
                id: '1',
                __typename: 'Pet',
                name: 'Dre',
              },
              {
                id: '2',
                __typename: 'Pet',
                name: 'Hitch',
              },
            ],
          },
        },
      },
    };

    await cache.writeQuery(op);

    expect(cache.links).toMatchInlineSnapshot(`
      Map {
        "Pet:2" => {},
        "Pet:1" => {},
        "Person:1" => {
          "pets": [
            "Pet:1",
            "Pet:2",
          ],
        },
        "query:1234({\\"id\\":\\"1\\"})" => {
          "person": "Person:1",
        },
      }
    `);

    delete op.result;

    const result = cache.readQuery(op);

    expect(result).toMatchInlineSnapshot(`
      {
        "__typename": "Query",
        "person": {
          "__typename": "Person",
          "id": "1",
          "name": "Bob",
          "pets": [
            {
              "__typename": "Pet",
              "id": "1",
              "name": "Dre",
            },
            {
              "__typename": "Pet",
              "id": "2",
              "name": "Hitch",
            },
          ],
        },
      }
    `);
  });

  test('with an array of children that point to their owner', async () => {
    cache = new SignalCache();

    const op: Operation = {
      name: 'getPersonWithCar',
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
            pets: [
              {
                id: '1',
                __typename: 'Pet',
                name: 'Dre',
                owner: {
                  id: '1',
                  __typename: 'Person',
                },
              },
              {
                id: '2',
                __typename: 'Pet',
                name: 'Hitch',
                owner: {
                  id: '1',
                  __typename: 'Person',
                },
              },
            ],
          },
        },
      },
    };

    await cache.writeQuery(op);

    expect(cache.links).toMatchInlineSnapshot(`
      Map {
        "Person:1" => {
          "pets": [
            "Pet:1",
            "Pet:2",
          ],
        },
        "Pet:2" => {
          "owner": "Person:1",
        },
        "Pet:1" => {
          "owner": "Person:1",
        },
        "query:1234({\\"id\\":\\"1\\"})" => {
          "person": "Person:1",
        },
      }
    `);

    delete op.result;

    const result = cache.readQuery(op);

    expect(result).toMatchInlineSnapshot(`
      {
        "__typename": "Query",
        "person": {
          "__typename": "Person",
          "id": "1",
          "name": "Bob",
          "pets": [
            {
              "__typename": "Pet",
              "id": "1",
              "name": "Dre",
              "owner": [Circular],
            },
            {
              "__typename": "Pet",
              "id": "2",
              "name": "Hitch",
              "owner": [Circular],
            },
          ],
        },
      }
    `);
  });

  test('with embedded field', async () => {
    cache = new SignalCache();
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
            pet: {
              name: 'Dre',
              __typename: 'Pet',
            },
          },
        },
      },
    };

    await cache.writeQuery(op);

    expect(cache.links).toMatchInlineSnapshot(`
      Map {
        "Person:1.pet" => {},
        "Person:1" => {
          "pet": "Person:1.pet",
        },
        "query:1234({\\"id\\":\\"1\\"})" => {
          "person": "Person:1",
        },
      }
    `);

    delete op.result;

    const result = cache.readQuery(op);

    expect(result).toMatchInlineSnapshot(`
      {
        "__typename": "Query",
        "person": {
          "__typename": "Person",
          "id": "1",
          "name": "Bob",
          "pet": {
            "__typename": "Pet",
            "name": "Dre",
          },
        },
      }
    `);
  });
});
