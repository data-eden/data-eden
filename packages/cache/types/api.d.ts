export { buildCache } from '../src/cache.js';

export interface Cache<
  CacheKeyRegistry extends DefaultRegistry,
  Key extends keyof CacheKeyRegistry,
  $Debug = unknown,
  UserExtensionData = unknown,
  Context extends object = object
> {
  /**
    Evict all entries from the cache.
  */
  clear(): Promise<void>;

  /**
    Restuns all cache options passed
  */
  getCacheOptions():
    | CacheOptions<CacheKeyRegistry, Key, $Debug, UserExtensionData, Context>
    | undefined;

  /**
    Get Cache value based on cache key
  */
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
  save(): Promise<
    [
      Key,
      CacheKeyRegistry[Key],
      CacheEntryState<UserExtensionData> | undefined
    ][]
  >;

  /**
    Calling `.load()` will add all entries passed to the cache.
    Note: `.load()` does not clear pre-existing entries, if you need to clear
    entries before loading call `.clear()`.
  */
  load(
    entries: CacheEntry<CacheKeyRegistry, Key, UserExtensionData>[]
  ): Promise<void>;

  [Symbol.asyncIterator](): AsyncIterableIterator<
    [Key, CacheKeyRegistry[Key], CacheEntryState<UserExtensionData>?]
  >;

  /**
    Generator function that yields each of the cache entries. Note that this
    will include both strongly held (unexpired entries) as well as weakly held
    entries.
  */
  entries(): AsyncIterableIterator<
    [Key, CacheKeyRegistry[Key], CacheEntryState<UserExtensionData>]
  >;

  /**
    Generator function that yields each of the cache entry revision
  */
  entryRevisions(
    cacheKey: Key
  ): AsyncIterableIterator<CachedEntityRevision<CacheKeyRegistry, Key>>;

  /**
    Generator function that yields each of the cache entry keys
  */
  keys(): AsyncIterableIterator<Key>;

  /**
    Generator function that yields each of the cache entry values
  */
  values(): AsyncIterableIterator<CacheKeyRegistry[Key]>;

  /**
    Creates a live transaction instance
  */
  beginTransaction(
    context?: Context
  ): Promise<
    LiveCacheTransaction<CacheKeyRegistry, Key, $Debug, UserExtensionData>
  >;
}

export interface CacheTransaction<
  CacheKeyRegistry extends DefaultRegistry,
  Key extends keyof CacheKeyRegistry,
  $Debug = unknown,
  UserExtensionData = unknown,
  Context extends object = object
> {
  /**
    Get the value of `cacheKey` in the cache.  If `key` has been modified in this
    transaction (e.g. via `merge` or `set`), `tx.get` will return the updated
    entry in this transaction. The return value can therefore differ from
    `cache.get`.
  */
  get(cacheKey: Key): Promise<CacheKeyRegistry[Key] | undefined>;

  [Symbol.asyncIterator](): AsyncIterableIterator<
    [Key, CacheKeyRegistry[Key], CacheEntryState<UserExtensionData>]
  >;

  /**
    Generator function that yields each of the transaction entries including local entries and entries before transaction began.
  */
  entries(): Promise<AsyncIterableIterator<[Key, CacheKeyRegistry[Key]]>>;

  /**
    Generator function that yields each of the transaction local entries.
  */
  localEntries(): AsyncIterableIterator<[Key, CacheKeyRegistry[Key]]>;

  /**
   An async generator that produces the revisions of `key` within this transaction.
  */
  localRevisions(
    cacheKey: Key
  ): AsyncIterableIterator<CachedEntityRevision<CacheKeyRegistry, Key>>;

  /**
   An async generator that produces the complete list of revisions for `key`,
   from the time the transaction began and including the revisions added in this
   transaction.
  */
  entryRevisions(
    cacheKey: Key
  ): AsyncIterableIterator<CachedEntityRevision<CacheKeyRegistry, Key>>;

  context: Context;

  $debug?: $Debug & CacheTransactionDebugAPIs;
}

/**
 * Interface specifc to handle Live transaction
 */
export interface LiveCacheTransaction<
  CacheKeyRegistry extends DefaultRegistry,
  Key extends keyof CacheKeyRegistry,
  $Debug = unknown,
  UserExtensionData = unknown,
  Context extends object = object
> extends CacheTransaction<
    CacheKeyRegistry,
    Key,
    $Debug,
    UserExtensionData,
    Context
  > {
  /**
   * Merges cache entries based on merge strategy
   */
  merge(
    cacheKey: Key,
    entity: CacheKeyRegistry[Key],
    options?: {
      entityMergeStrategy?: EntityMergeStrategy<
        CacheKeyRegistry,
        Key,
        $Debug,
        UserExtensionData
      >;
      revisionContext?: unknown;
      $debug?: $Debug;
    }
  ): Promise<CacheKeyRegistry[Key] | CacheKeyValue>;

  /**
   * sets cache values within the transaction
   */
  set(
    cacheKey: Key,
    value: CacheKeyRegistry[Key] | CacheKeyValue
  ): Promise<CacheKeyRegistry[Key] | CacheKeyValue>;

  /**
   * Deletes an entry from live transction
   */
  delete(cacheKey: Key): Promise<boolean>;

  /**
   * Commits live transction entries.
   */
  commit(): Promise<void>;

  context: Context;
}

export interface CommittingTransaction<
  CacheKeyRegistry extends DefaultRegistry,
  Key extends keyof CacheKeyRegistry = keyof CacheKeyRegistry,
  $Debug = unknown,
  UserExtensionData = unknown,
  Context extends object = object
> extends CacheTransaction<
    CacheKeyRegistry,
    Key,
    $Debug,
    UserExtensionData,
    Context
  > {
  cache: {
    clearRevisions(id: Key): void;
    appendRevisions(
      id: Key,
      revisions: CachedEntityRevision<CacheKeyRegistry, Key>[]
    ): void;
  };
  mergedEntryRevisions(): Map<
    Key,
    CachedEntityRevision<CacheKeyRegistry, Key>[]
  >;
  updateRevisions(
    localRevisionsMap: Map<Key, CachedEntityRevision<CacheKeyRegistry, Key>[]>
  ): void;
}

/**
  A 3-tuple of a cache entry that contains
  - *key*
  - *value*
  - *state* (optional)
*/
export type CacheEntry<
  CacheKeyRegistry extends DefaultRegistry,
  Key extends keyof CacheKeyRegistry = keyof CacheKeyRegistry,
  UserExtensionData = unknown
> = [
  key: Key,
  value: CacheKeyRegistry[Key],
  state?: CacheEntryState<UserExtensionData>
];

/**
 * A entry state (retention,last accessed) of each cache entry
 */
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
  lastAccessed?: number; // timestamp
  /**
    If the cache entry is tombstone to be deleted
  */
  deletedRecordInTransaction?: boolean;
  extensions?: UserExtensionData;
}

export type CacheKeyValue =
  | Record<string, object | string | number | undefined>
  | string
  | number;

export interface EntityMergeStrategy<
  CacheKeyRegistry extends DefaultRegistry,
  Key extends keyof CacheKeyRegistry = keyof CacheKeyRegistry,
  $Debug = unknown,
  UserExtensionData = unknown
> {
  (
    cacheKey: Key,
    newEntityRevision: CachedEntityRevision<CacheKeyRegistry, Key>,
    current: CacheKeyRegistry[Key] | undefined,
    tx: CacheTransaction<CacheKeyRegistry, Key, $Debug, UserExtensionData>
  ): CacheKeyValue;
}
export interface RevisionMergeStrategy<
  CacheKeyRegistry extends DefaultRegistry,
  Key extends keyof CacheKeyRegistry,
  $Debug = unknown,
  UserExtensionData = unknown
> {
  (
    cacheKey: Key,
    commitingRevisionTx: CommittingTransaction<
      CacheKeyRegistry,
      Key,
      $Debug,
      UserExtensionData
    >
  ): Promise<void>;
}

export interface CachedEntityRevision<
  CacheKeyRegistry extends DefaultRegistry,
  Key extends keyof CacheKeyRegistry
> {
  entity: CacheKeyRegistry[Key];
  revision: number;
  revisionContext?: unknown; // Use to store queryIds that can be used for debugging
}

export type ExpirationPolicy =
  | false
  | {
      lru: number;
      ttl: number;
    };

export interface CacheOptions<
  CacheKeyRegistry extends DefaultRegistry,
  Key extends keyof CacheKeyRegistry,
  $Debug = unknown,
  UserExtensionData = unknown,
  Context extends object = object
> {
  hooks?: {
    /**
    An optional callback that is invoked just before a transaction is committed.
    This does not allow users to mutate the transaction, but it is a hook where
    custom retention policies can be implemented.
    The default retention policies are all implementable in userland as commit hooks.
    */
    commit?: (
      tx: CacheTransaction<
        CacheKeyRegistry,
        Key,
        $Debug,
        UserExtensionData,
        Context
      >
    ) => Promise<void>;

    /**
    An optional hook for merging new versions of an entity into the cache. This
    hook specifies the default behaviour for the cache -- a different merge
    strategy can be passed in per call to `LiveCacheTransaction.merge`
    The hook returns the updated merged entry -- it may not mutate any of its arguments.
    If unspecified, the default merge strategy is to deeply merge objects.
    */
    entitymergeStrategy?: EntityMergeStrategy<
      CacheKeyRegistry,
      Key,
      $Debug,
      UserExtensionData
    >;
    /**
    An optional hook for merging the list of revisions for a cache entry.
    If unspecified, the default retention strategy is to keep the full history
    of an entry as long as it's in the cache, evicting revisions only when the
    value itself is evicted.
    */
    revisionMergeStrategy?: RevisionMergeStrategy<
      CacheKeyRegistry,
      Key,
      $Debug,
      UserExtensionData
    >;
  };
  expiration?: ExpirationPolicy;
  $debug?: $Debug;
}

export type DefaultRegistry = Record<string, object>;

export interface CacheDebugAPIs {
  size(): void;
  entries(): void;
  history(): void;
}

export interface TransactionUpdates<
  CacheKeyRegistry extends DefaultRegistry,
  Key extends keyof CacheKeyRegistry,
  UserExtensionData = unknown
> {
  entries: [Key, CacheKeyRegistry[Key], CacheEntryState<UserExtensionData>][];
  //entryRevisions: Map<Key, CachedEntityRevision<CacheKeyRegistry, Key>[]>;
}

export interface TransactionOperations<
  CacheKeyRegistry extends DefaultRegistry,
  Key extends keyof CacheKeyRegistry,
  $Debug = unknown,
  UserExtensionData = unknown
> {
  aquireTxCommitLock: (
    transaction: LiveCacheTransaction<
      CacheKeyRegistry,
      Key,
      $Debug,
      UserExtensionData
    >
  ) => Promise<unknown>;

  releaseTxCommitLock: (
    transaction: LiveCacheTransaction<
      CacheKeyRegistry,
      Key,
      $Debug,
      UserExtensionData
    >
  ) => void;
  applyRetentionPolicies: (
    cacheKey: Key,
    transaction: LiveCacheTransaction<
      CacheKeyRegistry,
      Key,
      $Debug,
      UserExtensionData
    >
  ) => Promise<void>;
  updateSavedRevisions: (
    localRevisionsMap: Map<Key, CachedEntityRevision<CacheKeyRegistry, Key>[]>
  ) => void;
  commitUpdatesAndReleaseLock: (
    transaction: LiveCacheTransaction<
      CacheKeyRegistry,
      Key,
      $Debug,
      UserExtensionData
    >,
    txUpdates: TransactionUpdates<CacheKeyRegistry, Key, UserExtensionData>
  ) => void;
}

export interface CacheTransactionDebugAPIs {
  size(): void;
  entries(): void;
}

export interface DeferredTransactionLock<
  CacheKeyRegistry extends DefaultRegistry,
  Key extends keyof CacheKeyRegistry,
  $Debug = unknown,
  UserExtensionData = unknown
> {
  resolve: () => void;
  reject: () => void;
  promise: Promise<unknown>;
  owner: LiveCacheTransaction<CacheKeyRegistry, Key, $Debug, UserExtensionData>;
}

/**
 * LRU Cache
 */
export interface LruCache<
  CacheKeyRegistry extends DefaultRegistry,
  Key extends keyof CacheKeyRegistry = keyof CacheKeyRegistry
> {
  set(cacheKey: Key, value: CacheKeyRegistry[Key]): void;
}
