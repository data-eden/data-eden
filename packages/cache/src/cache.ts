type DefaultRegistry = Record<string, object>;
type CacheEntry<
  CacheKeyRegistry,
  Key extends keyof CacheKeyRegistry,
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
  CacheKeyRegistry,
  $Debug = unknown,
  UserExtensionData = unknown
  > {
  get<Key extends keyof CacheKeyRegistry>(
    cacheKey: Key
  ): Promise<CacheKeyRegistry[Key] | undefined>;

  /**
    Calling `.load()` will add all entries passed to the cache.

    Note: `.load()` does not clear pre-existing entries, if you need to clear
    entries before loading call `.clear()`.
  */
  load<Key extends keyof CacheKeyRegistry>(
    entries: CacheEntry<CacheKeyRegistry, Key, UserExtensionData>[]
  ): Promise<void>;
}

class CacheImpl<
  CacheKeyRegistry extends DefaultRegistry,
  Key extends keyof CacheKeyRegistry,
  $Debug = unknown,
  UserExtensionData = unknown
  > implements Cache<CacheKeyRegistry, $Debug, UserExtensionData>
{
  #weakCache = new Map<Key, WeakRef<CacheKeyRegistry[Key]>>();

  async get<Key extends keyof CacheKeyRegistry>(
    cacheKey: Key
  ): Promise<CacheKeyRegistry[Key] | undefined> {
    // TODO: impl
    return undefined;
  }

  /**
    Calling `.load()` will add all entries passed to the cache.

    Note: `.load()` does not clear pre-existing entries, if you need to clear
    entries before loading call `.clear()`.
  */
  async load<Key extends keyof CacheKeyRegistry>(
    entries: CacheEntry<CacheKeyRegistry, Key, UserExtensionData>[]
  ) { }
}

export function buildCache<
  Key extends keyof CacheKeyRegistry,
  CacheKeyRegistry = DefaultRegistry,
  $Debug = unknown,
  UserExtensionData = unknown
>(): Cache<CacheKeyRegistry, $Debug, UserExtensionData> {
  return new CacheImpl<CacheKeyRegistry, Key, $Debug, UserExtensionData>();
}
