import type { DefaultRegistry } from '@data-eden/cache';
import { buildCache, type Cache } from '@data-eden/cache';
import { set } from 'lodash-es';
import type { Entries } from 'type-fest';
import { parse } from './parse.js';
import type {
  Data,
  Entity,
  KeyConfig,
  KeyGetter,
  Link,
  Operation,
  ParsedEntity,
  Scalar,
} from './types.js';
import { createLinkNode, isLinkNode, isQuery, keyForQuery } from './utils.js';

export interface SignalCacheConfig {
  keys?: {
    [key: string]: KeyGetter;
  };
}

export class SignalCache {
  keys: KeyConfig;
  cache: Cache<DefaultRegistry, string, unknown, unknown>;
  links = new Map<string, Link>();
  records = new Map<string, Record<string, Scalar>>();
  // signals = new Map<string, WeakRef<WithSignal<Entity>>>();

  constructor(config?: SignalCacheConfig) {
    this.keys = config?.keys ?? {};
    this.cache = buildCache();
  }

  async writeQuery(op: Operation) {
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

    const queryEntity = result.data;

    if (!isQuery(queryEntity)) {
      throw new Error(
        '@data-eden/athena: You may only pass Query operations to `writeQuery`.'
      );
    }

    const queryKey = keyForQuery(op.queryId, op.args);
    // This object maps "root" entities from a graphql docment to the key used to store them in the
    // cache. We will later use this mapping to reconstitute all of the entities and construct
    // the result to pass back to the caller
    const parsedEntities = this.parse(result.data);

    const tx = await this.cache.beginTransaction();
    await tx.merge(queryKey, queryEntity);
    await tx.commit();

    for (const { parent, prop, entity, cacheKey } of parsedEntities) {
      // replace the entity object with the key we're using to store it in the cache so that we can
      // later replace the key with the reactive entity
      // e.g. { pet: { id: 1, name: hitch }} -> { pet: 'pet:1' }
      if (parent && prop) {
        set(parent, prop, createLinkNode(cacheKey));
      }

      if (!parent) {
        this.storeEntity(queryKey, entity);
      } else {
        this.storeEntity(cacheKey, entity);
      }
    }
  }

  storeEntity(key: string, entity: Entity) {
    const record = this.records.get(key) || {};
    const links = this.links.get(key) || {};

    (Object.entries(entity) as Entries<typeof entity>).forEach(
      ([entityKey, value]) => {
        /**
         * I'm pretty sure this should just go away. If we want resolvers, we need to implement them
         * more carefully, and `fetchMore` is bad
         */
        // if (
        //   fetchMore &&
        //   this.mergeResolvers &&
        //   this.mergeResolvers[entity.__typename] &&
        //   this.mergeResolvers[entity.__typename][entityKey]
        // ) {
        //   try {
        //     value = this.mergeResolvers[entity.__typename][entityKey](
        //       links[entityKey],
        //       value
        //     );
        //   } catch (e: unknown) {
        //     console.error(
        //       `failure to enact custom resolver strategy for ${
        //         entity.__typename
        //       }:${entityKey} with failure ${JSON.stringify(e)}`
        //     );
        //   }
        // }

        if (Array.isArray(value)) {
          const arrayLink: Array<string> = [];
          const recordArray: any[] = [];
          value.forEach((link) => {
            if (isLinkNode(link)) {
              arrayLink.push(link.__link);
            } else {
              // we don't have a link and we need to attach this to the value itself as the reactivity is owned by the parent
              recordArray.push(link);
            }
          });
          links[entityKey] = arrayLink;
        } else if (isLinkNode(value)) {
          links[entityKey] = value.__link;
        } else {
          // If value is not an array of links or a link itself, then it must be a scalar
          record[entityKey] = value as Scalar;
        }
      }
    );

    this.links.set(key, links);
    this.records.set(key, record);
  }

  parse(entity: Entity): Array<ParsedEntity> {
    return parse(entity, (entity: Data) => this.getKey(entity));
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

    let key: string | null = null;

    if (this.keys[typename]) {
      key = this.keys[typename](entity) ?? null;
    } else if (entity.id) {
      key = entity.id;
    } else {
      console.warn(
        `@data-eden/athena: no key derived for ${typename}. If this is intentional please provide a key generator in \`keys\` for ${typename} that always returns null.`
      );
    }

    if (key) {
      return `${typename}:${key}`;
    }

    return null;
  }
}
