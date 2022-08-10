type DefaultRegistry = Record<string, unknown>;

export interface Cache<
  CacheKeyRegistry,
  $Debug = unknown,
  UserExtensionData = unknown
  > {
  get<Key extends keyof CacheKeyRegistry>(
    cacheKey: Key
  ): Promise<CacheKeyRegistry[Key] | undefined>;
}

class CacheImpl<CacheKeyRegistry, $Debug = unknown, UserExtensionData = unknown>
  implements Cache<CacheKeyRegistry, $Debug, UserExtensionData>
{
  async get<Key extends keyof CacheKeyRegistry>(
    cacheKey: Key
  ): Promise<CacheKeyRegistry[Key] | undefined> {
    return undefined;
  }
}

export function buildCache<
  CacheKeyRegistry = DefaultRegistry,
  $Debug = unknown,
  UserExtensionData = unknown
>(): Cache<CacheKeyRegistry, $Debug, UserExtensionData> {
  return new CacheImpl<CacheKeyRegistry, $Debug, UserExtensionData>();
}
