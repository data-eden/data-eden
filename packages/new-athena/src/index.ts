import { type DocumentNode, type GraphQLError } from 'graphql';
import type { TypedDocumentNode } from '@graphql-typed-document-node/core';
import type { Cache } from '@data-eden/cache';
import { DefaultRegistry, buildCache } from '@data-eden/cache';

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

export interface ClientError {
  graphql?: Array<string | GraphQLError>;
  network?: unknown;
}

export interface OperationResult {
  data?: Data;
  error?: ClientError;
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

/**
 * raw JSON blob -> normalize -> [ record, links ] -> resolve -> signal blob -> UI
 */

/**
 * resolvers: {
 *  Query: {
 *    comments: pagination()
 *  }
 * }
 */

// export const CreateOnePetDocument = {
//   __meta__: {
//     queryId: '2418fa9c2c9325b1484fd9c96c06a51871c2ca41893ddf3c57c318ae071fe9ec', } }

// {Query: {
//   comments: (op: Operation, oldValue: any, newValue: any) {
//     if(op.queryId === CreateOnePetDocument.__meta__.queryId) {

//     }
//   }
// }

// export type CreateOnePetMutation = {
//   __typename: 'Mutation';
//   createPet: { __typename: 'Pet'; id: string; name: string };
// };

// 12345 -> query getComments() {
//   id
//   message
// }

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

export type Entity = null | Data;

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

    const key = this.getKey(result.data);

    if (!key) return null;

    await tx.merge(key, result);

    const entities =

    await tx.commit();

    for await (let entry of tx.localEntries()) {
      const [key, entity] = entry;
      // Entity can also be string | number so we need to make sure it's actually an object here
      if (isEntity(entity)) {
        signalCache.storeEntity(key, entity, !!tx.context.fetchMore); //op.type
      }
    }
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
      return null;
    }
  }

    async processEntities<Data extends { [key: string]: any }>(
    response: Data,
    operation?: GraphQLOperation<Data>
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
    const tx = await this.cache.beginTransaction({
      fetchMore: !!operation?.fetchMore,
    });

    for (const parsedEntities of parsedEntitiesList) {
      for (const { parent, prop, entity } of parsedEntities) {
        let key = this.getCacheKey(entity);

        if (!key) {
          // set a synthetic shallow cache key
          key = this.getSyntheticKey(
            { parent, prop, entity },
            this.getCacheKey
          );
        }

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
    }
    await tx.commit();

    const result = {} as Data;

    for (const [propertyPath, cacheKey] of roots.entries()) {
      set(result, propertyPath, this.signalCache.resolve(cacheKey));
    }

    if (operation) {
      this.signalCache.storeOperation(operation, roots);
    }

    return result;
  }
}

  storeEntity() {}
  resolve(op: Operation | Entity) {}
  evict() {}
}
