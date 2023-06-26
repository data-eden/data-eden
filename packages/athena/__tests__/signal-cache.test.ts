/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { createSignal } from '@signalis/core';
import { beforeEach, describe, expect, test } from 'vitest';
import type { Link } from '../src/signal-cache.js';
import { SignalCache } from '../src/signal-cache.js';

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

function expectMap(v: Map<any, any>) {
  return expect(Object.fromEntries(v));
}

describe('signal cache', () => {
  describe('cache#storeOperation', () => {
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

      const variables = { id: 1 };

      cache.storeOperation(
        { query, variables },
        new Map(Object.entries({ person: 'Person:1' }))
      );

      expectMap(cache.queryLinks).toEqual({
        [JSON.stringify({ query, variables })]: {
          person: 'Person:1',
        },
      });
    });

    test('query with multiple roots', () => {
      const query = `query Person($id: ID, $carID: ID) {
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

        car(carId: $carId) {
          id
          make
          __typename
        }
      }`;

      const variables = { id: 1, carId: 1 };

      cache.storeOperation(
        { query, variables },
        new Map(
          Object.entries({
            person: 'Person:1',
            car: 'Car:1',
          })
        )
      );

      expectMap(cache.queryLinks).toEqual({
        [JSON.stringify({ query, variables })]: {
          person: 'Person:1',
          car: 'Car:1',
        },
      });
    });
  });

  describe('cache#readOperation', () => {
    const operation = {
      query: 'blah',
      variables: {
        id: '1',
      },
    };

    test('can resolve a stored operation', () => {
      const cache = new SignalCache((v) => createSignal(v, false));
      cache.storeOperation(
        operation,
        new Map(Object.entries({ person: 'Person:1' }))
      );
      cache.storeEntity('Person:1', { ...Person1 });

      const result = cache.readOperation(operation);
      expect(result).not.toBeUndefined();
      expect(result).toHaveProperty('person');
      expect(result!.person).toEqual(Person1);
    });

    test('returns undefined if TTL has expired', async () => {
      const cache = new SignalCache(
        (v) => createSignal(v, false),
        undefined,
        undefined,
        undefined,
        250
      );
      cache.storeOperation(
        operation,
        new Map(Object.entries({ person: 'Person:1' }))
      );
      cache.storeEntity('Person:1', { ...Person1 });

      await new Promise<void>((resolve) => {
        setTimeout(() => {
          resolve();
        }, 500);
      });

      const result = cache.readOperation(operation);
      expect(result).toBeUndefined();
    });
  });

  describe('cache#resolve', () => {
    let cache: SignalCache;

    beforeEach(() => {
      cache = new SignalCache((v) => createSignal(v, false));

      cache.queryLinks = new Map(
        Object.entries({
          '{"query": "blah", "variables": {"id": "1"}}': {
            person: 'Person:1',
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
      const result = cache.resolve(
        '{"query": "blah", "variables": {"id": "1"}}'
      );

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
