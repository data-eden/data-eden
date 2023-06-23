import { addMilliseconds, getTime } from 'date-fns';
import type { Entries } from 'type-fest';
import type { CacheKey, PropertyPath } from './client.js';
import { createSignalProxy } from './signal-proxy.js';
import { traverse } from './traverse.js';
import type {
  DefaultVariables,
  Entity,
  GraphQLOperation,
  IdFetcher,
  ReactiveAdapter,
  Scalar,
  WithSignal,
} from './types.js';

export type Link = Record<string, string | Array<string>>;

interface LinkNode {
  __link: string;
}
export function createLinkNode(key: string): LinkNode {
  return {
    __link: key,
  };
}

function isLinkNode(v: unknown): v is LinkNode {
  return typeof v === 'object' && v !== null && '__link' in v;
}

function defaultIdGetter(v: Entity) {
  return `${v.__typename}:${v.id}`;
}

export type MergeResolvers = {
  [typename: string]: {
    [attributeName: string]: (
      currentValue?: string | string[] | undefined,
      newValue?: Entity[] | any | undefined
    ) => LinkNode[];
  };
};

export class SignalCache {
  signalAdapter: ReactiveAdapter;
  getCacheKey: IdFetcher;
  mergeResolvers?: MergeResolvers;
  queryLifetimes = new Map<string, number>();
  // TTL measured in milliseconds
  queryTTL: number;
  queryLinks = new Map<string, Link>();
  links = new Map<string, Link>();
  records = new Map<string, Record<string, Scalar> | WithSignal<Entity>>();
  signals = new Map<string, WeakRef<WithSignal<Entity>>>();
  private registry: FinalizationRegistry<string>;

  constructor(
    signalAdapter: ReactiveAdapter,
    getCacheKey: IdFetcher = defaultIdGetter,
    mergeResolvers?: MergeResolvers,
    queryTTL = 60_000
  ) {
    this.signalAdapter = signalAdapter;
    this.getCacheKey = getCacheKey;
    this.mergeResolvers = mergeResolvers;
    this.queryTTL = queryTTL;
    this.registry = new FinalizationRegistry((key) => {
      this.evict(key);
    });
  }

  // Associate an operation with its root entities. This method does *not* also store the actual
  // entities, it is intended solely tracking the top-level links for a given operation
  storeOperation(
    operation: GraphQLOperation,
    links?: Map<PropertyPath, CacheKey>
  ) {
    const linksObj: Link = links
      ? (Object.fromEntries(links.entries()) as Link)
      : {};

    const key = JSON.stringify(operation);

    this.queryLifetimes.set(
      key,
      getTime(addMilliseconds(new Date(), this.queryTTL))
    );
    this.queryLinks.set(key, linksObj);
  }

  readOperation<
    Data extends object = object,
    Variables extends DefaultVariables = DefaultVariables
  >(
    operation: GraphQLOperation<Data, Variables>
  ): WithSignal<Entity> | undefined {
    const key = JSON.stringify(operation);

    if (this.queryLinks.has(key)) {
      const expirationTimestamp = this.queryLifetimes.get(key);

      // If a query link exists, but has exceeded its TTL, we evict it from the cache and return
      // undefined, indicating that there was no cached value to be found. Otherwise, we resolve
      // the cached query response and return it
      if (expirationTimestamp && getTime(new Date()) >= expirationTimestamp) {
        this.queryLinks.delete(key);
        this.queryLifetimes.delete(key);
        return undefined;
      } else {
        return this.resolve(key);
      }
    }
  }

  // Store a single entity by key.
  storeEntity(key: string, entity: Entity, fetchMore = false) {
    const record = this.records.get(key) || {};
    const links = this.links.get(key) || {};

    (Object.entries(entity) as Entries<typeof entity>).forEach(
      ([entityKey, value]) => {
        if (
          fetchMore &&
          this.mergeResolvers &&
          this.mergeResolvers[entity.__typename] &&
          this.mergeResolvers[entity.__typename][entityKey]
        ) {
          try {
            value = this.mergeResolvers[entity.__typename][entityKey](
              links[entityKey],
              value
            );
          } catch (e: unknown) {
            console.error(
              `failure to enact custom resolver strategy for ${
                entity.__typename
              }:${entityKey} with failure ${JSON.stringify(e)}`
            );
          }
        }

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
          // We only want to update the array value on the entity if the record has an array value or if the record has a length
          // This is to ensure we update the record with an empty array if had an original value
          if (
            recordArray.length > 0 ||
            (record[entityKey] && Array.isArray(record[entityKey]))
          ) {
            record[entityKey] = recordArray;
          }
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

    const links = this.links.get(entityKey) || this.queryLinks.get(entityKey);

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
      root = createSignalProxy(this.signalAdapter({ id: '', __typename: '' }));
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
        const toRemove = parentArray.filter((v) => {
          const key = this.getCacheKey(v, parent);

          // if there is no key we can't consistency manage it.
          // it will get overriden when new values are returned on the parent object
          return key && !value.includes(key);
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
      }

      // If this node is already being explored, we're in a cycle and need to bail
      if (exploring.has(value)) {
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

    // in order to get consistency updates on non managed field updates we set the signal if we have it
    // so we can update it in storeEntity
    this.records.set(entityKey, root);

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
