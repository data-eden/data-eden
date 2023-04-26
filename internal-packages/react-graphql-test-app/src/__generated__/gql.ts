/* eslint-disable */
import * as types from './graphql';
import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';

/**
 * Map of all GraphQL operations in the project.
 *
 * This map has several performance disadvantages:
 * 1. It is not tree-shakeable, so it will include all operations in the project.
 * 2. It is not minifiable, so the string of a GraphQL query will be multiple times inside the bundle.
 * 3. It does not support dead code elimination, so it will add unused operations.
 *
 * Therefore it is highly recommended to use the babel or swc plugin for production.
 */
const documents = {
  'mutation CreatePet($input: CreatePetInput!) {\n  createPet(input: $input) {\n    id\n    name\n    owner {\n      id\n      pets {\n        id\n        name\n        owner {\n          id\n          name\n          pets {\n            id\n            name\n            owner {\n              id\n              name\n              pets {\n                id\n                name\n                owner {\n                  id\n                  name\n                }\n              }\n            }\n          }\n        }\n      }\n    }\n  }\n}':
    types.CreatePetDocument,
  'mutation RemovePet($id: ID!) {\n  removePet(id: $id) {\n    id\n    name\n    owner {\n      id\n      pets {\n        id\n        name\n        owner {\n          id\n          name\n          pets {\n            id\n            name\n            owner {\n              id\n              name\n            }\n          }\n        }\n      }\n    }\n  }\n}':
    types.RemovePetDocument,
  'mutation UpdateCar($carId: ID!, $input: CarInput!) {\n  updateCar(carId: $carId, input: $input) {\n    id\n    make\n    model\n  }\n}':
    types.UpdateCarDocument,
  'mutation UpdatePerson($personId: ID!, $input: PersonInput!) {\n  updatePerson(personId: $personId, input: $input) {\n    id\n    name\n  }\n}':
    types.UpdatePersonDocument,
  'mutation UpdatePet($petId: ID!, $input: UpdatePetInput!) {\n  updatePet(petId: $petId, input: $input) {\n    id\n    name\n  }\n}':
    types.UpdatePetDocument,
  'query Car($id: ID!) {\n  car(id: $id) {\n    id\n    make\n    model\n    owner {\n      id\n    }\n  }\n}':
    types.CarDocument,
  'query Person($id: ID!) {\n  person(id: $id) {\n    id\n    name\n    car {\n      id\n      make\n      model\n    }\n    pets {\n      id\n      name\n      owner {\n        id\n        name\n      }\n    }\n  }\n}':
    types.PersonDocument,
};

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 *
 *
 * @example
 * ```ts
 * const query = graphql(`query GetUser($id: ID!) { user(id: $id) { name } }`);
 * ```
 *
 * The query argument is unknown!
 * Please regenerate the types.
 */
export function graphql(source: string): unknown;

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: 'mutation CreatePet($input: CreatePetInput!) {\n  createPet(input: $input) {\n    id\n    name\n    owner {\n      id\n      pets {\n        id\n        name\n        owner {\n          id\n          name\n          pets {\n            id\n            name\n            owner {\n              id\n              name\n              pets {\n                id\n                name\n                owner {\n                  id\n                  name\n                }\n              }\n            }\n          }\n        }\n      }\n    }\n  }\n}'
): (typeof documents)['mutation CreatePet($input: CreatePetInput!) {\n  createPet(input: $input) {\n    id\n    name\n    owner {\n      id\n      pets {\n        id\n        name\n        owner {\n          id\n          name\n          pets {\n            id\n            name\n            owner {\n              id\n              name\n              pets {\n                id\n                name\n                owner {\n                  id\n                  name\n                }\n              }\n            }\n          }\n        }\n      }\n    }\n  }\n}'];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: 'mutation RemovePet($id: ID!) {\n  removePet(id: $id) {\n    id\n    name\n    owner {\n      id\n      pets {\n        id\n        name\n        owner {\n          id\n          name\n          pets {\n            id\n            name\n            owner {\n              id\n              name\n            }\n          }\n        }\n      }\n    }\n  }\n}'
): (typeof documents)['mutation RemovePet($id: ID!) {\n  removePet(id: $id) {\n    id\n    name\n    owner {\n      id\n      pets {\n        id\n        name\n        owner {\n          id\n          name\n          pets {\n            id\n            name\n            owner {\n              id\n              name\n            }\n          }\n        }\n      }\n    }\n  }\n}'];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: 'mutation UpdateCar($carId: ID!, $input: CarInput!) {\n  updateCar(carId: $carId, input: $input) {\n    id\n    make\n    model\n  }\n}'
): (typeof documents)['mutation UpdateCar($carId: ID!, $input: CarInput!) {\n  updateCar(carId: $carId, input: $input) {\n    id\n    make\n    model\n  }\n}'];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: 'mutation UpdatePerson($personId: ID!, $input: PersonInput!) {\n  updatePerson(personId: $personId, input: $input) {\n    id\n    name\n  }\n}'
): (typeof documents)['mutation UpdatePerson($personId: ID!, $input: PersonInput!) {\n  updatePerson(personId: $personId, input: $input) {\n    id\n    name\n  }\n}'];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: 'mutation UpdatePet($petId: ID!, $input: UpdatePetInput!) {\n  updatePet(petId: $petId, input: $input) {\n    id\n    name\n  }\n}'
): (typeof documents)['mutation UpdatePet($petId: ID!, $input: UpdatePetInput!) {\n  updatePet(petId: $petId, input: $input) {\n    id\n    name\n  }\n}'];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: 'query Car($id: ID!) {\n  car(id: $id) {\n    id\n    make\n    model\n    owner {\n      id\n    }\n  }\n}'
): (typeof documents)['query Car($id: ID!) {\n  car(id: $id) {\n    id\n    make\n    model\n    owner {\n      id\n    }\n  }\n}'];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: 'query Person($id: ID!) {\n  person(id: $id) {\n    id\n    name\n    car {\n      id\n      make\n      model\n    }\n    pets {\n      id\n      name\n      owner {\n        id\n        name\n      }\n    }\n  }\n}'
): (typeof documents)['query Person($id: ID!) {\n  person(id: $id) {\n    id\n    name\n    car {\n      id\n      make\n      model\n    }\n    pets {\n      id\n      name\n      owner {\n        id\n        name\n      }\n    }\n  }\n}'];

export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> =
  TDocumentNode extends DocumentNode<infer TType, any> ? TType : never;
