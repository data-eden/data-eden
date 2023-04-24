import { describe, test, expect } from 'vitest';
import { parseEntities } from '../src/parse-entities.js';

describe('parseEntities', () => {
  test('parses a single entity', () => {
    const document = {
      person: {
        id: '1',
        name: 'foo',
        __typename: 'Person',
      },
    };

    const result = parseEntities(document);

    expect(result).toMatchInlineSnapshot(`
      [
        [
          {
            "entity": {
              "__typename": "Person",
              "id": "1",
              "name": "foo",
            },
            "parent": null,
            "prop": "person",
          },
        ],
      ]
    `);
  });

  test('parses an entity with a nested entity', () => {
    const document = {
      person: {
        id: '1',
        name: 'foo',
        __typename: 'Person',
        car: {
          id: '1',
          make: 'Ford',
          model: 'Mustang',
          __typename: 'Car',
        },
      },
    };

    const result = parseEntities(document);

    expect(result).toMatchInlineSnapshot(`
      [
        [
          {
            "entity": {
              "__typename": "Car",
              "id": "1",
              "make": "Ford",
              "model": "Mustang",
            },
            "parent": {
              "__typename": "Person",
              "car": {
                "__typename": "Car",
                "id": "1",
                "make": "Ford",
                "model": "Mustang",
              },
              "id": "1",
              "name": "foo",
            },
            "prop": "car",
          },
          {
            "entity": {
              "__typename": "Person",
              "car": {
                "__typename": "Car",
                "id": "1",
                "make": "Ford",
                "model": "Mustang",
              },
              "id": "1",
              "name": "foo",
            },
            "parent": null,
            "prop": "person",
          },
        ],
      ]
    `);
  });

  test('parses an entity with an array of nested entities', () => {
    const document = {
      person: {
        id: '1',
        name: 'foo',
        __typename: 'Person',
        pets: [
          {
            id: '1',
            name: 'Hitch',
            __typename: 'Pet',
          },
          {
            id: '2',
            name: 'Dre',
            __typename: 'Pet',
          },
        ],
      },
    };

    const result = parseEntities(document);

    expect(result).toMatchInlineSnapshot(`
      [
        [
          {
            "entity": {
              "__typename": "Pet",
              "id": "2",
              "name": "Dre",
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
                },
                {
                  "__typename": "Pet",
                  "id": "2",
                  "name": "Dre",
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
              "__typename": "Pet",
              "id": "1",
              "name": "Hitch",
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
                },
                {
                  "__typename": "Pet",
                  "id": "2",
                  "name": "Dre",
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
                },
                {
                  "__typename": "Pet",
                  "id": "2",
                  "name": "Dre",
                },
              ],
            },
            "parent": null,
            "prop": "person",
          },
        ],
      ]
    `);
  });

  test('parses a document with two sibling entities', () => {
    const document = {
      person: {
        id: '1',
        name: 'foo',
        __typename: 'Person',
      },
      car: {
        id: '1',
        make: 'Ford',
        model: 'Mustang',
        __typename: 'Car',
      },
    };

    const result = parseEntities(document);

    expect(result).toMatchInlineSnapshot(`
      [
        [
          {
            "entity": {
              "__typename": "Person",
              "id": "1",
              "name": "foo",
            },
            "parent": null,
            "prop": "person",
          },
        ],
        [
          {
            "entity": {
              "__typename": "Car",
              "id": "1",
              "make": "Ford",
              "model": "Mustang",
            },
            "parent": null,
            "prop": "car",
          },
        ],
      ]
    `);
  });

  test('parses a document with an array of entities at the root', () => {
    const document = {
      someOperation: [
        {
          id: '1',
          name: 'foo',
          __typename: 'Person',
        },
        {
          id: '1',
          make: 'Ford',
          model: 'Mustang',
          __typename: 'Car',
        },
      ],
    };

    const result = parseEntities(document);

    expect(result).toMatchInlineSnapshot(`
      [
        [
          {
            "entity": {
              "__typename": "Person",
              "id": "1",
              "name": "foo",
            },
            "parent": null,
            "prop": [
              "someOperation",
              0,
            ],
          },
        ],
        [
          {
            "entity": {
              "__typename": "Car",
              "id": "1",
              "make": "Ford",
              "model": "Mustang",
            },
            "parent": null,
            "prop": [
              "someOperation",
              1,
            ],
          },
        ],
      ]
    `);
  });
});
