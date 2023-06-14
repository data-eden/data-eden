import { describe, test, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

import { gql } from '@data-eden/codegen/gql';

import { Mocker } from '@data-eden/mocker';
import {
  CarOneFragment,
  CarThreeFragment,
  CarTwoFragment,
  CreateOnePetMutation,
  PersonOneFragment,
  PetOneFragment,
  PetThreeFragment,
  PetTwoFragment,
} from './__generated/mocker.test.graphql';

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
      const carOneFragment = gql<CarOneFragment>`
        fragment carOne on Car {
          id
          make
        }
      `;

      const mocker = new Mocker({ schema });
      const result = await mocker.mock(carOneFragment, { id: 1234 });

      expect(result).toMatchSnapshot();
    });

    test('fragment with default data and fieldGenerator', async () => {
      const carTwoFragment = gql<CarTwoFragment>`
        fragment carTwo on Car {
          id
          make
        }
      `;

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
      const result = await mocker.mock(carTwoFragment, {
        id: 1234,
      });

      expect(result).toMatchSnapshot();
    });

    test('fragment with enum values', async () => {
      const petOneFragment = gql<PetOneFragment>`
        fragment petOne on Pet {
          id
          breed
        }
      `;

      const mocker = new Mocker({
        schema,
      });
      const result = await mocker.mock(petOneFragment, { id: 1234 });

      expect(Object.keys(result)).toMatchInlineSnapshot(`
        [
          "id",
          "breed",
        ]
      `);
      expect(
        result.breed &&
          typeof result.breed === 'string' &&
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
      const carThreeFragment = gql<CarThreeFragment>`
        fragment carThree on Car {
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
      `;

      const mocker = new Mocker({
        schema,
      });
      const result = await mocker.mock(carThreeFragment, { id: 1234 });

      expect(result).toMatchSnapshot();
    });

    test('fragment with enum values (with provided enum value)', async () => {
      const petTwoFragment = gql<PetTwoFragment>`
        fragment petTwo on Pet {
          id
          breed
        }
      `;

      const mocker = new Mocker({
        schema,
      });
      const result = await mocker.mock(petTwoFragment, {
        id: 1234,
        breed: 'SHEPARD',
      });

      expect(result).toMatchSnapshot();
    });

    test("fragment with enum values (with provided enum value that doesn't match, this should throw)", async () => {
      const petThreeFragment = gql<PetThreeFragment>`
        fragment petThree on Pet {
          id
          breed
        }
      `;

      const mocker = new Mocker({
        schema,
      });

      await expect(() =>
        mocker.mock(petThreeFragment, { id: 1234, breed: 'SHARK' })
      ).rejects.toMatchSnapshot();
    });

    test('fragment with default data and fieldGenerator with array of values', async () => {
      const personOneFragment = gql<PersonOneFragment>`
        fragment personOne on Person {
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
      `;

      const mocker = new Mocker({
        schema,
        typeGenerators: {
          ID() {
            return 1234557;
          },
        },
      });
      const result = await mocker.mock(personOneFragment, {
        id: 1234,
        pets: [{}, { id: 99999, name: 'Bob' }],
      });

      expect(result).toMatchSnapshot();
    });
  });

  describe('queries', () => {
    test('should work with basic query (no overrides)', async () => {
      const carOneQuery = gql<CarOneFragment>`
        query carOne {
          car(id: 124) {
            id
            make
            model
          }
        }
      `;
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

      const result = await mocker.mock(carOneQuery, { id: 1234 });

      expect(result).toMatchSnapshot();
    });
  });

  describe('mutations', () => {
    test('should work with basic mutation (no overrides)', async () => {
      const createOnePetMutation = gql<CreateOnePetMutation>`
        mutation createOnePet {
          createPet(input: { name: "Bob", personId: 1234 }) {
            id
            name
          }
        }
      `;

      const mocker = new Mocker({
        schema,
        typeGenerators: {
          ID() {
            return 1234557;
          },
        },
      });

      const result = await mocker.mock(createOnePetMutation, { id: 1234 });

      expect(result).toMatchSnapshot();
    });
  });
});
