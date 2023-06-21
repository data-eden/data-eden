import type {
  Cache,
  CacheTransaction,
  CacheEntryState,
  CachedEntityRevision,
  DefaultRegistry,
  ExpirationPolicy,
} from './index.js';

import { DEFAULT_EXPIRATION } from './cache.js';
export class CacheTransactionImpl<
  CacheKeyRegistry extends DefaultRegistry,
  Key extends keyof CacheKeyRegistry,
  $Debug = unknown,
  UserExtensionData = unknown,
  Context extends object = object
> implements
    CacheTransaction<CacheKeyRegistry, Key, $Debug, UserExtensionData, Context>
{
  #originalCacheReference: Cache<
    CacheKeyRegistry,
    Key,
    $Debug,
    UserExtensionData,
    Context
  >;
  #transactionalCache: Map<Key, CacheKeyRegistry[Key]>;
  #cacheEntriesBeforeTransaction: Map<Key, CacheKeyRegistry[Key]>;
  #cacheRevisionsBeforeTransaction: Map<
    Key,
    CachedEntityRevision<CacheKeyRegistry, Key>[]
  >;
  #ttlPolicy: number;
  #lruPolicy: number;
  #userOptionExpirationPolicy: ExpirationPolicy;
  #localRevisionsMap: Map<Key, CachedEntityRevision<CacheKeyRegistry, Key>[]>;
  #cacheEntryState: Map<Key, CacheEntryState<UserExtensionData>>;
  context: Context;

  constructor(
    originalCache: Cache<
      CacheKeyRegistry,
      Key,
      $Debug,
      UserExtensionData,
      Context
    >,
    context: Context = {} as Context
  ) {
    this.#originalCacheReference = originalCache;
    this.#transactionalCache = new Map<Key, CacheKeyRegistry[Key]>();
    this.#cacheEntryState = new Map<Key, CacheEntryState<UserExtensionData>>();
    this.#ttlPolicy = DEFAULT_EXPIRATION.ttl;
    this.#lruPolicy = DEFAULT_EXPIRATION.lru;
    this.#userOptionExpirationPolicy =
      this.#originalCacheReference.getCacheOptions()?.expiration ||
      DEFAULT_EXPIRATION;

    this.context = context;

    if (
      this.#userOptionExpirationPolicy &&
      this.#userOptionExpirationPolicy?.lru &&
      typeof this.#userOptionExpirationPolicy.lru === 'number'
    ) {
      this.#lruPolicy = this.#userOptionExpirationPolicy.lru;
    }

    if (
      this.#userOptionExpirationPolicy &&
      this.#userOptionExpirationPolicy?.ttl &&
      typeof this.#userOptionExpirationPolicy.ttl === 'number'
    ) {
      this.#ttlPolicy = this.#userOptionExpirationPolicy.ttl;
    }

    this.#localRevisionsMap = new Map<
      Key,
      CachedEntityRevision<CacheKeyRegistry, Key>[]
    >();
    this.#cacheRevisionsBeforeTransaction = new Map<
      Key,
      CachedEntityRevision<CacheKeyRegistry, Key>[]
    >();

    this.#cacheEntriesBeforeTransaction = new Map<Key, CacheKeyRegistry[Key]>();
  }

  protected getExpirationPolicies() {
    return {
      userOptionExpirationPolicy: this.#userOptionExpirationPolicy,
      lruPolicy: this.#lruPolicy,
      ttlPolicy: this.#ttlPolicy,
    };
  }

  protected setLocalRevisionsByEntry(
    cacheKey: Key,
    revision: CachedEntityRevision<CacheKeyRegistry, Key>
  ) {
    if (this.#localRevisionsMap.has(cacheKey)) {
      this.#localRevisionsMap.get(cacheKey)?.push(revision);
    } else {
      this.#localRevisionsMap.set(cacheKey, [revision]);
    }
  }

  protected getLocalRevisions(): Map<
    Key,
    CachedEntityRevision<CacheKeyRegistry, Key>[]
  > {
    return this.#localRevisionsMap;
  }

  protected setLocalRevisions(
    localRevisionsMap: Map<Key, CachedEntityRevision<CacheKeyRegistry, Key>[]>
  ): Map<Key, CachedEntityRevision<CacheKeyRegistry, Key>[]> {
    return (this.#localRevisionsMap = localRevisionsMap);
  }

  protected getLocalRevisionsByEntry(
    cacheKey: Key
  ): CachedEntityRevision<CacheKeyRegistry, Key>[] | undefined {
    return this.#localRevisionsMap.get(cacheKey);
  }

  protected setRevisionsBeforeTransactionStart(
    revisions: Map<Key, CachedEntityRevision<CacheKeyRegistry, Key>[]>
  ) {
    this.#cacheRevisionsBeforeTransaction = revisions;
  }

  protected setCacheEntryState(
    cacheKey: Key,
    cacheEntryState: CacheEntryState<UserExtensionData>
  ) {
    this.#cacheEntryState.set(cacheKey, cacheEntryState);
  }

  protected getCacheEntryState(
    cacheKey: Key
  ): CacheEntryState<UserExtensionData> | undefined {
    return this.#cacheEntryState.get(cacheKey);
  }

  protected setCacheEntriesBeforeTransaction(
    entries: Map<Key, CacheKeyRegistry[Key]>
  ) {
    this.#cacheEntriesBeforeTransaction = entries;
  }

  protected getTransactionalCache() {
    return this.#transactionalCache;
  }

  async *[Symbol.asyncIterator](): AsyncIterableIterator<
    [Key, CacheKeyRegistry[Key], CacheEntryState<UserExtensionData>]
  > {
    for await (const [key, value] of this.localEntries()) {
      const state = this.#cacheEntryState.get(
        key
      ) as CacheEntryState<UserExtensionData>;
      yield [key, value, state];
    }
  }

  async get(cacheKey: Key): Promise<CacheKeyRegistry[Key] | undefined> {
    // will check the transaction entries and fall back to the cache if the transaction hasn't written to the key yet.
    let cachedValue;

    for await (const [key, value] of this.localEntries()) {
      if (key === cacheKey) {
        cachedValue = value;
        break;
      }
    }

    // Update cache entry state
    this.#cacheEntryState.set(cacheKey, {
      retained: { lru: true, ttl: this.#ttlPolicy },
      lastAccessed: Date.now(),
    });

    return cachedValue || (await this.#originalCacheReference.get(cacheKey));
  }

  localEntries(): AsyncIterableIterator<[Key, CacheKeyRegistry[Key]]> {
    const localEntriesIterator = {
      async *[Symbol.asyncIterator](
        localEntryMap: Map<Key, CacheKeyRegistry[Key]>
      ): AsyncIterableIterator<[Key, CacheKeyRegistry[Key]]> {
        for (const [key, value] of localEntryMap) {
          yield [key, value];
        }
      },
    };
    return localEntriesIterator[Symbol.asyncIterator](this.#transactionalCache);
  }

  async entries(): Promise<
    AsyncIterableIterator<[Key, CacheKeyRegistry[Key]]>
  > {
    const entriesIterator = {
      async *[Symbol.asyncIterator](
        localEntriesIterator: AsyncIterableIterator<
          [Key, CacheKeyRegistry[Key]]
        >,
        cacheEntriesBeforeTransaction: Map<Key, CacheKeyRegistry[Key]>
      ): AsyncIterableIterator<[Key, CacheKeyRegistry[Key]]> {
        for await (const [key, transactionValue] of localEntriesIterator) {
          yield [key, transactionValue];
          const cacheValue = cacheEntriesBeforeTransaction.get(key);
          if (cacheValue) {
            yield [key, cacheValue];
          }
        }
      },
    };

    return entriesIterator[Symbol.asyncIterator](
      this.localEntries(),
      this.#cacheEntriesBeforeTransaction
    );
  }

  localRevisions(
    cacheKey: Key
  ): AsyncIterableIterator<CachedEntityRevision<CacheKeyRegistry, Key>> {
    const entryRevisionIterator = {
      async *[Symbol.asyncIterator](
        revisions: CachedEntityRevision<CacheKeyRegistry, Key>[]
      ): AsyncIterableIterator<CachedEntityRevision<CacheKeyRegistry, Key>> {
        for (const revision of revisions) {
          yield revision;
        }
      },
    };

    const revisions = this.#localRevisionsMap.get(cacheKey) || [];
    return entryRevisionIterator[Symbol.asyncIterator](revisions);
  }

  entryRevisions(
    cacheKey: Key
  ): AsyncIterableIterator<CachedEntityRevision<CacheKeyRegistry, Key>> {
    const entryRevisionIterator = {
      async *[Symbol.asyncIterator](
        revisions: CachedEntityRevision<CacheKeyRegistry, Key>[]
      ): AsyncIterableIterator<CachedEntityRevision<CacheKeyRegistry, Key>> {
        for (const revision of revisions) {
          yield revision;
        }
      },
    };

    const entryRevisions =
      this.#cacheRevisionsBeforeTransaction.get(cacheKey) || [];
    const localRevisions = this.#localRevisionsMap.get(cacheKey) || [];

    return entryRevisionIterator[Symbol.asyncIterator](
      entryRevisions.concat(localRevisions)
    );
  }
}
