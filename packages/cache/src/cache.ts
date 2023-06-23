import { LiveCacheTransactionImpl } from './live-transaction.js';
import { CommittingTransactionImpl } from './cache-revision.js';
import type {
  Cache,
  CacheTransaction,
  LiveCacheTransaction,
  CommittingTransaction,
  CacheEntry,
  CacheEntryState,
  CacheKeyValue,
  CachedEntityRevision,
  CacheOptions,
  DefaultRegistry,
  LruCache,
  TransactionUpdates,
  DeferredTransactionLock,
} from './index.js';

export const DEFAULT_EXPIRATION = { lru: 10000, ttl: 60000 };

export const DEFAULT_ENTRY_STATE = {
  retained: { lru: false, ttl: DEFAULT_EXPIRATION.ttl },
};

class CacheImpl<
  CacheKeyRegistry extends DefaultRegistry,
  Key extends keyof CacheKeyRegistry,
  $Debug = unknown,
  UserExtensionData = unknown,
  Context extends object = object
> implements Cache<CacheKeyRegistry, Key, $Debug, UserExtensionData, Context>
{
  #weakCache: Map<Key, WeakRef<CacheKeyRegistry[Key]>>;
  #entryRevisions: Map<Key, CachedEntityRevision<CacheKeyRegistry, Key>[]>;
  #cacheOptions:
    | CacheOptions<CacheKeyRegistry, Key, $Debug, UserExtensionData, Context>
    | undefined;
  #cacheEntryState: Map<Key, CacheEntryState<UserExtensionData> | undefined>;
  #lruCache: LruCacheImpl<CacheKeyRegistry, Key>;
  #lruPolicy: number;
  #cleanup: FinalizationRegistry<Key>;
  #cacheRevisionTransaction!: CommittingTransaction<
    CacheKeyRegistry,
    Key,
    $Debug,
    UserExtensionData
  >;

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
      | CacheOptions<CacheKeyRegistry, Key, $Debug, UserExtensionData, Context>
      | undefined
  ) {
    this.#weakCache = new Map<Key, WeakRef<CacheKeyRegistry[Key]>>();

    this.#cacheOptions = {
      hooks: {
        commit: options?.hooks?.commit,
        entitymergeStrategy:
          options?.hooks?.entitymergeStrategy || defaultMergeStrategy,
        revisionMergeStrategy:
          options?.hooks?.revisionMergeStrategy || defaultRetensionStrategy,
      },
      expiration: options?.expiration || DEFAULT_EXPIRATION,
    };

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
    | CacheOptions<CacheKeyRegistry, Key, $Debug, UserExtensionData, Context>
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

  async #aquireTxCommitLock(
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

  async #applyRetentionPolicies(
    cacheKey: Key,
    liveTx: LiveCacheTransaction<
      CacheKeyRegistry,
      Key,
      $Debug,
      UserExtensionData
    >
  ): Promise<void> {
    const revisionStrategy =
      this.#cacheOptions?.hooks?.revisionMergeStrategy ||
      defaultRetensionStrategy;

    await revisionStrategy(cacheKey, this.#cacheRevisionTransaction);
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

      // Register FinalizationRegistry so strongly held keys are removed
      this.#cleanup.register(value, key);

      this.#cacheEntryState.set(key, state);

      if (state?.retained.lru) {
        this.#lruCache.set(key, value);
      }
    }

    // Write transaction revisions entries to the main cache
    for (const [
      cacheKey,
      revision,
    ] of this.#cacheRevisionTransaction.mergedEntryRevisions()) {
      this.#entryRevisions.set(cacheKey, revision);
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

  #updateSavedRevisions(
    localRevisionsMap: Map<Key, CachedEntityRevision<CacheKeyRegistry, Key>[]>
  ) {
    this.#cacheRevisionTransaction?.updateRevisions(localRevisionsMap);
  }

  async beginTransaction(
    context?: Context
  ): Promise<
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

    const applyRetentionPolicies = (
      cacheKey: Key,
      liveTx: LiveCacheTransaction<
        CacheKeyRegistry,
        Key,
        $Debug,
        UserExtensionData
      >
    ) => this.#applyRetentionPolicies(cacheKey, liveTx);

    const updateSavedRevisions = (
      localRevisionsMap: Map<Key, CachedEntityRevision<CacheKeyRegistry, Key>[]>
    ) => this.#updateSavedRevisions(localRevisionsMap);

    const cacheEntriesBeforeTransaction = new Map<Key, CacheKeyRegistry[Key]>();
    const cacheRevisionsBeforeTransaction = new Map<
      Key,
      CachedEntityRevision<CacheKeyRegistry, Key>[]
    >();

    for await (const [cacheKey, value] of this.entries()) {
      cacheEntriesBeforeTransaction.set(cacheKey, value);
    }

    for await (const [cacheKey] of this.entries()) {
      const revisions: CachedEntityRevision<CacheKeyRegistry, Key>[] = [];
      for await (const revision of this.entryRevisions(cacheKey)) {
        revisions.push(revision);
      }
      cacheRevisionsBeforeTransaction.set(cacheKey, revisions);
    }

    const transactionOperations = {
      aquireTxCommitLock,
      releaseTxCommitLock,
      applyRetentionPolicies,
      updateSavedRevisions,
      commitUpdatesAndReleaseLock,
    };

    this.#cacheRevisionTransaction = new CommittingTransactionImpl(
      this,
      cacheRevisionsBeforeTransaction
    );

    const liveTx = new LiveCacheTransactionImpl<
      CacheKeyRegistry,
      Key,
      $Debug,
      UserExtensionData,
      Context
    >(
      this,
      cacheEntriesBeforeTransaction,
      cacheRevisionsBeforeTransaction,
      transactionOperations,
      context
    );

    return liveTx;
  }
}

export function buildCache<
  CacheKeyRegistry extends DefaultRegistry = DefaultRegistry,
  Key extends keyof CacheKeyRegistry = keyof CacheKeyRegistry,
  $Debug = unknown,
  UserExtensionData = unknown,
  Context extends object = object
>(
  options?: CacheOptions<
    CacheKeyRegistry,
    Key,
    $Debug,
    UserExtensionData,
    Context
  >
): Cache<CacheKeyRegistry, Key, $Debug, UserExtensionData, Context> {
  return new CacheImpl<
    CacheKeyRegistry,
    Key,
    $Debug,
    UserExtensionData,
    Context
  >(options);
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

const defaultRetensionStrategy = async function retainAllRevisions<
  CacheKeyRegistry extends DefaultRegistry,
  Key extends keyof CacheKeyRegistry,
  $Debug = unknown,
  UserExtensionData = unknown
>(
  id: Key,
  commitingRevisionTx: CommittingTransaction<
    CacheKeyRegistry,
    Key,
    $Debug,
    UserExtensionData
  >
): Promise<void> {
  const revisions: CachedEntityRevision<CacheKeyRegistry, Key>[] = [];

  for await (const revision of commitingRevisionTx.entryRevisions(id)) {
    revisions.push(revision);
  }

  commitingRevisionTx.cache.appendRevisions(id, [...revisions]);
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
  target: Record<string, object | string | number | undefined>,
  source: Record<string, object | string | number | undefined>,
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
