import { describe, test, expect } from 'vitest';
import { parseEntities } from '../src/parse-entities.js';

describe('parseEntities', () => {
  test('parses a single entity', () => {
    const document = {
      data: {
        person: {
          id: '1',
          name: 'foo',
          __typename: 'Person',
        },
      },
    };

    const result = parseEntities(document.data);

    expect(result).toEqual([
      [
        {
          entity: {
            __typename: 'Person',
            id: '1',
            name: 'foo',
          },
          parent: null,
          prop: 'person',
        },
      ],
    ]);
  });

  test('parses an entity with a nested entity', () => {
    const document = {
      data: {
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
      },
    };

    const result = parseEntities(document.data);

    expect(result).toEqual([
      [
        {
          entity: {
            id: '1',
            make: 'Ford',
            model: 'Mustang',
            __typename: 'Car',
          },
          parent: {
            __typename: 'Person',
            id: '1',
            name: 'foo',
            car: {
              id: '1',
              make: 'Ford',
              model: 'Mustang',
              __typename: 'Car',
            },
          },
          prop: 'car',
        },
        {
          entity: {
            __typename: 'Person',
            id: '1',
            name: 'foo',
            car: {
              id: '1',
              make: 'Ford',
              model: 'Mustang',
              __typename: 'Car',
            },
          },
          parent: null,
          prop: 'person',
        },
      ],
    ]);
  });

  test('parses an entity with an array of nested entities', () => {
    const document = {
      data: {
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
      },
    };

    const result = parseEntities(document.data);

    expect(result).toEqual([
      [
        {
          entity: {
            id: '2',
            name: 'Dre',
            __typename: 'Pet',
          },
          parent: {
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
          prop: ['pets', '1'],
        },
        {
          entity: {
            id: '1',
            name: 'Hitch',
            __typename: 'Pet',
          },
          parent: {
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
          prop: ['pets', '0'],
        },
        {
          entity: {
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
          parent: null,
          prop: 'person',
        },
      ],
    ]);
  });

  test('parses a document with two sibling entities', () => {
    const document = {
      data: {
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
      },
    };

    const result = parseEntities(document.data);

    expect(result).toEqual([
      [
        {
          entity: {
            __typename: 'Person',
            id: '1',
            name: 'foo',
          },
          parent: null,
          prop: 'person',
        },
      ],
      [
        {
          entity: {
            id: '1',
            make: 'Ford',
            model: 'Mustang',
            __typename: 'Car',
          },
          parent: null,
          prop: 'car',
        },
      ],
    ]);
  });

  test('parses a document with an array of entities at the root', () => {
    const document = {
      data: {
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
      },
    };

    const result = parseEntities(document.data);

    expect(result).toEqual([
      [
        {
          entity: {
            id: '1',
            name: 'foo',
            __typename: 'Person',
          },
          parent: null,
          prop: ['someOperation', 0],
        },
      ],
      [
        {
          entity: {
            id: '1',
            make: 'Ford',
            model: 'Mustang',
            __typename: 'Car',
          },
          parent: null,
          prop: ['someOperation', 1],
        },
      ],
    ]);
  });
});
