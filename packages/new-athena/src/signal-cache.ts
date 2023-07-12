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
  ReactiveAdapter,
  ReactiveSignal,
  Scalar,
  WithSignal,
} from './types.js';
import { createLinkNode, isLinkNode, isQuery, keyForQuery } from './utils.js';
import { createSignalProxy } from './signal-proxy.js';
import { traverse } from './traverse.js';
import { createSignal } from '@signalis/core';

export interface SignalCacheConfig {
  keys?: {
    [key: string]: KeyGetter;
  };
  signalAdapter?: ReactiveAdapter;
}

function defaultAdapter<T>(v: T): ReactiveSignal<T> {
  return createSignal(v, false);
}

const DEFAULT_CONFIG: SignalCacheConfig = {
  keys: {},
  signalAdapter: defaultAdapter,
};

export class SignalCache {
  signalAdapter: ReactiveAdapter;
  keys: KeyConfig;
  cache: Cache<DefaultRegistry, string, unknown, unknown>;
  links = new Map<string, Link>();
  records = new Map<string, Record<string, Scalar>>();
  signals = new Map<string, WeakRef<WithSignal<Entity>>>();
  private registry: FinalizationRegistry<string>;

  constructor(config: SignalCacheConfig = DEFAULT_CONFIG) {
    this.keys = config.keys ?? {};
    this.cache = buildCache();
    this.signalAdapter = config.signalAdapter ?? defaultAdapter;

    this.registry = new FinalizationRegistry((key) => {
      this.evict(key);
    });
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
          value.forEach((member) => {
            if (isLinkNode(member)) {
              arrayLink.push(member.__link);
            } else {
              // we don't have a link and we need to attach this to the value itself as the reactivity is owned by the parent
              recordArray.push(member);
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

  readQuery(op: Operation) {
    const { queryId, args } = op;
    const queryKey = keyForQuery(queryId, args);

    return this.resolve(queryKey);
  }

  // Given an entity key, this method will fully materialize all of the data for the given entity,
  // wrapping each entity in a signal proxy if it isn't already. If the signal proxy has already
  // been created, this method will ensure the underlying data is updated while maintaining
  // referential stability
  resolve(
    entityKey: string,
    visited: Set<string> = new Set<string>(),
    exploring: Set<string> = new Set<string>()
  ): WithSignal<Entity> {
    let root: WithSignal<Entity>;

    const links = this.links.get(entityKey);

    if (!links) {
      throw new Error(
        `@data-eden/athena - internal error: No entity found for ${entityKey}`
      );
    }

    exploring.add(entityKey);

    const signal = this.getSignal(entityKey);

    // If we've already visited this node in a given `resolve` computation, it means we've already
    // fully materialized its data and can just return it from the signal cache
    if (visited.has(entityKey) && signal) {
      return signal;
    }

    if (signal) {
      root = signal;
    } else {
      exploring.delete(entityKey);
      root = createSignalProxy(
        // the id is the source of the truth for the signal's cache key
        // it is import that this is set so that given a signal we know the cache key
        this.signalAdapter({
          __typename: '',
        })
      );
      this.signals.set(entityKey, new WeakRef(root));
      this.registry.register(root, entityKey);
    }

    Object.assign(root, this.records.get(entityKey));

    // These two variables are used to track when we're traversing through an array that we can
    // correctly map the position of the entity in the array
    let ArrayMetadata = new WeakMap<
      Array<string>,
      { key: string; array: Array<Entity> }
    >();
    let parentKey: (string | number) | null = null;
    let parentArray: Array<Entity> | null = null;

    traverse(links, (key, value, parent) => {
      if (Array.isArray(value)) {
        parentKey = key;

        if (!(parentKey in root)) {
          root[parentKey] = [];
        }

        // We know this has to exist because we just checked previously and created it if it was
        // missing
        parentArray = root[parentKey] as Array<Entity>;

        const meta = {
          key: parentKey,
          array: parentArray,
        };

        // We use this to identify when the underlying array in the signal proxy contains links
        // that the entity no longer does (e.g. a mutation has removed an entity from an array
        // of entities). In that case, we make sure to remove the entity from the proxy's array
        // as well
        const toRemove = parentArray.filter((v, i) => {
          let key = this.getKey(v);

          if (!key) {
            throw new Error(`@data-eden/athena: Need synthetic key for ${v}`);
          }

          // if (!key) {
          //   key = this.getSyntheticKey(
          //     // we know the prop is the key and value in the array as the second value
          //     // i is a number and needs to be a string to match the same value as provided in the first getSyntheticKey in process entities
          //     // TODO: props should be a function we can normalize to avoid this
          //     {
          //       entity: v,
          //       parent: root,
          //       prop: [parentKey as string, i.toString()],
          //     },
          //     this.getCacheKey
          //   );
          // }

          return !value.includes(key);
        });

        for (let entity of toRemove) {
          const idx = parentArray.findIndex((v) => v === entity);
          if (idx !== -1) {
            parentArray.splice(idx, 1);
          }
        }

        ArrayMetadata.set(value, meta);

        return true;
      }

      if (Array.isArray(parent)) {
        const meta = ArrayMetadata.get(parent);

        if (meta !== undefined) {
          parentKey = meta.key;
          parentArray = meta.array;
        }
      } else {
        parentKey = null;
        parentArray = null;
      }

      // If this node is already being explored, we're in a cycle and need to bail
      if (exploring.has(value)) {
        // Once we know we're going to bail on this particular traversal, we remove the key
        // from `exploring` so that it won't block subsequent traversals from ever resolving the
        // value. This comes up in the case where you have an array of entities that
        // each point to a common entity, e.g. an array of comment posts that each contain a link
        // to the same author. When traversing an individual comment, we don't want to traverse
        // infinitely, but we also don't want to prevent subsequent comment traversal from being
        // able to materialize their author field.
        exploring.delete(value);
        return false;
      }

      exploring.add(value);

      const resolved = this.resolve(value, visited, exploring);

      if (resolved) {
        if (parentArray) {
          // If parentArray exists, then we know we are traversing through an array, so each key
          // is an index number
          parentArray[key as unknown as number] = resolved;
        } else {
          root[key] = resolved;
        }
      }

      // If we've made it here, it means that we've fully traversed all the elements in this path
      // and can mark this node as having been visited so we don't traverse it again
      exploring.delete(value);
      visited.add(value);

      return true;
    });

    exploring.delete(entityKey);
    visited.add(entityKey);

    if (typeof root === 'undefined') {
      throw new Error(
        `@data-eden/athena - No entity found when attempting to resolve ${entityKey}`
      );
    }

    return root;
  }

  evict(entityKey: string) {
    this.records.delete(entityKey);
    this.signals.delete(entityKey);
    this.links.delete(entityKey);

    traverse(Object.fromEntries(this.links), (key, value, parent) => {
      if (Array.isArray(value)) {
        const idx = value.findIndex((v) => v === entityKey);
        if (idx !== -1) {
          value.splice(idx, 1);
        }
        // we've already determined whether or not this particular array contains the entity key
        // or not, so there's no reason traverse down this path further
        return false;
      }

      if (typeof value === 'string') {
        if (value === entityKey) {
          delete parent[key];
        }
      }

      return true;
    });
  }

  private getSignal(key: string): WithSignal<Entity> | undefined {
    const ref = this.signals.get(key);

    if (ref === undefined) {
      // In this case, it simply means we haven't create the signal proxy yet
      // and want to signal that to the caller
      return ref;
    }

    const signal = ref.deref();

    if (signal === undefined) {
      // The signal was GC'd but the finalizer hasn't run yet, so we can
      // evict proactively
      this.evict(key);
    }

    return signal;
  }
}
