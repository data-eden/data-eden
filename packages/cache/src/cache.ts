import type {
  Cache,
  CacheTransaction,
  LiveCacheTransaction,
  CommittingTransaction,
  CacheEntry,
  CacheEntryState,
  CacheKeyValue,
  CachedEntityRevision,
  ExpirationPolicy,
  CacheOptions,
  DefaultRegistry,
  LruCache,
  CacheTransactionDebugAPIs,
  EntityMergeStrategy,
  // RevisionMergeStrategy,
  TransactionUpdates,
  TransactionOperations,
  DeferredTransactionLock,
} from './index.js';

let REVISION_COUNTER = 0;

class CacheImpl<
  CacheKeyRegistry extends DefaultRegistry,
  Key extends keyof CacheKeyRegistry,
  $Debug = unknown,
  UserExtensionData = unknown
> implements Cache<CacheKeyRegistry, Key, $Debug, UserExtensionData>
{
  #weakCache: Map<Key, WeakRef<CacheKeyRegistry[Key]>>;
  #entryRevisions: Map<Key, CachedEntityRevision<CacheKeyRegistry, Key>[]>;
  #cacheOptions:
    | CacheOptions<CacheKeyRegistry, Key, $Debug, UserExtensionData>
    | undefined;
  #cacheEntryState: Map<Key, CacheEntryState<UserExtensionData> | undefined>;
  #lruCache: LruCacheImpl<CacheKeyRegistry, Key>;
  #lruPolicy: number;
  #cleanup: FinalizationRegistry<Key>;

  #txCommitLockOwner: LiveCacheTransaction<
    CacheKeyRegistry,
    Key,
    $Debug,
    UserExtensionData
  > | null;

  #txCommitLockQueue: DeferredTransactionLock<
    CacheKeyRegistry,
    Key,
    $Debug,
    UserExtensionData
  >[];

  constructor(
    options:
      | CacheOptions<CacheKeyRegistry, Key, $Debug, UserExtensionData>
      | undefined
  ) {
    this.#weakCache = new Map<Key, WeakRef<CacheKeyRegistry[Key]>>();
    this.#cacheOptions = options;
    this.#lruPolicy = DEFAULT_EXPIRATION.lru;
    this.#entryRevisions = new Map<
      Key,
      CachedEntityRevision<CacheKeyRegistry, Key>[]
    >();
    this.#cacheEntryState = new Map<
      Key,
      CacheEntryState<UserExtensionData> | undefined
    >();

    const expiration = this.#cacheOptions?.expiration || DEFAULT_EXPIRATION;
    if (expiration && expiration?.lru && typeof expiration.lru === 'number') {
      this.#lruPolicy = expiration.lru;
    }
    this.#lruCache = new LruCacheImpl<CacheKeyRegistry, Key>(this.#lruPolicy);

    this.#txCommitLockOwner = null;
    this.#txCommitLockQueue = [];

    // A `FinalizationRegistry` is created to remove the strongly held keys after the value is garbage-collected.
    this.#cleanup = new FinalizationRegistry((key: Key) => {
      // See note below on concurrency considerations.
      const cache = this.#weakCache;
      const ref = cache.get(key);
      if (ref && !ref.deref()) cache.delete(key);
    });
  }

  /**
    Evict all entries from the cache.
  */
  async clear(): Promise<void> {
    for await (const [key] of this.entries()) {
      this.#weakCache.delete(key);
      this.#lruCache.getCache().delete(key);
      this.#entryRevisions.delete(key);
    }
  }

  getCacheOptions():
    | CacheOptions<CacheKeyRegistry, Key, $Debug, UserExtensionData>
    | undefined {
    return this.#cacheOptions;
  }

  async get(cacheKey: Key): Promise<CacheKeyRegistry[Key] | undefined> {
    let ref = this.#weakCache.get(cacheKey);
    return ref?.deref();
  }

  /**
    Calling `.save()` without a serializer will iterate over the cache entries
    and return an array of cache entry tuples.
  */
  async save(): Promise<
    [
      Key,
      CacheKeyRegistry[Key],
      CacheEntryState<UserExtensionData> | undefined
    ][]
  > {
    const arrayOfCacheEntryTuples: [
      Key,
      CacheKeyRegistry[Key],
      CacheEntryState<UserExtensionData> | undefined
    ][] = [];
    for await (const [key, value, state] of this.entries()) {
      // TODO create state?
      const structuredClonedValue = structuredClone(
        value
      ) as CacheKeyRegistry[Key];
      arrayOfCacheEntryTuples.push([key, structuredClonedValue, state]);
    }
    return arrayOfCacheEntryTuples;
  }

  /**
    Calling `.load()` will add all entries passed to the cache.
    Note: `.load()` does not clear pre-existing entries, if you need to clear
    entries before loading call `.clear()`.
  */
  async load(
    entries: CacheEntry<CacheKeyRegistry, Key, UserExtensionData>[]
  ): Promise<void> {
    let revisionCounter = 0;
    for await (let entry of entries) {
      let [key, value, state] = entry;

      let clone = structuredClone(value) as CacheKeyRegistry[Key];
      this.#weakCache.set(key, new WeakRef(clone));

      // Register FinalizationRegistry so strongly held keys are removed
      this.#cleanup.register(clone, key);

      this.#lruCache.set(key, clone);
      this.#cacheEntryState.set(key, state);

      const entityRevision = {
        entity: value,
        revision: ++revisionCounter,
      };
      if (this.#entryRevisions.has(key)) {
        const revisions =
          this.#entryRevisions.get(key)?.concat(entityRevision) || [];
        this.#entryRevisions.set(key, revisions);
      } else {
        this.#entryRevisions.set(key, [entityRevision]);
      }
    }
  }

  /**
    Generator function for async iterable that yields iterable cache entries. This
    will include both strongly held (unexpired entries) as well as weakly held
    entries.
  */
  async *[Symbol.asyncIterator](): AsyncIterableIterator<
    [Key, CacheKeyRegistry[Key], CacheEntryState<UserExtensionData>]
  > {
    // yield weekly held values
    for await (const [key] of this.#weakCache) {
      const valueRef = this.#weakCache.get(key)?.deref();

      // Because of the limited guarantees of `FinalizationRegistry`, when yielding
      // weakly-held values to the user in `entries` we have to check that the
      // value is actually present,
      if (valueRef) {
        const state = this.#cacheEntryState.get(key) || DEFAULT_ENTRY_STATE;

        yield [key, valueRef, state];
      }
    }
  }

  /**
    Generator function that yields each of the iterable cache entries. Note that this
    will include both strongly held (unexpired entries) as well as weakly held
    entries.
  */
  entries(): AsyncIterableIterator<
    [Key, CacheKeyRegistry[Key], CacheEntryState<UserExtensionData>]
  > {
    return this[Symbol.asyncIterator]();
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

    const revisions = this.#entryRevisions.get(cacheKey) || [];
    return entryRevisionIterator[Symbol.asyncIterator](revisions);
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

  #deferTxLock(
    transaction: LiveCacheTransaction<
      CacheKeyRegistry,
      Key,
      $Debug,
      UserExtensionData
    >
  ) {
    let resolveTxLock;
    let rejectTxLock;

    const promiseTxLock = new Promise((resolve, reject) => {
      resolveTxLock = resolve;
      rejectTxLock = reject;
    });

    return {
      resolve: resolveTxLock as unknown as () => void,
      reject: rejectTxLock as unknown as () => void,
      promise: promiseTxLock,
      owner: transaction,
    };
  }

  #aquireTxCommitLock(
    transaction: LiveCacheTransaction<
      CacheKeyRegistry,
      Key,
      $Debug,
      UserExtensionData
    >
  ): Promise<unknown> {
    if (this.#txCommitLockOwner === null) {
      this.#txCommitLockOwner = transaction;
      return new Promise((resolve) => {
        // start a timeout to ensure tx cannot hold on to the lock indefinitely
        resolve(this.#txCommitLockOwner);
        setTimeout(() => {
          // if transaction is still locked after 3 seconds then release the lock
          this.#releaseTxCommitLock(transaction);
        }, 3000);
        return;
      });
    }

    let deferredTransactionLock = this.#deferTxLock(transaction);
    this.#txCommitLockQueue.push(deferredTransactionLock);
    return deferredTransactionLock.promise;
  }

  #releaseTxCommitLock(
    transaction: LiveCacheTransaction<
      CacheKeyRegistry,
      Key,
      $Debug,
      UserExtensionData
    >
  ): void {
    //assert(this.#txCommitLockOwner === transaction, 'transaction owner incorrectly assigned when releasing lock');
    if (this.#txCommitLockOwner === transaction) {
      this.#txCommitLockOwner = null;
    }
  }

  #commitUpdatesAndReleaseLock(
    transaction: LiveCacheTransaction<
      CacheKeyRegistry,
      Key,
      $Debug,
      UserExtensionData
    >,
    txUpdates: TransactionUpdates<CacheKeyRegistry, Key, UserExtensionData>
  ): void {
    assert(
      this.#txCommitLockOwner === transaction,
      'transaction owner incorrectly assigned when commiting updates'
    );

    // Write transaction entries to the main cache
    for (const entry of txUpdates.entries) {
      const [key, value, state] = entry as CacheEntry<
        CacheKeyRegistry,
        Key,
        UserExtensionData
      >;

      this.#weakCache.set(key, new WeakRef(value));

      this.#cacheEntryState.set(key, state);

      if (state?.retained.lru) {
        this.#lruCache.set(key, value);
      }
    }

    // Write transaction revisions entries to the main cache
    for (const [cacheKey, revision] of txUpdates.entryRevisions) {
      if (this.#entryRevisions.has(cacheKey)) {
        const revisions =
          this.#entryRevisions.get(cacheKey)?.concat(revision) || [];
        this.#entryRevisions.set(cacheKey, revisions);
      } else {
        this.#entryRevisions.set(cacheKey, revision);
      }
    }

    this.#releaseTxCommitLock(transaction);

    if (this.#txCommitLockQueue.length > 0) {
      const waitingTxDeferred =
        this.#txCommitLockQueue.shift() as DeferredTransactionLock<
          CacheKeyRegistry,
          Key,
          $Debug,
          UserExtensionData
        >;
      if (waitingTxDeferred) {
        //this.#txCommitLockOwner = null;
        this.#txCommitLockOwner =
          waitingTxDeferred.owner as LiveCacheTransactionImpl<
            CacheKeyRegistry,
            Key,
            $Debug,
            UserExtensionData
          >;
      }

      waitingTxDeferred.resolve();
    }
  }

  async beginTransaction(): Promise<
    LiveCacheTransaction<CacheKeyRegistry, Key, $Debug, UserExtensionData>
  > {
    const aquireTxCommitLock = (
      transaction: LiveCacheTransaction<
        CacheKeyRegistry,
        Key,
        $Debug,
        UserExtensionData
      >
    ) => this.#aquireTxCommitLock(transaction);

    const releaseTxCommitLock = (
      transaction: LiveCacheTransaction<
        CacheKeyRegistry,
        Key,
        $Debug,
        UserExtensionData
      >
    ) => this.#releaseTxCommitLock(transaction);

    const commitUpdatesAndReleaseLock = (
      transaction: LiveCacheTransaction<
        CacheKeyRegistry,
        Key,
        $Debug,
        UserExtensionData
      >,
      txUpdates: TransactionUpdates<CacheKeyRegistry, Key, UserExtensionData>
    ) => this.#commitUpdatesAndReleaseLock(transaction, txUpdates);

    return new LiveCacheTransactionImpl<
      CacheKeyRegistry,
      Key,
      $Debug,
      UserExtensionData
    >(this, {
      aquireTxCommitLock,
      releaseTxCommitLock,
      commitUpdatesAndReleaseLock,
    });
  }
}

class LiveCacheTransactionImpl<
  CacheKeyRegistry extends DefaultRegistry,
  Key extends keyof CacheKeyRegistry,
  $Debug = unknown,
  UserExtensionData = unknown
> implements
    LiveCacheTransaction<CacheKeyRegistry, Key, $Debug, UserExtensionData>
{
  #originalCacheReference: CacheImpl<
    CacheKeyRegistry,
    Key,
    $Debug,
    UserExtensionData
  >;
  #transactionalCache: Map<Key, CacheKeyRegistry[Key]>;
  #commitingTransaction: CommittingTransactionImpl<
    CacheKeyRegistry,
    Key,
    $Debug,
    UserExtensionData
  >;
  #cacheEntryState: Map<Key, CacheEntryState<UserExtensionData>>;
  #userOptionRetentionPolicy: ExpirationPolicy;
  #ttlPolicy: number;
  #lruPolicy: number;
  #localRevisions: Map<Key, CachedEntityRevision<CacheKeyRegistry, Key>[]>;
  #entryRevisions: Map<Key, CachedEntityRevision<CacheKeyRegistry, Key>[]>;
  #transactionOperations: TransactionOperations<
    CacheKeyRegistry,
    Key,
    $Debug,
    UserExtensionData
  >;

  constructor(
    originalCache: CacheImpl<CacheKeyRegistry, Key, $Debug, UserExtensionData>,
    transactionOperations: TransactionOperations<
      CacheKeyRegistry,
      Key,
      $Debug,
      UserExtensionData
    >
  ) {
    this.#originalCacheReference = originalCache;
    this.#transactionalCache = new Map<Key, CacheKeyRegistry[Key]>();
    this.#cacheEntryState = new Map<Key, CacheEntryState<UserExtensionData>>();
    this.#ttlPolicy = DEFAULT_EXPIRATION.ttl;
    this.#lruPolicy = DEFAULT_EXPIRATION.lru;
    this.#localRevisions = new Map<
      Key,
      CachedEntityRevision<CacheKeyRegistry, Key>[]
    >();
    this.#entryRevisions = new Map<
      Key,
      CachedEntityRevision<CacheKeyRegistry, Key>[]
    >();
    this.#userOptionRetentionPolicy =
      this.#originalCacheReference.getCacheOptions()?.expiration ||
      DEFAULT_EXPIRATION;

    if (
      this.#userOptionRetentionPolicy &&
      this.#userOptionRetentionPolicy?.lru &&
      typeof this.#userOptionRetentionPolicy.lru === 'number'
    ) {
      this.#lruPolicy = this.#userOptionRetentionPolicy.lru;
    }

    if (
      this.#userOptionRetentionPolicy &&
      this.#userOptionRetentionPolicy?.ttl &&
      typeof this.#userOptionRetentionPolicy.ttl === 'number'
    ) {
      this.#ttlPolicy = this.#userOptionRetentionPolicy.ttl;
    }

    this.#commitingTransaction = new CommittingTransactionImpl<
      CacheKeyRegistry,
      Key,
      $Debug,
      UserExtensionData
    >();

    this.#transactionOperations = transactionOperations;
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
        cacheRef: CacheImpl<CacheKeyRegistry, Key, $Debug, UserExtensionData>
      ): AsyncIterableIterator<[Key, CacheKeyRegistry[Key]]> {
        for await (const [key, transactionValue] of localEntriesIterator) {
          yield [key, transactionValue];
          const cacheValue = await cacheRef.get(key);
          if (cacheValue) {
            yield [key, cacheValue];
          }
        }
      },
    };

    return entriesIterator[Symbol.asyncIterator](
      this.localEntries(),
      this.#originalCacheReference
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

    const revisions = this.#localRevisions.get(cacheKey) || [];
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

    const entryRevisions = this.#entryRevisions.get(cacheKey) || [];
    const localRevisions = this.#localRevisions.get(cacheKey) || [];

    return entryRevisionIterator[Symbol.asyncIterator](
      entryRevisions.concat(localRevisions)
    );
  }

  async set(
    cacheKey: Key,
    value: CacheKeyRegistry[Key]
  ): Promise<CacheKeyRegistry[Key]> {
    this.#transactionalCache.set(cacheKey, value);

    // Update cache entry state
    this.#cacheEntryState.set(cacheKey, {
      retained: { lru: true, ttl: this.#ttlPolicy },
      lastAccessed: Date.now(),
    });

    return (await this.get(cacheKey)) as CacheKeyRegistry[Key];
  }

  async delete(cacheKey: Key): Promise<boolean> {
    // tx.delete will actually need to write a tombstone in the transaction entries and the actual delete will occur when the transaction is committed to the cache.
    // The semantics of tx.delete's return value should be "did i delete something?"
    if (await this.get(cacheKey)) {
      this.#transactionalCache.delete(cacheKey);

      // Update cache entry state to indicate as delete in order to actually be deleted from cache when commit
      this.#cacheEntryState.set(cacheKey, {
        retained: { lru: false, ttl: 0 },
        deletedRecordInTransaction: true,
        lastAccessed: Date.now(),
      });
      return true;
    }

    return false;
  }

  // assign transaction or cache level overriden merge strategy else use default
  #getMergeStrategy(
    transactionMergeStrategy?: EntityMergeStrategy<
      CacheKeyRegistry,
      Key,
      $Debug,
      UserExtensionData
    >
  ) {
    const cacheWideMergeStrategy =
      this.#originalCacheReference.getCacheOptions()?.hooks
        ?.entitymergeStrategy;

    return (
      transactionMergeStrategy || cacheWideMergeStrategy || defaultMergeStrategy
    );
  }

  #getRevisionStrategy() {
    const cacheWideRevisionStrategy =
      this.#originalCacheReference.getCacheOptions()?.hooks
        ?.revisionMergeStrategy;

    return cacheWideRevisionStrategy || defaultRevisionStrategy;
  }

  async merge(
    cacheKey: Key,
    entity: CacheKeyRegistry[Key],
    options?: {
      entityMergeStrategy: EntityMergeStrategy<
        CacheKeyRegistry,
        Key,
        $Debug,
        UserExtensionData
      >;
      revisionContext: string;
      $debug: $Debug;
    }
  ): Promise<CacheKeyRegistry[Key] | CacheKeyValue> {
    const mergeStrategy = this.#getMergeStrategy(options?.entityMergeStrategy);

    // get current cache value within this transaction
    const currentValue = await this.#originalCacheReference.get(cacheKey);
    const revisionCounter = REVISION_COUNTER++;

    // get merged entity
    const mergedEntity = currentValue
      ? entity
      : mergeStrategy(
          cacheKey,
          {
            entity,
            revision: REVISION_COUNTER++,
            revisionContext: options?.revisionContext,
          },
          currentValue,
          this
        );

    // Update transactional cache with merged entity
    // Calling set here will in turn also update cacheEntryState
    await this.set(cacheKey, mergedEntity as CacheKeyRegistry[Key]);

    // Update local & entry revisions with new revision values
    const revision = {
      entity: mergedEntity as CacheKeyRegistry[Key],
      revision: revisionCounter,
      revisionContext: options?.revisionContext,
    };
    if (this.#localRevisions.has(cacheKey)) {
      this.#localRevisions.get(cacheKey)?.push(revision);
    } else {
      this.#localRevisions.set(cacheKey, [revision]);
    }

    return mergedEntity;
  }

  async #prepareTransaction(): Promise<
    TransactionUpdates<CacheKeyRegistry, Key, UserExtensionData>
  > {
    const trasactionCacheEntries: [
      Key,
      CacheKeyRegistry[Key],
      CacheEntryState<UserExtensionData>
    ][] = [];

    for await (const [cacheKey, value] of this.localEntries()) {
      const latestCacheValue = await this.#originalCacheReference.get(cacheKey);
      let mergedEntityToCommit;
      const mergeStrategy = this.#getMergeStrategy();

      if (latestCacheValue) {
        // TODO fix revision
        mergedEntityToCommit = mergeStrategy(
          cacheKey,
          { entity: value, revision: 3 },
          latestCacheValue,
          this
        );
      } else {
        mergedEntityToCommit = value;
      }
      const structuredClonedValue = structuredClone(
        mergedEntityToCommit
      ) as CacheKeyRegistry[Key];

      const state = this.#cacheEntryState.get(cacheKey) || DEFAULT_ENTRY_STATE;

      trasactionCacheEntries.push([cacheKey, structuredClonedValue, state]);

      // Update saved revisions of the entity
      const localRevisions = this.#localRevisions.get(cacheKey);
      let revisionNumber =
        localRevisions && localRevisions[localRevisions.length - 1].revision
          ? localRevisions[localRevisions.length - 1].revision
          : 0;

      const entityRevision = {
        entity: mergedEntityToCommit as CacheKeyRegistry[Key],
        revision: ++revisionNumber,
      };
      if (this.#localRevisions.has(cacheKey)) {
        this.#localRevisions.get(cacheKey)?.push(entityRevision);
      } else {
        this.#localRevisions.set(cacheKey, [entityRevision]);
      }

      const revisionStrategy = this.#getRevisionStrategy();

      // Update revisions based on revision strategy
      await revisionStrategy(cacheKey, this.#commitingTransaction, this);
    }

    // Call commit hook to apply custom retention policies before commit (if passed by cache options)
    const commitCallback =
      this.#originalCacheReference.getCacheOptions()?.hooks?.commit;
    if (commitCallback) {
      await commitCallback(this);
    }

    const mergedRevisions = this.#commitingTransaction.mergedRevisions();
    return {
      entries: trasactionCacheEntries,
      entryRevisions: mergedRevisions,
    };
  }

  async commit(options?: { timeout: number | false }): Promise<void> {
    await this.#transactionOperations.aquireTxCommitLock(this);

    let transactionUpdates;
    try {
      transactionUpdates = await this.#prepareTransaction();
      return this.#transactionOperations.commitUpdatesAndReleaseLock(
        this,
        transactionUpdates
      );
    } catch (e) {
      throw new Error('Failed to prepare transaction updates');
    } finally {
      this.#transactionOperations.releaseTxCommitLock(this);
    }
  }
}

class CommittingTransactionImpl<
  CacheKeyRegistry extends DefaultRegistry,
  Key extends keyof CacheKeyRegistry = keyof CacheKeyRegistry,
  $Debug = unknown,
  UserExtensionData = unknown
> implements
    CommittingTransaction<CacheKeyRegistry, Key, $Debug, UserExtensionData>
{
  $debug?: ($Debug & CacheTransactionDebugAPIs) | undefined;
  #mergedRevisions: Map<Key, CachedEntityRevision<CacheKeyRegistry, Key>[]>;
  cache: {
    clearRevisions(
      tx: CommittingTransactionImpl<
        CacheKeyRegistry,
        Key,
        $Debug,
        UserExtensionData
      >,
      id: Key
    ): void;
    appendRevisions(
      tx: CommittingTransactionImpl<
        CacheKeyRegistry,
        Key,
        $Debug,
        UserExtensionData
      >,
      id: Key,
      revisions: CachedEntityRevision<CacheKeyRegistry, Key>[]
    ): void;
  } = {
    clearRevisions(
      tx: CommittingTransactionImpl<
        CacheKeyRegistry,
        Key,
        $Debug,
        UserExtensionData
      >,
      id: Key
    ): void {
      tx.#mergedRevisions.delete(id);
    },

    appendRevisions(
      tx: CommittingTransactionImpl<
        CacheKeyRegistry,
        Key,
        $Debug,
        UserExtensionData
      >,
      id: Key,
      revisions: CachedEntityRevision<CacheKeyRegistry, Key>[]
    ): void {
      if (tx.#mergedRevisions.has(id)) {
        const appendedRevisions =
          tx.#mergedRevisions.get(id)?.concat(revisions) || [];
        tx.#mergedRevisions.set(id, appendedRevisions);
      } else {
        tx.#mergedRevisions.set(id, revisions);
      }
    },
  };

  constructor() {
    this.#mergedRevisions = new Map<
      Key,
      CachedEntityRevision<CacheKeyRegistry, Key>[]
    >();
  }

  [Symbol.asyncIterator](): AsyncIterableIterator<
    [Key, CacheKeyRegistry[Key], CacheEntryState<UserExtensionData>]
  > {
    throw new Error('Method not implemented.');
  }

  mergedRevisions(): Map<Key, CachedEntityRevision<CacheKeyRegistry, Key>[]> {
    return this.#mergedRevisions;
  }
}

export function buildCache<
  CacheKeyRegistry extends DefaultRegistry = DefaultRegistry,
  Key extends keyof CacheKeyRegistry = keyof CacheKeyRegistry,
  $Debug = unknown,
  UserExtensionData = unknown
>(
  options?: CacheOptions<CacheKeyRegistry, Key, $Debug, UserExtensionData>
): Cache<CacheKeyRegistry, Key, $Debug, UserExtensionData> {
  return new CacheImpl<CacheKeyRegistry, Key, $Debug, UserExtensionData>(
    options
  );
}

class LruCacheImpl<
  CacheKeyRegistry extends DefaultRegistry,
  Key extends keyof CacheKeyRegistry
> implements LruCache<CacheKeyRegistry, Key>
{
  #max: number;
  #lruCache: Map<Key, CacheKeyRegistry[Key]>;

  constructor(maxCapacity: number) {
    this.#max = maxCapacity;
    this.#lruCache = new Map<Key, CacheKeyRegistry[Key]>();
  }

  set(cacheKey: Key, value: CacheKeyRegistry[Key]) {
    // refresh data
    if (this.#lruCache.has(cacheKey)) {
      this.#lruCache.delete(cacheKey);
    } else if (this.#lruCache.size === this.#max) {
      // find and evict the LRU entry
      const lruEntryKey = this.#lruCache.keys().next().value as Key;
      this.#lruCache.delete(lruEntryKey);
    }

    this.#lruCache.set(cacheKey, value);
  }

  getCache(): Map<Key, CacheKeyRegistry[Key]> {
    return this.#lruCache;
  }
}

const DEFAULT_EXPIRATION = { lru: 10000, ttl: 60000 };

const DEFAULT_ENTRY_STATE = {
  retained: { lru: false, ttl: DEFAULT_EXPIRATION.ttl },
};

const defaultMergeStrategy = function deepMergeStratey<
  CacheKeyRegistry extends DefaultRegistry,
  Key extends keyof CacheKeyRegistry
>(
  id: Key,
  { entity }: CachedEntityRevision<CacheKeyRegistry, Key>,
  current: CacheKeyRegistry[Key] | undefined,
  tx: CacheTransaction<CacheKeyRegistry, Key>
): CacheKeyValue {
  return deepMerge(current as CacheKeyValue, entity as CacheKeyValue);
};

const defaultRevisionStrategy = async function retainAllRevisions<
  CacheKeyRegistry extends DefaultRegistry,
  Key extends keyof CacheKeyRegistry,
  $Debug = unknown,
  UserExtensionData = unknown
>(
  id: Key,
  commitTx: CommittingTransactionImpl<
    CacheKeyRegistry,
    Key,
    $Debug,
    UserExtensionData
  >,
  liveTx: LiveCacheTransactionImpl<
    CacheKeyRegistry,
    Key,
    $Debug,
    UserExtensionData
  >
): Promise<void> {
  const revisions: CachedEntityRevision<CacheKeyRegistry, Key>[] = [];

  for await (const revision of liveTx.localRevisions(id)) {
    revisions.push(revision);
  }

  commitTx.cache.appendRevisions(commitTx, id, [...revisions]);
};

// eslint-disable-next-line
const isObject = function isObject(obj: any): obj is Record<string, any> {
  return obj !== null && !Array.isArray(obj) && typeof obj === 'object';
};

function deepMerge(
  targetData: CacheKeyValue,
  sourceData: CacheKeyValue
): CacheKeyValue {
  const source = isObject(sourceData) ? { ...sourceData } : sourceData;
  const target = isObject(targetData) ? { ...targetData } : targetData;

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

function resolveConflict(
  target: Record<string, object | string | number>,
  source: Record<string, object | string | number>,
  property: string
): CacheKeyValue {
  return deepMerge(
    target[property] as CacheKeyValue,
    source[property] as CacheKeyValue
  );
}

// eslint-disable-next-line
function structuredClone(x: any): any {
  try {
    return JSON.parse(JSON.stringify(x));
  } catch (error) {
    throw new Error(
      'The cache value is not structured clonable use `save` with serializer'
    );
  }
}

export function assert<T>(
  value: T,
  message: string | (() => string)
): asserts value {
  if (!value) {
    if (typeof message === 'string') {
      throw new Error(`[@data-eden/cache] internal error: ${message}`);
    }

    if (typeof message === 'function') {
      throw new Error(`[@data-eden/cache] internal error: ${message()}`);
    }
  }
}
