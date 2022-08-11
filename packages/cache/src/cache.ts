// eslint-disable-next-line
function structuredClone(x: any): any {
  return JSON.parse(JSON.stringify(x));
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

export interface Cache<
  CacheKeyRegistry extends DefaultRegistry,
  Key extends keyof CacheKeyRegistry = keyof CacheKeyRegistry,
  $Debug = unknown,
  UserExtensionData = unknown
  > {
  get(cacheKey: Key): Promise<CacheKeyRegistry[Key] | undefined>;

  /**
    Calling `.load()` will add all entries passed to the cache.

    Note: `.load()` does not clear pre-existing entries, if you need to clear
    entries before loading call `.clear()`.
  */
  load(
    entries: CacheEntry<CacheKeyRegistry, Key, UserExtensionData>[]
  ): Promise<void>;
}

class CacheImpl<
  CacheKeyRegistry extends DefaultRegistry,
  Key extends keyof CacheKeyRegistry = keyof CacheKeyRegistry,
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
}

export function buildCache<
  CacheKeyRegistry extends DefaultRegistry = DefaultRegistry,
  Key extends keyof CacheKeyRegistry = keyof CacheKeyRegistry,
  $Debug = unknown,
  UserExtensionData = unknown
>(): Cache<CacheKeyRegistry, Key, $Debug, UserExtensionData> {
  return new CacheImpl<CacheKeyRegistry, Key, $Debug, UserExtensionData>();
}
