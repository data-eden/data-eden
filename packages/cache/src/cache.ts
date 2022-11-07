// eslint-disable-next-line
function structuredClone(x: any): any {
  try {
    return JSON.parse(JSON.stringify(x));
  } catch (error) {
    throw new Error('The cache value is not structured clonable use `save` with serializer')
  }
}

type DefaultRegistry = Record<string, object>;
/**
  A 3-tuple of a cache entry that contains
  - *key*
  - *value*
  - *state* (optional)
*/
type CacheEntry<
  CacheKeyRegistry extends DefaultRegistry,
  Key extends keyof CacheKeyRegistry = keyof CacheKeyRegistry,
  UserExtensionData = unknown
  > = [
    key: Key,
    value: CacheKeyRegistry[Key],
    state?: CacheEntryState<UserExtensionData>
  ];

export interface CacheEntryState<UserExtensionData = unknown> {
  retained: {
    lru: boolean;
    ttl: number;
  };
  /**
  The last time this cache entry was accessed, either via `get`, `set`, or
  `merge`.

  Mainly useful for userland retention policies.
  */
  lastAccessed: number;
  extensions: UserExtensionData;
}

type CacheKeyValue = Record<string, object | string | number> | string | number ;

interface CachedEntityRevision<CacheKeyValue
> {
  entity: CacheKeyValue;
  revision: number;
}

export interface CacheTransaction<
  CacheKeyRegistry extends DefaultRegistry,
  Key extends keyof CacheKeyRegistry,
  $Debug = unknown,
  UserExtensionData = unknown
  > {
  
  get(cacheKey: Key): CacheKeyRegistry[Key] | CacheKeyValue | undefined;

  [Symbol.asyncIterator](entryMap: Map<Key, CacheKeyRegistry[Key] | CacheKeyValue>): AsyncIterableIterator<[Key, CacheKeyRegistry[Key] | CacheKeyValue, CacheEntryState<UserExtensionData> | undefined]>

  entries(): AsyncIterableIterator<[Key, CacheKeyRegistry[Key] | CacheKeyValue, CacheEntryState<UserExtensionData> | undefined]>;

  localEntries(): AsyncIterableIterator<[Key, CacheKeyRegistry[Key] | CacheKeyValue, CacheEntryState<UserExtensionData> | undefined]>;

  // localRevisions(cacheKey: Key):  AsyncIterableIterator<CachedEntityRevision<CacheKeyRegistry[Key]>>;

  // entryRevisions(cacheKey: Key):  AsyncIterableIterator<CachedEntityRevision<CacheKeyRegistry[Key]>>;

  // $debug: $Debug & CacheTransactionDebugAPIs;
}

export interface EntityMergeStrategy<
  CacheKeyRegistry extends DefaultRegistry,
  Key extends keyof CacheKeyRegistry = keyof CacheKeyRegistry,
  $Debug = unknown,
  UserExtensionData = unknown
> {
  (
    cacheKey: Key,
    newEntityRevision: CachedEntityRevision<CacheKeyValue>,
    current: CacheKeyRegistry[Key] | undefined,
    tx: CacheTransaction<CacheKeyRegistry, Key, $Debug, UserExtensionData>
  ): CacheKeyValue;
}

export interface LiveCacheTransaction<
  CacheKeyRegistry extends DefaultRegistry,
  Key extends keyof CacheKeyRegistry,
  $Debug = unknown,
  UserExtensionData = unknown
> extends CacheTransaction<CacheKeyRegistry, Key, $Debug, UserExtensionData> {

  merge(cacheKey: Key, value: CachedEntityRevision<CacheKeyValue>,
    options?: {
      entityMergeStrategy: EntityMergeStrategy<
        CacheKeyRegistry,
        Key,
        $Debug,
        UserExtensionData
      >;
      $debug: $Debug;
    }
  ): Promise<CacheKeyRegistry[Key] | CacheKeyValue>;

  set(cacheKey: Key, value: CacheKeyRegistry[Key] | CacheKeyValue): CacheKeyRegistry[Key] | CacheKeyValue;

  commit(): Promise<void>;

  rollback(): Promise<void>;
}
class LiveCacheTransactionImpl<
  CacheKeyRegistry extends DefaultRegistry,
  Key extends keyof CacheKeyRegistry,
  $Debug = unknown,
  UserExtensionData = unknown
> implements
    LiveCacheTransaction<CacheKeyRegistry, Key, $Debug, UserExtensionData>
{
  #originalCacheReference: CacheImpl<CacheKeyRegistry, Key, $Debug, UserExtensionData>;
  #transactionalCache: Map<Key, CacheKeyRegistry[Key]>;
  #localUpdatedEntries: Map<Key, CacheKeyRegistry[Key]>;
  #mergeStrategy: EntityMergeStrategy<CacheKeyRegistry, Key, $Debug, UserExtensionData>;

  constructor(
    originalCache: CacheImpl<CacheKeyRegistry, Key, $Debug, UserExtensionData>,
    originalCacheEntryMap:Map<Key, CacheKeyRegistry[Key]>
  ) {    
    this.#originalCacheReference = originalCache;
    this.#mergeStrategy = defaultMergeStrategy;
    this.#transactionalCache = originalCacheEntryMap;
    this.#localUpdatedEntries = new Map<Key, CacheKeyRegistry[Key]>();
  }

  static async beginLiveTransaction<
    CacheKeyRegistry extends DefaultRegistry, 
    Key extends keyof CacheKeyRegistry,
    $Debug = unknown,
    UserExtensionData = unknown>(originalCache: CacheImpl<CacheKeyRegistry, Key, $Debug, UserExtensionData>) {
    
    const transactionalCache = new Map<Key, CacheKeyRegistry[Key]>();
    for await (const [key, value] of originalCache.entries()) {
      transactionalCache.set(key, {...value});
    }
    return new LiveCacheTransactionImpl<CacheKeyRegistry, Key, $Debug, UserExtensionData>(originalCache, transactionalCache);
  }

  get(cacheKey: Key): CacheKeyRegistry[Key] | undefined {
    return this.#transactionalCache.get(cacheKey);
  }

  async *[Symbol.asyncIterator](entryMap: Map<Key, CacheKeyRegistry[Key]>): AsyncIterableIterator<[Key, CacheKeyRegistry[Key], CacheEntryState<UserExtensionData> | undefined]> {
    for (const [key, value] of entryMap) {
      // TODO read CacheEntryState correctly
      let state = undefined;

      yield [key, value, state];
    }
  }

  entries(): AsyncIterableIterator<[Key, CacheKeyRegistry[Key], CacheEntryState<UserExtensionData> | undefined]> {
    return this[Symbol.asyncIterator](this.#transactionalCache);
  }

  localEntries(): AsyncIterableIterator<[Key, CacheKeyRegistry[Key], CacheEntryState<UserExtensionData> | undefined]> {
    return this[Symbol.asyncIterator](this.#localUpdatedEntries);
  }

  set(cacheKey: Key, value: CacheKeyRegistry[Key]): CacheKeyRegistry[Key] {
    this.#transactionalCache.set(cacheKey, value);
    this.#localUpdatedEntries.set(cacheKey, value)
    return value;
  }
  
  async merge(cacheKey: Key, value: CachedEntityRevision<CacheKeyValue>,
    options?: {
      entityMergeStrategy: EntityMergeStrategy<CacheKeyRegistry, Key, $Debug, UserExtensionData>;
      $debug: $Debug;
    }
  ): Promise<CacheKeyRegistry[Key] | CacheKeyValue> {

    // assign custom merge strategy if specified else use default
    if (options?.entityMergeStrategy) {
      this.#mergeStrategy = options.entityMergeStrategy;
    }

    // get current cache Value within this transaction
    const currentValue = this.#transactionalCache.has(cacheKey)
        ? this.#transactionalCache.get(cacheKey)
        : undefined; 

    const mergedEntity= this.#mergeStrategy(cacheKey, { entity: value.entity, revision: value.revision }, currentValue, this);

    // TODO throw error if Merge entity is undefined
    // TODO intercept entities deleted

    // Update transactional cache with merged entity
    this.set(cacheKey, mergedEntity as CacheKeyRegistry[Key]);

    return mergedEntity;
  }

  async commit(options?: {
    timeout: number | false
  }): Promise<void> {
    const timeout: number = options?.timeout ? options.timeout : 10000;

    const commitLock = new Promise((resolve, reject) => setTimeout(reject, timeout));

    const writeToCache= async () => {
      const arrayOfCacheEntryTuples: [Key, CacheKeyRegistry[Key], CacheEntryState<UserExtensionData> | undefined][] = [];
      
      for await (const [cacheKey, value] of this.localEntries()) {
        const latestCacheValue = await this.#originalCacheReference.get(cacheKey)
        let entityToCommit;

         // TODO get correct revision number
        const revision = 1;

        if (latestCacheValue) {   
          entityToCommit = this.#mergeStrategy(cacheKey, { entity: value as CacheKeyValue, revision }, latestCacheValue, this);
        } else {
          entityToCommit = value;
        }

        const structuredClonedValue = structuredClone(entityToCommit) as CacheKeyRegistry[Key];
        // TODO fix cache entry state
        const state = undefined; 

        arrayOfCacheEntryTuples.push([cacheKey, structuredClonedValue, state])
        await this.#originalCacheReference.load(arrayOfCacheEntryTuples); 
      } 
    };

    try {
      await Promise.race([writeToCache(), commitLock]);
    } catch {
      // TODO throw error
      await this.rollback();
    }
  }

  async rollback(): Promise<void> {
    console.log('rollback to pre-transactional state');
  }
}
 
export interface Cache<
  CacheKeyRegistry extends DefaultRegistry,
  Key extends keyof CacheKeyRegistry,
  $Debug = unknown,
  UserExtensionData = unknown
  > {
  get(cacheKey: Key): Promise<CacheKeyRegistry[Key] | undefined>;

  /**
    Calling `.save()` without a serializer will iterate over the cache entries
    and return an array of cache entry tuples. The values contained within the
    tuples are copied via `structuredClone`.

    If your cache entries are not structured clonable, (e.g. a function)
    `.save()` will throw an error. In this case, use the alternate form of
    `.save` passing in a `CacheEntrySerializer`.

    @see <https://developer.mozilla.org/en-US/docs/Web/API/structuredClone>
  */
  save(): Promise<[Key, CacheKeyRegistry[Key], CacheEntryState<UserExtensionData> | undefined][]>;

  /**
    Calling `.load()` will add all entries passed to the cache.

    Note: `.load()` does not clear pre-existing entries, if you need to clear
    entries before loading call `.clear()`.
  */
  load(
    entries: CacheEntry<CacheKeyRegistry, Key, UserExtensionData>[]
  ): Promise<void>;

  [Symbol.asyncIterator](): AsyncIterableIterator<[Key, CacheKeyRegistry[Key], CacheEntryState<UserExtensionData> | undefined]>

  entries(): AsyncIterableIterator<[Key, CacheKeyRegistry[Key], CacheEntryState<UserExtensionData> | undefined]>;

  keys(): AsyncIterableIterator<Key>;

  values(): AsyncIterableIterator<CacheKeyRegistry[Key]>;

  beginTransaction(): Promise<LiveCacheTransaction<CacheKeyRegistry, Key, $Debug, UserExtensionData>>;
}

class CacheImpl<
  CacheKeyRegistry extends DefaultRegistry,
  Key extends keyof CacheKeyRegistry,
  $Debug = unknown,
  UserExtensionData = unknown
  > implements Cache<CacheKeyRegistry, Key, $Debug, UserExtensionData>
{
  #weakCache = new Map<Key, WeakRef<CacheKeyRegistry[Key]>>();
  // TODO: impl lru correctly
  #lru = new Map();

  async get(cacheKey: Key): Promise<CacheKeyRegistry[Key] | undefined> {
    let ref = this.#weakCache.get(cacheKey);
    return ref?.deref();
  }

  /**
    Calling `.load()` will add all entries passed to the cache.

    Note: `.load()` does not clear pre-existing entries, if you need to clear
    entries before loading call `.clear()`.
  */
  async load(
    entries: CacheEntry<CacheKeyRegistry, Key, UserExtensionData>[]
  ): Promise<void> {
    for await (let entry of entries) {
      let [key, value] = entry;
      // TODO: finalizregistry
      // let clone = structuredClone(value) as CacheKeyRegistry[Key];
      let clone = value;
      this.#weakCache.set(key, new WeakRef(clone));
      // TODO: impl lru correctly
      this.#lru.set(key, value);
    }
  }

  /**
    Generator function for async iterable that yields iterable cache entries. This
    will include both strongly held (unexpired entries) as well as weakly held
    entries.
  */
  async *[Symbol.asyncIterator](): AsyncIterableIterator<[Key, CacheKeyRegistry[Key], CacheEntryState<UserExtensionData> | undefined]> {
    for await (const [key] of this.#weakCache) {
      let ref = this.#weakCache.get(key)?.deref();
      // TODO read CacheEntryState correctly
      let state = undefined;
      if(!ref) {
        throw new Error('ref is undefined');
      }

      yield [key, ref, state];
    }
  }

  /**
    Generator function that yields each of the iterable cache entries. Note that this
    will include both strongly held (unexpired entries) as well as weakly held
    entries.
  */
  entries(): AsyncIterableIterator<[Key, CacheKeyRegistry[Key], CacheEntryState<UserExtensionData> | undefined]> {
    return this[Symbol.asyncIterator]();
  }

 /**
  * Generator function that yields each of the iterable cache entry Keys.
  */
  async *keys(): AsyncIterableIterator<Key> {
    for await (const [key] of this.entries()) {
      yield key;
    } 
  }

 /**
  * Generator function that yields each of the iterable cache entry Values.
  */
  async *values(): AsyncIterableIterator<CacheKeyRegistry[Key]> {
    for await (const [, value] of this.entries()) {
       yield value;
    } 
  }

  /**
    Calling `.save()` without a serializer will iterate over the cache entries
    and return an array of cache entry tuples. The values contained within the
    tuples are copied via `structuredClone`.

    If your cache entries are not structured clonable, (e.g. a function)
    `.save()` will throw an error. In this case, use the alternate form of
    `.save` passing in a `CacheEntrySerializer`.

    @see <https://developer.mozilla.org/en-US/docs/Web/API/structuredClone>
  */
  async save(): Promise<[Key, CacheKeyRegistry[Key], CacheEntryState<UserExtensionData> | undefined][]> {
    const arrayOfCacheEntryTuples: [Key, CacheKeyRegistry[Key], CacheEntryState<UserExtensionData> | undefined][] = [];
    for await (const [key, value, state] of this.entries()) {
      const structuredClonedValue = structuredClone(value) as CacheKeyRegistry[Key];
      arrayOfCacheEntryTuples.push([key, structuredClonedValue, state])
    } 
    return arrayOfCacheEntryTuples;
  }

  async beginTransaction(): Promise<LiveCacheTransaction<CacheKeyRegistry, Key, $Debug, UserExtensionData>> {
    return await LiveCacheTransactionImpl.beginLiveTransaction(this);
  }
}


export function buildCache<
  CacheKeyRegistry extends DefaultRegistry = DefaultRegistry,
  Key extends keyof CacheKeyRegistry = keyof CacheKeyRegistry,
  $Debug = unknown,
  UserExtensionData = unknown
>(): Cache<CacheKeyRegistry, Key, $Debug, UserExtensionData> {
  return new CacheImpl<CacheKeyRegistry, Key, $Debug, UserExtensionData>();
}


const defaultMergeStrategy = function deepMergeStratey<
  CacheKeyRegistry extends DefaultRegistry, 
  Key extends keyof CacheKeyRegistry,
  
>(id: Key, { entity, revision }: CachedEntityRevision<CacheKeyValue>, current: CacheKeyRegistry[Key] | undefined, tx: CacheTransaction<CacheKeyRegistry, Key>): CacheKeyValue { 
  return deepMerge(current as CacheKeyValue, entity);
}

// eslint-disable-next-line
const isObject = function isObject(obj: any): obj is Record<string, any> {
  return obj !== null && typeof obj === 'object';
}

function deepMerge(targetData: CacheKeyValue, sourceData: CacheKeyValue): CacheKeyValue {
  const source = isObject(sourceData) ? {...sourceData } : sourceData;
  const target = isObject(targetData) ? {...targetData } : targetData;

  if (isObject(source) && isObject(target)) {
    Object.keys(source).forEach((sourceKey) => {
      if (Object.prototype.hasOwnProperty.call(target, sourceKey)) {
        if (source[sourceKey] != target[sourceKey]) {
          // There is conflict that needs to be resolved
          const result = resolveConflict(target, source, sourceKey);

          if (result != target[sourceKey]) {
            target[sourceKey] = result; 
          } 
        }
      } else {
        // If there is no conflict, its safe, assign source to target
        target[sourceKey] = source[sourceKey];
      }
    });

    return target;
  }

  // If source or target is not an object use source.
  return source;
}

function resolveConflict(target: Record<string, object | string | number>, source: Record<string, object | string | number>, property: string): CacheKeyValue {
  return deepMerge(target[property] as CacheKeyValue, source[property] as CacheKeyValue) ;
}
