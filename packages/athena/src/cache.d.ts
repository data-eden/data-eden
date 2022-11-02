type DefaultRegistry = Record<string, unknown>;
export function buildCache<CacheKeyRegistry = DefaultRegistry, $Debug = unknown, UserExtensionData = unknown>(options?: CacheOptions<CacheKeyRegistry, $Debug, UserExtensionData>): Cache<CacheKeyRegistry, $Debug, UserExtensionData>;

type CacheEntry<CacheKeyRegistry, UserExtensionData = unknown,Key extends keyof CacheKeyRegistry = keyof CacheKeyRegistry > = [key: Key, value: CacheKeyRegistry[Key], state: CacheEntryState<UserExtensionData>];

export interface CacheEntrySerializer<CacheKeyRegistry, Key extends keyof CacheKeyRegistry = keyof CacheKeyRegistry, SerializedValue = unknown, UserExtensionData = unknown> {
  serialize(cacheEntry: CacheEntry<CacheKeyRegistry>): [Key, SerializedValue, CacheEntryState<UserExtensionData>];
  deserialize(cacheEntry: [Key, SerializedValue, CacheEntryState<UserExtensionData>]): CacheEntry<CacheKeyRegistry>;
}

export interface Cache<CacheKeyRegistry, $Debug = unknown, UserExtensionData = unknown> {
  beginTransaction(): CacheTransaction<CacheKeyRegistry, $Debug, UserExtensionData>;

  get<Key extends keyof CacheKeyRegistry>(cacheKey: Key): Promise<CacheKeyRegistry[Key] | undefined>;

  /**
    Generator function that yields each of the cache entries. Note that this
    will include both strongly held (unexpired entries) as well as weakly held
    entries.
  */
  [Symbol.asyncIterator]<Key extends keyof CacheKeyRegistry>(): AsyncIterableIterator<[Key, CacheKeyRegistry[Key], CacheEntryState<UserExtensionData>]>

  /**
    Generator function that yields each of the cache entries. Note that this
    will include both strongly held (unexpired entries) as well as weakly held
    entries.
  */
  entries<Key extends keyof CacheKeyRegistry>(): AsyncIterableIterator<[Key, CacheKeyRegistry[Key], CacheEntryState<UserExtensionData>]>
  entryRevisions<Key extends keyof CacheKeyRegistry>(cacheKey: Key): AsyncIterableIterator<[entity: CacheKeyRegistry[Key], revision: number][]>;
  keys<Key extends keyof CacheKeyRegistry>(): AsyncIterableIterator<Key>
  values<Key extends keyof CacheKeyRegistry>(): AsyncIterableIterator<CacheKeyRegistry[Key]>

  /**
    Calling `.save()` without a serializer will iterate over the cache entries
    and return an array of cache entry tuples. The values contained within the
    tuples are copied via `structuredClone`.

    If your cache entries are not structured clonable, (e.g. a function)
    `.save()` will throw an error. In this case, use the alternate form of
    `.save` passing in a `CacheEntrySerializer`.

    @see <https://developer.mozilla.org/en-US/docs/Web/API/structuredClone>
  */
  save<Key extends keyof CacheKeyRegistry>(): Promise<[Key, CacheKeyRegistry[Key], CacheEntryState<UserExtensionData>][]>;

  /**
    Calling `.save()` passing a `CacheEntrySerializer` will iterate over the
    cache entries and pass each cache entry tuple in to the `serializer.serialize()`
    function. The `serializer.serialize()` method is expected to return a
    serialized cache entry tuple that its `serializer.deserialize()` can
    interprete back into a cache entry tuple.

    This is mainly intended to allow cache values that are not structured
    clonable to be saved/loaded. If all of your cached values are structured
    clonable (e.g. simple POJOs, strings, numbers, booleans, etc) you do not
    need to pass a `CacheEntrySerializer` and you can call `.save()` (without
    arguments).
  */
  save(serializer: CacheEntrySerializer<CacheKeyRegistry>): Promise<ReturnType<CacheEntrySerializer<CacheKeyRegistry>['serialize']>[]>;

  /**
    Calling `.load()` will add all entries passed to the cache.

    Note: `.load()` does not clear pre-existing entries, if you need to clear
    entries before loading call `.clear()`.
  */
  load(entries: CacheEntry<CacheKeyRegistry>[]): Promise<void>;
  load(serializer: CacheEntrySerializer<CacheKeyRegistry>): Promise<ReturnType<CacheEntrySerializer<CacheKeyRegistry>['deserialize']>[]>;

  /**
    Evict all entries from the cache.
  */
  clear(): void;

  get options(): CacheOptions<CacheKeyRegistry, $Debug, UserExtensionData>;

  $debug: $Debug & CacheDebugAPIs;
}

export interface CacheOptions<CacheKeyRegistry = DefaultRegistry, $Debug = unknown, UserExtensionData = unknown> {
  hooks: {
    /**
    An optional callback that is invoked just before a transaction is committed.

    This does not allow users to mutate the transaction, but it is a hook where
    custom retention policies can be implemented.

    The default retention policies are all implementable in userland as commit hooks.
    */
    commit?: (tx: CacheTransaction<CacheKeyRegistry, $Debug, UserExtensionData>) => void;
    /**
    An optional hook for merging new versions of an entity into the cache. This
    hook specifies the default behaviour for the cache -- a different merge
    strategy can be passed in per call to `LiveCacheTransaction.merge`

    The hook returns the updated merged entry -- it may not mutate any of its arguments.

    If unspecified, the default merge strategy is to deeply merge objects.
    */
    entitymergeStrategy?: EntityMergeStrategy<CacheKeyRegistry, $Debug, UserExtensionData>;
    /**
    An optional hook for merging the list of revisions for a cache entry.

    If unspecified, the default retention strategy is to keep the full history
    of an entry as long as it's in the cache, evicting revisions only when the
    value itself is evicted.
    */
    revisionMergeStrategy?: RevisionMergeStrategy<CacheKeyRegistry>;
  }
  expiration?: ExpirationPolicy;
  $debug?: $Debug;
}

type ExpirationPolicy = false | {
  lru: number;
  ttl: number;
}

export interface EntityMergeStrategy<CacheKeyRegistry, $Debug = unknown, UserExtensionData = unknown> {
  <Key extends keyof CacheKeyRegistry>(cacheKey: Key, newEntityRevision: CachedEntityRevision<CacheKeyRegistry[Key]>, current: CacheKeyRegistry[Key] | undefined, tx: CacheTransaction<CacheKeyRegistry, $Debug, UserExtensionData>): CacheKeyRegistry[Key];
}

export interface RevisionMergeStrategy<CacheKeyRegistry, $Debug = unknown, UserExtensionData = unknown> {
  <Key extends keyof CacheKeyRegistry>(cacheKey: Key, tx: CommittingTransaction<CacheKeyRegistry, $Debug, UserExtensionData>): void;
}

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

export interface CacheDebugAPIs {
  size(): void;
  entries(): void;
  history(): void;
}
export interface CacheTransactionDebugAPIs {
  size(): void;
  entries(): void;
}

interface CachedEntityRevision<CacheKeyValue> {
  entity: CacheKeyValue;
  revision: number;
}

export interface CacheTransaction<CacheKeyRegistry, $Debug = unknown, UserExtensionData = unknown> {
  /**
  Get the value of `cacheKey` in the cache.  If `key` has been modified in this
  transaction (e.g. via `merge` or `set`), `tx.get` will return the updated
  entry in this transaction. The return value can therefore differ from
  `cache.get`.
  */
  get<Key extends keyof CacheKeyRegistry>(cacheKey: Key): Promise<CacheKeyRegistry[Key] | undefined>;
  localEntries<Key extends keyof CacheKeyRegistry>(): AsyncIterableIterator<[Key, CacheKeyRegistry[Key], CacheEntryState]>
  entries<Key extends keyof CacheKeyRegistry>(): AsyncIterableIterator<[Key, CacheKeyRegistry[Key], CacheEntryState]>
  /**
    Generator function that yields each of the transaction local entries.
  */
  [Symbol.asyncIterator]<Key extends keyof CacheKeyRegistry>(): AsyncIterableIterator<[Key, CacheKeyRegistry[Key], CacheEntryState<UserExtensionData>]>
  /**
  An async generator that produces the revisions of `key` within this transaction.
  */
  localRevisions<Key extends keyof CacheKeyRegistry>(cacheKey: Key): AsyncIterableIterator<CachedEntityRevision<CacheKeyRegistry[Key]>>;
  /**
  An async generator that produces the complete list of revisions for `key`,
  from the time the transaction began and including the revisions added in this
  transaction.
  */
  entryRevisions<Key extends keyof CacheKeyRegistry>(cacheKey: Key): AsyncIterableIterator<CachedEntityRevision<CacheKeyRegistry[Key]>>;

  $debug: $Debug & CacheTransactionDebugAPIs;
}
export interface CommittingTransaction<CacheKeyRegistry, $Debug = unknown, UserExtensionData = unknown> extends CacheTransaction<CacheKeyRegistry, $Debug, UserExtensionData> {
  cache: {
    clearRevisions<Key extends keyof CacheKeyRegistry>(id: Key): void;
    appendRevisions<Key extends keyof CacheKeyRegistry>(id: Key, revisions: CachedEntityRevision<CacheKeyRegistry[Key]>[]): void;
  }
}
export interface LiveCacheTransaction<CacheKeyRegistry, $Debug = unknown, UserExtensionData = unknown> extends CacheTransaction<CacheKeyRegistry, $Debug, UserExtensionData> {
  merge<Key extends keyof CacheKeyRegistry>(cacheKey: Key, value: CachedEntityRevision<CacheKeyRegistry[Key]>, options?: {
    entityMergeStrategy: EntityMergeStrategy<CacheKeyRegistry, $Debug, UserExtensionData>;
    revisionMergeStrategy: RevisionMergeStrategy<CacheKeyRegistry, $Debug, UserExtensionData>;
    $debug: $Debug;
  }): Promise<CacheKeyRegistry[Key]>;
  set<Key extends keyof CacheKeyRegistry>(cacheKey: Key, value: CacheKeyRegistry[Key]): Promise<CacheKeyRegistry[Key]>;
  delete<Key extends keyof CacheKeyRegistry>(cacheKey: Key): Promise<boolean>;

  /**

  Updates the cache values.

    * Entities with an updated value (either from merging or setting) are
      updated in the cache (i.e. calling cache.get(key) will return the values
      set in the transation)
    * Entities deleted from the transaction are deleted from the cache.

  Updates the cache revisions.
    * The retention merge strategy is called for each entity with new
      revisions. It is called with a CommittingTransaction and has the
      opportunity to update the saved revisions for an entity.


  **Transaction Conflicts**

  During a transaction, merges occurred between new revisions of an entity and
  the revision in the cache at the time the transaction began. If a separate
  transaction has committed since then, these merges may be out of date. When
  this happens, `mergeStrategy` will be called again during `commit` to resolve
  these merge conflicts.

  **Transaction Timeout**

  `commit` is atomic -- when it is called it will attempt to acquire the write
  lock for the cache. After `timeout` milliseconds the promise will reject if
  it has not yet acquired the lock.

  If `timeout` is `false` then commit will immediately rejectd if it cannot
  acquire the write lock.

  */
  commit(options?: {
    timeout: number | false;
  }): Promise<void>;

  /**
  Abandon this transaction and discard any changes or other transaction state.
  */
  rollback(): void;
}

export function defaultMergeStrategy<CacheKeyRegistry, $Debug = unknown, UserExtensionData = unknown>(): EntityMergeStrategy<CacheKeyRegistry, $Debug, UserExtensionData>;
