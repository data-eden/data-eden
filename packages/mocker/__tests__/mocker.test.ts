import { describe, test, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

import { gql } from '@data-eden/codegen/gql';

import { Mocker } from '@data-eden/mocker';
import {
  CarOneFragment,
  CarTwoFragment,
  CarThreeFragment,
  CarFourFragment,
  OwnerFragment,
  CreateOnePetMutation,
  PersonOneFragment,
  PetOneFragment,
  PetThreeFragment,
  PetTwoFragment,
} from './__generated/mocker.test.graphql';
import { Breed } from '../../../internal-packages/react-graphql-test-app/src/graphql/schema.graphql.js';

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
      const result = mocker.mock(carOneFragment, { id: 1234 });

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
      const result = mocker.mock(carTwoFragment, {
        id: '1234',
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
      const result = mocker.mock(petOneFragment, { id: 1234 });

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

    test('fragment with union values (random)', async () => {
      const carThreeFragment = gql<CarThreeFragment>`
        fragment carThree on Car {
          __typename
          id
          make
          owner {
            ... on Person {
              __typename
              id
              name
              car {
                __typename
                id
                make
              }
            }
            ... on Company {
              __typename
              id
              name
            }
          }
        }
      `;

      const mocker = new Mocker({
        schema,
        typeGenerators: {
          ID() {
            return '1234';
          },
        },
      });
      const result = mocker.mock(carThreeFragment, { id: '1234' });

      // we know that this is going to be a random result because we are picking a random resolution everytime
      // so the expects below are handling both cases for whatever union we mock out

      // top level object should be a car
      expect(Object.keys(result)).toEqual([
        '__typename',
        'id',
        'make',
        'owner',
      ]);
      // expect owner to be a specific type not all of the types as only one union can be projected
      expect(Object.keys(result.owner)).toEqual(
        result.owner.__typename === 'Company'
          ? ['__typename', 'id', 'name']
          : ['__typename', 'id', 'name', 'car']
      );
    });

    test('fragment with union values (with match)', async () => {
      const carFourFragment = gql<CarFourFragment>`
        fragment carFour on Car {
          __typename
          id
          make
          owner {
            ... on Person {
              __typename
              id
              name
              car {
                __typename
                id
                make
              }
            }
            ... on Company {
              __typename
              id
              name
            }
          }
        }
      `;

      const mocker = new Mocker({
        schema,
        typeGenerators: {
          ID() {
            return '123';
          },
        },
      });

      const result = mocker.mock(carFourFragment, {
        id: '1234',
        owner: {
          __typename: 'Person',
          id: '123',
          name: 'Bob',
        },
      });

      expect(result).toEqual({
        __typename: 'Car',
        id: '1234',
        make: 'whose nor',
        owner: {
          __typename: 'Person',
          id: '123',
          name: 'Bob',
          car: {
            __typename: 'Car',
            id: '123',
            make: 'imperfect offensively thwack',
          },
        },
      });
    });

    test('should be able to mock union type fragment', async () => {
      const ownerFragment = gql<OwnerFragment>`
        fragment owner on Owner {
          ... on Person {
            __typename
            id
            name
            car {
              __typename
              id
              make
            }
          }
          ... on Company {
            __typename
            id
            name
          }
        }
      `;

      const mocker = new Mocker({
        schema,
        typeGenerators: {
          ID: () => {
            return '123';
          },
        },
      });
      const result = mocker.mock(ownerFragment, {
        __typename: 'Person',
        id: '123',
        name: 'Bob',
        car: {
          make: 'Accura',
        },
      });

      expect(result).toEqual({
        __typename: 'Person',
        id: '123',
        name: 'Bob',
        car: {
          __typename: 'Car',
          id: '123',
          make: 'Accura',
        },
      });
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
      const result = mocker.mock(petTwoFragment, {
        id: '1234',
        breed: Breed.Shepard,
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

      expect(() =>
        mocker.mock(petThreeFragment, { id: '1234', breed: 'SHARK' as any })
      ).toThrowErrorMatchingSnapshot();
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
            return '1234557';
          },
        },
      });
      const result = mocker.mock(personOneFragment, {
        id: '1234',
        pets: [{}, { id: '99999', name: 'Bob' }],
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
            return '1234557';
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

      const result = mocker.mock(carOneQuery, { id: '1234' });

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
            return '1234557';
          },
        },
      });

      const result = mocker.mock(createOnePetMutation, {
        createPet: { id: '1234' },
      });

      expect(result).toMatchSnapshot();
    });
  });
});
