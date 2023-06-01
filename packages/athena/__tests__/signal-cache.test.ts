/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { beforeEach, describe, expect, test } from 'vitest';
import type { Link } from '../src/signal-cache.js';
import { SignalCache } from '../src/signal-cache.js';
import { parse } from 'graphql';
import { createSignal } from '@signalis/core';

const Person1 = {
  id: '1',
  name: 'Foo',
  __typename: 'Person',
};

const Pet1 = {
  id: '1',
  name: 'Hitch',
  __typename: 'Pet',
};

const Pet2 = {
  id: '2',
  name: 'Dre',
  __typename: 'Pet',
};

const Car1 = {
  id: '1',
  make: 'Ford',
  model: 'Mustang',
  __typename: 'Car',
};

function expectMap(v: Map<any, any>) {
  return expect(Object.fromEntries(v));
}

describe('signal cache', () => {
  describe('cache#store', () => {
    let cache: SignalCache;

    beforeEach(() => {
      cache = new SignalCache((v) => createSignal(v, false));
    });

    test('simple query', () => {
      const query = `query Person($id: ID) {
        person(id: $id) {
          id
          name
          __typename
        }
      }`;

      const payload = {
        query: parse(query),
        variables: { id: 1 },
        result: [
          {
            key: 'Person:1',
            entity: {
              ...Person1,
            },
          },
        ],
      };

      cache.store(payload);

      expectMap(cache.queryLinks).toEqual({
        'person(id: 1)': {
          person: 'Person:1',
        },
      });

      expectMap(cache.links).toEqual({
        'Person:1': {},
      });

      expectMap(cache.records).toEqual({
        'Person:1': {
          ...Person1,
        },
      });
    });

    test('query with link', () => {
      const query = `query Person($id: ID) {
        person(id: $id) {
          id
          name
          __typename
          car {
            id
            make
            model
            __typename
          }
        }
      }`;

      const payload = {
        query: parse(query),
        variables: { id: 1 },
        result: [
          {
            key: 'Person:1',
            entity: {
              ...Person1,
              car: { __link: 'Car:1' },
            },
          },
          {
            key: 'Car:1',
            entity: {
              ...Car1,
            },
          },
        ],
      };

      cache.store(payload);

      expectMap(cache.queryLinks).toEqual({
        'person(id: 1)': {
          person: 'Person:1',
        },
      });

      expectMap(cache.links).toEqual({
        'Person:1': {
          car: 'Car:1',
        },
        'Car:1': {},
      });

      expectMap(cache.records).toEqual({
        'Person:1': {
          ...Person1,
        },
        'Car:1': {
          ...Car1,
        },
      });
    });

    test('query with array link', () => {
      const query = `query Person($id: ID) {
        person(id: $id) {
          id
          name
          __typename
          pets {
            id
            name
            __typename
          }
        }
      }`;

      const payload = {
        query: parse(query),
        variables: { id: 1 },
        result: [
          {
            key: 'Person:1',
            entity: {
              ...Person1,
              pets: [
                {
                  __link: 'Pet:1',
                },
                {
                  __link: 'Pet:2',
                },
              ],
            },
          },
          {
            key: 'Pet:1',
            entity: {
              ...Pet1,
            },
          },
          {
            key: 'Pet:2',
            entity: {
              ...Pet2,
            },
          },
        ],
      };

      cache.store(payload);

      expectMap(cache.queryLinks).toEqual({
        'person(id: 1)': {
          person: 'Person:1',
        },
      });

      expectMap(cache.links).toEqual({
        'Person:1': {
          pets: ['Pet:1', 'Pet:2'],
        },
        'Pet:1': {},
        'Pet:2': {},
      });

      expectMap(cache.records).toEqual({
        'Person:1': {
          ...Person1,
        },
        'Pet:1': {
          ...Pet1,
        },
        'Pet:2': {
          ...Pet2,
        },
      });
    });

    test('mutation', () => {
      const mutation = `mutation UpdatePerson($personId: ID!, $input: PersonInput!) {
        updatePerson(personId: $personId, input: $input) {
          id
          name
        }
      }`;

      cache.queryLinks = new Map(
        Object.entries({
          'person(id: 1)': {
            person: 'Person:1',
          },
        })
      );

      cache.links = new Map(
        Object.entries({
          'Person:1': {},
        })
      );

      cache.records = new Map(
        Object.entries({
          'Person:1': {
            ...Person1,
          },
        })
      );

      const payload = {
        query: parse(mutation),
        variables: {
          personId: 1,
          input: {
            name: 'Bar',
          },
        },
        result: [
          {
            key: 'Person:1',
            entity: {
              ...Person1,
              name: 'Bar',
            },
          },
        ],
      };

      cache.store(payload);

      expectMap(cache.queryLinks).toEqual({
        'person(id: 1)': {
          person: 'Person:1',
        },
        'updatePerson(personId: 1, input: {"name":"Bar"})': {
          updatePerson: 'Person:1',
        },
      });

      expectMap(cache.links).toEqual({
        'Person:1': {},
      });

      expectMap(cache.records).toEqual({
        'Person:1': {
          ...Person1,
          name: 'Bar',
        },
      });
    });
  });

  describe('cache#resolve', () => {
    let cache: SignalCache;

    beforeEach(() => {
      cache = new SignalCache((v) => createSignal(v, false));

      cache.queryLinks = new Map(
        Object.entries({
          'person(id: 1)': {
            person: 'Person:1',
          },
          'updatePerson(personId: 1, input: {"name":"Bar"})': {
            updatePerson: 'Person:1',
          },
        } as Record<string, Link>)
      );

      cache.links = new Map(
        Object.entries({
          'Person:1': {
            pets: ['Pet:1', 'Pet:2'],
          },
          'Pet:1': {},
          'Pet:2': {},
        } as Record<string, Link>)
      );

      cache.records = new Map(
        Object.entries({
          'Person:1': {
            ...Person1,
          },
          'Pet:1': {
            ...Pet1,
          },
          'Pet:2': {
            ...Pet2,
          },
        })
      );
    });

    test(`errors appropriately when resolving a key that doesn't exist`, () => {
      expect(() => cache.resolve('foo:2')).toThrowError(
        'No entity found for foo:2'
      );
    });

    test('can resolve entity key with array links', () => {
      const result = cache.resolve('Person:1');

      expect(result).toEqual({
        ...Person1,
        pets: [{ ...Pet1 }, { ...Pet2 }],
      });
    });

    test('can resolve query key', () => {
      const result = cache.resolve('person(id: 1)');

      expect(result.person).toMatchObject({
        ...Person1,
      });

      expect(result.person.pets).toHaveLength(2);

      expect(result.person.pets[0]).toMatchObject({
        ...Pet1,
      });

      expect(result.person.pets[1]).toMatchObject({
        ...Pet2,
      });
    });

    test('can resolve mutation key', () => {
      const result = cache.resolve(
        'updatePerson(personId: 1, input: {"name":"Bar"})'
      );

      expect(result).toMatchObject({
        updatePerson: {
          ...Person1,
          pets: [{ ...Pet1 }, { ...Pet2 }],
        },
      });
    });

    test('can resolve cycle with singular property', () => {
      cache.evict('Person:1');
      cache.evict('Pet:1');

      cache.storeEntity('Person:1', {
        ...Person1,
        pet: {
          __link: 'Pet:1',
        },
      });

      cache.storeEntity('Pet:1', {
        ...Pet1,
        owner: {
          __link: 'Person:1',
        },
      });

      const result = cache.resolve('Pet:1');

      expect(result.__typename).toEqual('Pet');
      expect(result.name).toEqual('Hitch');
      expect(result.owner.__typename).toEqual('Person');
      expect(result.owner.pet.owner.__typename).toEqual('Person');
      expect(result.owner.pet.name).toEqual('Hitch');
    });

    test('can resolve cycle with array property', () => {
      cache.evict('Person:1');
      cache.evict('Pet:1');

      cache.storeEntity('Person:1', {
        ...Person1,
        pets: [
          {
            __link: 'Pet:1',
          },
        ],
      });

      cache.storeEntity('Pet:1', {
        ...Pet1,
        owner: {
          __link: 'Person:1',
        },
      });

      const result = cache.resolve('Pet:1');

      expect(result.__typename).toEqual('Pet');
      expect(result.name).toEqual('Hitch');
      expect(result.owner.__typename).toEqual('Person');
      expect(result.owner.pets[0].name).toEqual('Hitch');
      expect(result.owner.pets[0].owner.__typename).toEqual('Person');
    });

    test('can resolve cycle with array property with multiple values', () => {
      cache.evict('Person:1');
      cache.evict('Pet:1');

      cache.storeEntity('Person:1', {
        ...Person1,
        pets: [
          {
            __link: 'Pet:1',
          },
          {
            __link: 'Pet:2',
          },
        ],
      });

      cache.storeEntity('Pet:1', {
        ...Pet1,
        owner: {
          __link: 'Person:1',
        },
      });

      cache.storeEntity('Pet:2', {
        ...Pet2,
        owner: {
          __link: 'Person:1',
        },
      });

      const pet1 = cache.resolve('Pet:1');

      expect(pet1.__typename).toEqual('Pet');
      expect(pet1.name).toEqual('Hitch');
      expect(pet1.owner.__typename).toEqual('Person');
      expect(pet1.owner.name).toEqual('Foo');
      expect(pet1.owner.pets[0].name).toEqual('Hitch');
      expect(pet1.owner.pets[0].owner.__typename).toEqual('Person');

      const pet2 = cache.resolve('Pet:2');

      expect(pet2.__typename).toEqual('Pet');
      expect(pet2.name).toEqual('Dre');
      expect(pet2.owner.__typename).toEqual('Person');
      expect(pet2.owner.name).toEqual('Foo');
      expect(pet2.owner.pets[1].name).toEqual('Dre');
      expect(pet2.owner.pets[1].owner.__typename).toEqual('Person');

      // Owners for both pets should be the same object
      expect(pet1.owner).toBe(pet2.owner);
    });
  });

  describe('cache#evict', () => {
    let cache: SignalCache;

    beforeEach(() => {
      cache = new SignalCache((v) => createSignal(v, false));
    });

    test('can evict a flat entity', () => {
      cache.storeEntity('Person:1', {
        ...Person1,
      });

      expectMap(cache.records).toEqual({
        'Person:1': {
          ...Person1,
        },
      });

      cache.evict('Person:1');

      expectMap(cache.records).toEqual({});
    });

    test('can evict an entity with a link', () => {
      cache.storeEntity('Person:1', {
        ...Person1,
        pet: {
          __link: 'Pet:1',
        },
      });

      cache.storeEntity('Pet:1', {
        ...Pet1,
        owner: {
          __link: 'Person:1',
        },
      });

      expectMap(cache.records).toEqual({
        'Person:1': {
          ...Person1,
        },
        'Pet:1': {
          ...Pet1,
        },
      });

      expectMap(cache.links).toEqual({
        'Person:1': {
          pet: 'Pet:1',
        },
        'Pet:1': {
          owner: 'Person:1',
        },
      });

      cache.evict('Pet:1');

      expectMap(cache.records).toEqual({
        'Person:1': {
          ...Person1,
        },
      });

      expectMap(cache.links).toEqual({
        'Person:1': {},
      });
    });

    test('can evict an entity with an array of links', () => {
      cache.storeEntity('Person:1', {
        ...Person1,
        pets: [
          {
            __link: 'Pet:1',
          },
          {
            __link: 'Pet:2',
          },
        ],
      });

      cache.storeEntity('Pet:1', {
        ...Pet1,
        owner: {
          __link: 'Person:1',
        },
      });

      cache.storeEntity('Pet:2', {
        ...Pet2,
        owner: {
          __link: 'Person:1',
        },
      });

      expectMap(cache.records).toEqual({
        'Person:1': {
          ...Person1,
        },
        'Pet:1': {
          ...Pet1,
        },
        'Pet:2': {
          ...Pet2,
        },
      });

      expectMap(cache.links).toEqual({
        'Person:1': {
          pets: ['Pet:1', 'Pet:2'],
        },
        'Pet:1': {
          owner: 'Person:1',
        },
        'Pet:2': {
          owner: 'Person:1',
        },
      });

      cache.evict('Pet:1');

      expectMap(cache.records).toEqual({
        'Person:1': {
          ...Person1,
        },
        'Pet:2': {
          ...Pet2,
        },
      });

      expectMap(cache.links).toEqual({
        'Person:1': {
          pets: ['Pet:2'],
        },
        'Pet:2': {
          owner: 'Person:1',
        },
      });
    });
  });
});
