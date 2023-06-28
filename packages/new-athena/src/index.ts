import { type DocumentNode, type GraphQLError } from 'graphql';
import type { TypedDocumentNode } from '@graphql-typed-document-node/core';
import type { Cache } from '@data-eden/cache';
import { type DefaultRegistry, buildCache } from '@data-eden/cache';
import { set } from 'lodash-es';
import { traverse } from './traverse.js';
import type { Data, DataField, Entity } from './index.js';
import type { Entries } from 'type-fest';

export type Primitive =
  | null
  | undefined
  | string
  | number
  | boolean
  | symbol
  | bigint;

export type DefaultVariables = Record<string, object | Primitive> | undefined;
export type DefaultRecord = Record<string, object>;

interface LinkNode {
  __link: string;
}

export function createLinkNode(key: string): LinkNode {
  return {
    __link: key,
  };
}

export function isOperation(operation: unknown): operation is Operation {
  return (
    typeof operation === 'object' &&
    operation !== null &&
    'type' in operation &&
    'name' in operation &&
    'queryId' in operation
  );
}

export type CacheKey = string;
export type PropertyPath = string | number | Array<string | number>;

export interface ClientError {
  graphql?: Array<string | GraphQLError>;
  network?: unknown;
}

export interface OperationResult {
  data?: Data;
  error?: ClientError;
}

export interface ParsedEntity {
  entity: Entity;
  parent: Entity | null;
  prop: string | number | Array<string | number>;
  id: string;
}

export function isEntity(obj: unknown): obj is Entity {
  return typeof obj === 'object' && obj !== null && '__typename' in obj;
}

interface Operation<
  Data extends DefaultRecord = DefaultRecord,
  Variables extends DefaultVariables = DefaultVariables
> {
  type: 'mutation' | 'query' | 'subscription';
  /*
    In the case of:

    query getComments() {
        id
        message
    }

    name would be `getComments` and populated in __meta__ by codegen
  */
  name: string;
  queryId: string;
  querySource?: DocumentNode | TypedDocumentNode<Data, Variables>;
  arguments: Record<string, object | Primitive>;
  result?: OperationResult;
}

export interface BaseFields {
  id?: string;
  __typename: string;
}

export type Scalar = string | number | boolean | null | undefined;

export type DataField = Scalar | Data | Array<Scalar> | Array<Data>;

interface DataFields {
  [fieldName: string]: DataField;
}

export type Data = BaseFields & DataFields;

export type Entity = Data;

export type KeyGetter = (data: Data) => string | null;

interface SignalCacheConfig {
  keys?: {
    [key: string]: KeyGetter;
  };
}

export type KeyConfig = {
  [typeName: string]: KeyGetter;
};

export class SignalCache {
  keys: KeyConfig;
  cache: Cache<DefaultRegistry, string, unknown, unknown>;

  constructor(config?: SignalCacheConfig) {
    this.keys = config?.keys ?? {};
    this.cache = buildCache();
  }

  async store(op: Operation) {
    const { result } = op;

    if (!result) {
      throw new Error(
        '@data-eden/athena: Operations must have a `result` when passed to `SignalCache#store`.'
      );
    }

    if (!result.data) {
      throw new Error(
        '@data-eden/athena: Expected operation result to contain `data` but it did not.'
      );
    }

    const tx = await this.cache.beginTransaction();

    // This object maps "root" entities from a graphql docment to the key used to store them in the
    // cache. We will later use this mapping to reconstitute all of the entities and construct
    // the result to pass back to the caller
    const roots = new Map<PropertyPath, CacheKey>();
    const parsedEntities = this.parse(result.data.__typename, result.data);

    for (const { parent, prop, entity } of parsedEntities) {
      let key = this.getKey(entity);

      // replace the entity object with the key we're using to store it in the cache so that we can
      // later replace the key with the reactive entity
      // e.g. { pet: { id: 1, name: hitch }} -> { pet: 'pet:1' }
      if (parent && prop) {
        set(parent, prop, createLinkNode(key));
      }

      if (!parent) {
        roots.set(prop, key);
      }

      await tx.merge(key, entity);
    }

    await tx.commit();

    // for await (let entry of tx.localEntries()) {
    //   const [key, entity] = entry;
    //   // Entity can also be string | number so we need to make sure it's actually an object here
    //   if (isEntity(entity)) {
    //     signalCache.storeEntity(key, entity, !!tx.context.fetchMore); //op.type
    //   }
    // }
  }

  // DFS through each top-level element in document.data because it's possible that a gql operation
  // can return sibling entities and we need to treat each of them as root entities for the sake
  // of finding child entities
  parse(
    prop: string | number | Array<string | number>,
    entry: DataField
  ): Array<ParsedEntity> {
    const result: Array<ParsedEntity> = [];

    // This tracks the property we're in if we are currently traversing through an array
    let currentArrayProp: string | null;
    let ArrayMetadata = new WeakMap<
      Array<Entity>,
      { key: string; parent: Entity }
    >();

    let root: Entity | undefined = undefined;

    // This is the root level operation
    if (isEntity(entry)) {
      const key = this.getKey(entry);
      if (!key) {
        throw new Error(
          `@data-eden/athena: We couldn't find a key for ${entry.__typename} and could not generate a synthetic one since this is a top level object. Provide a key generator in \`keys\` for ${entry.__typename}.`
        );
      }

      root = entry;
      result.push({
        id: key,
        entity: entry,
        parent: null,
        prop: prop,
      });
    }

    traverse(entry, (key, value, parent) => {
      let parentEntity: Entity | null = null;

      if (isEntity(value)) {
        if (Array.isArray(parent)) {
          // if we're here, it means we're in a hasMany relationship and need to track which property
          // got us here so we can refer back to the property key when linking entities later,
          // e.g. { pets: [ { name: 'hitch', id: 1 }]} will have a prop value of `pets[0]` so we know
          // how to get to it from the parent
          const meta = ArrayMetadata.get(parent as Array<Entity>) || null;
          if (meta) {
            currentArrayProp = meta.key;
            parentEntity = meta.parent;
          }
        } else {
          if (isEntity(parent)) {
            parentEntity = parent;
          }
          currentArrayProp = null;
        }

        if (result.length === 0) {
          const key = this.getKey(value);

          if (!key) {
            throw new Error(
              `@data-eden/athena: We couldn't find a key for ${value.__typename} and could not generate a synthetic one since this is a top level object. Provide a key generator in \`keys\` for ${value.__typename}.`
            );
          }

          // if the result array is empty, then this is the first entity we've found, and is therefore
          // the root entity, so we special-case it and set the parent and prop
          result.push({
            id: key,
            entity: value,
            parent: null,
            prop: key,
          });
        } else {
          const prop = currentArrayProp ? [currentArrayProp, key] : key;

          result.push({
            id: this.getKey(value) ?? `${parentEntity.id}:${prop}`,
            entity: value,
            parent: parentEntity,
            prop,
          });
        }

        return true;
      }

      if (Array.isArray(value)) {
        if (!Array.isArray(parent) && isEntity(parent)) {
          // If we've arrived here, we know that we're traversing through an array of entities
          // because the parent is an entity and the current value is an array
          ArrayMetadata.set(value as Array<Entity>, {
            parent,
            key,
          });
        }
        return true;
      }

      // If we haven't found the root yet, just keep digging
      if (root === undefined) {
        return true;
      }

      return false;
    });

    return result.reverse();
  }

  getKey(entity: Entity): null | string {
    if (!entity) {
      return null;
    }

    const typename = entity.__typename;

    if (!typename) {
      return null;
    }

    if (['Query', 'Mutation', 'Subscription'].includes(typename)) {
      return typename;
    }

    if (this.keys[typename]) {
      return this.keys[typename](entity) ?? null;
    } else if (entity.id) {
      return entity.id;
    } else {
      console.warn(
        `@data-eden/athena: no key derived for ${typename}. If this is intentional please provide a key generator in \`keys\` for ${typename} that always returns null.`
      );

      return null;
    }
  }

  computeCacheKey(entity: Entity): string;
  computeCacheKey(operation: Operation): string;
  computeCacheKey(entityOrOperation: Entity | Operation): string {
    if (isOperation(entityOrOperation)) {
      const stringParts: Array<string> = [];
      stringParts.push(entityOrOperation.queryId);
      stringParts.push('(');

      const entries = Object.entries(entityOrOperation.arguments);
      const len = entries.length;

      Object.entries(entityOrOperation.arguments).forEach(
        ([key, value], idx) => {
          stringParts.push(key);
          stringParts.push(': ');
          stringParts.push(JSON.stringify(value));
          if (idx < len - 1) {
            stringParts.push(', ');
          }
        }
      );

      stringParts.push(')');

      return `${entityOrOperation.type}:${stringParts.join('')}`;
    }

    const entity = entityOrOperation;

    return entity.id;

    // if (isEntity(entity)) {
    //   let key = this.getKey(entity);

    //   if (key) {
    //     return `${entity.__typename}:${key}`;
    //   } else {
    //     if (!entity) {
    //       throw new Error(
    //         '@data-eden/athena: Unable to derive key for entity which is undefined'
    //       );
    //     } else {
    //       key = `${entity.__typename}:${btoa(
    //         JSON.stringify({
    //           prop: entityOrOperation.prop,
    //           parentId:
    //             entityOrOperation.parent &&
    //             this.computeCacheKey({ entity: entityOrOperation.parent }),
    //           entityType: entity.__typename,
    //         })
    //       )}`;
    //     }
    //   }

    //   return key;
    // } else {
    //   throw new Error(
    //     '@data-eden/athena: Unable to derive key for entity or operation'
    //   );
    // }
  }

  async processEntities<Data extends { [key: string]: any }>(
    response: Data,
    operation?: Operation<Data>
  ): Promise<Data> {
    const parsedEntitiesList = parseEntities(response);

    // This object maps "root" entities from a graphql docment to the key used to store them in the
    // cache. We will later use this mapping to reconstitute all of the entities and construct
    // the result to pass back to the caller
    const roots = new Map<PropertyPath, CacheKey>();

    /**
     *`parseEntities` returns an array of arrays, where each inner array corresponds to a root
     * entity in a document, and contains the root and all of its children
     * e.g.
     * {
     *   person -> pet1, pet2
     *   car
     * }
     *
     * would result in
     * [
     *   [ pet2, pet1, person],
     *   [ car ]
     * ]
     */
    // const tx = await this.cache.beginTransaction({
    //   fetchMore: !!operation?.fetchMore,
    // });

    // for (const parsedEntities of parsedEntitiesList) {
    //   for (const { parent, prop, entity } of parsedEntities) {
    //     let key = this.getCacheKey(entity);

    //     if (!key) {
    //       // set a synthetic shallow cache key
    //       key = this.getSyntheticKey(
    //         { parent, prop, entity },
    //         this.getCacheKey
    //       );
    //     }

    //     // replace the entity object with the key we're using to store it in the cache so that we can
    //     // later replace the key with the reactive entity
    //     // e.g. { pet: { id: 1, name: hitch }} -> { pet: 'pet:1' }
    //     if (parent && prop) {
    //       set(parent, prop, createLinkNode(key));
    //     }

    //     if (!parent) {
    //       roots.set(prop, key);
    //     }

    //     await tx.merge(key, entity);
    //   }
    // }
    // await tx.commit();

    // const result = {} as Data;

    // for (const [propertyPath, cacheKey] of roots.entries()) {
    //   set(result, propertyPath, this.signalCache.resolve(cacheKey));
    // }

    // if (operation) {
    //   this.signalCache.storeOperation(operation, roots);
    // }

    return result;
  }

  storeEntity() {}
  resolve(op: Operation | Entity) {}
  evict() {}
}
