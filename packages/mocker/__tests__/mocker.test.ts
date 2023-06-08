/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { describe, test, expect } from 'vitest';
import { parse } from 'graphql';
import { readFileSync } from 'fs';
import { resolve } from 'path';

import { Mocker } from '@data-eden/mocker';

const schema = readFileSync(
  resolve(
    __dirname,
    '..',
    '..',
    '..',
    'internal-packages/react-graphql-test-app/src/graphql/schema.graphql'
  ),
  'utf8'
);

describe('mocker', () => {
  describe('fragments', () => {
    test('fragment with default data', async () => {
      const parsedFragment = parse(`
        fragment car on Car {
            id
            make
        }
    `);
      const fragmentDef = parsedFragment.definitions[0];

      const mocker = new Mocker({ schema });
      const result = await mocker.mock(fragmentDef, { id: 1234 });

      expect(result).toMatchInlineSnapshot(`
      {
        "id": 1234,
        "make": "whose nor",
      }
    `);
    });

    test('fragment with default data and fieldGenerator', async () => {
      const parsedFragment = parse(`
        fragment car on Car {
            id
            make
        }
    `);
      const fragmentDef = parsedFragment.definitions[0];

      const mocker = new Mocker({
        schema,
        fieldGenerators: {
          Car: {
            make() {
              return 'Acura';
            },
          },
        },
      });
      const result = await mocker.mock(fragmentDef, { id: 1234 });

      expect(result).toMatchInlineSnapshot(`
      {
        "id": 1234,
        "make": "Acura",
      }
    `);
    });

    test('fragment with enum values', async () => {
      const parsedFragment = parse(`
        fragment pet on Pet {
            id
            breed
        }
    `);
      const fragmentDef = parsedFragment.definitions[0];

      const mocker = new Mocker({
        schema,
      });
      const result = await mocker.mock(fragmentDef, { id: 1234 });

      expect(Object.keys(result)).toMatchInlineSnapshot(`
        [
          "id",
          "breed",
        ]
      `);
      expect(
        [
          'SHEPARD',
          'BULLDOG',
          'POODLE',
          'GERMAN_SHEPHERD',
          'LABRADOR_RETRIEVER',
          'GOLDEN_RETRIEVER',
        ].indexOf(result.breed) > -1
      ).toBeTruthy();
    });

    test('fragment with union values', async () => {
      const parsedFragment = parse(`
        fragment car on Car {
            id
            make
            owner {
                ... on Person {
                    id
                    name
                }
                ... on Company {
                    id
                    name
                }
            }
        }
    `);
      const fragmentDef = parsedFragment.definitions[0];

      const mocker = new Mocker({
        schema,
      });
      const result = await mocker.mock(fragmentDef, { id: 1234 });

      expect(result).toMatchInlineSnapshot(`
        {
          "id": 1234,
          "make": "whose nor",
          "owner": {
            "id": 1234,
            "name": "tie",
          },
        }
      `);
    });

    test('fragment with enum values (with provided enum value)', async () => {
      const parsedFragment = parse(`
        fragment pet on Pet {
            id
            breed
        }
    `);
      const fragmentDef = parsedFragment.definitions[0];

      const mocker = new Mocker({
        schema,
      });
      const result = await mocker.mock(
        fragmentDef,
        { id: 1234, breed: 'SHEPARD' },
        schema
      );

      expect(result).toMatchInlineSnapshot(`
        {
          "breed": "SHEPARD",
          "id": 1234,
        }
      `);
    });

    test("fragment with enum values (with provided enum value that doesn't match, this should throw)", async () => {
      const parsedFragment = parse(`
        fragment pet on Pet {
            id
            breed
        }
    `);
      const fragmentDef = parsedFragment.definitions[0];

      const mocker = new Mocker({
        schema,
      });

      await expect(() =>
        mocker.mock(fragmentDef, { id: 1234, breed: 'SHARK' })
      ).rejects.toThrowErrorMatchingInlineSnapshot(
        '"Trying to mock Breed with enum value SHARK does not match known enum values \\"[SHEPARD,BULLDOG,POODLE,GERMAN_SHEPHERD,LABRADOR_RETRIEVER,GOLDEN_RETRIEVER]\\""'
      );
    });

    test('fragment with default data and fieldGenerator with array of values', async () => {
      const parsedFragment = parse(`
        fragment person on Person {
            id
            name
            car {
                id
            }
            pets {
                id
                name
            }
        }
    `);
      const fragmentDef = parsedFragment.definitions[0];

      const mocker = new Mocker({
        schema,
        typeGenerators: {
          ID() {
            return 1234557;
          },
        },
      });
      const result = await mocker.mock(
        fragmentDef,
        { id: 1234, pets: [{}, { id: 99999, name: 'Bob' }] },
        schema
      );

      expect(result).toMatchInlineSnapshot(`
        {
          "car": {
            "id": 1234,
          },
          "id": 1234,
          "name": "whose nor",
          "pets": [
            {
              "id": 1234557,
              "name": "imperfect offensively thwack",
            },
            {
              "id": 99999,
              "name": "Bob",
            },
          ],
        }
      `);
    });
  });

  describe('queries', () => {
    test('should work with basic query (no overrides)', async () => {
      const parsedQuery = parse(`
        query {
            car(id: 124) {
                id
                make
                model
            }
        }
    `);
      const queryDef = parsedQuery.definitions[0];

      const mocker = new Mocker({
        schema,
        typeGenerators: {
          ID() {
            return 1234557;
          },
        },
        fieldGenerators: {
          Car: {
            make() {
              return 'Italian Car';
            },
          },
        },
      });
      // todo use the default value not the type generator
      const result = await mocker.mock(queryDef, { id: 1234 });

      expect(result).toMatchInlineSnapshot(`
        {
          "car": {
            "id": 1234,
            "make": "Italian Car",
            "model": "whose nor",
          },
        }
      `);
    });
  });

  describe('mutations', () => {
    test('should work with basic mutation (no overrides)', async () => {
      const parsedQuery = parse(`
        mutation {
            createPet(input: {
                name: "Bob"
                personId: 1234
            }) {
                id
                name
            }
        }
    `);
      const queryDef = parsedQuery.definitions[0];

      const mocker = new Mocker({
        schema,
        typeGenerators: {
          ID() {
            return 1234557;
          },
        },
      });
      // todo use the default value not the type generator
      const result = await mocker.mock(queryDef, { id: 1234 });

      expect(result).toMatchInlineSnapshot(`
        {
          "createPet": {
            "id": 1234,
            "name": "whose nor",
          },
        }
      `);
    });
  });
});
