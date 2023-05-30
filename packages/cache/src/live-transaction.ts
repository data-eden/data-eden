import { CacheTransactionImpl } from './cache-transaction.js';
import type {
  Cache,
  LiveCacheTransaction,
  CacheEntryState,
  CacheKeyValue,
  CachedEntityRevision,
  ExpirationPolicy,
  DefaultRegistry,
  EntityMergeStrategy,
  TransactionOperations,
} from './index.js';
import { DEFAULT_ENTRY_STATE } from './cache.js';

const REVISION_COUNTER = 0;

export class LiveCacheTransactionImpl<
    CacheKeyRegistry extends DefaultRegistry,
    Key extends keyof CacheKeyRegistry,
    $Debug = unknown,
    UserExtensionData = unknown
  >
  extends CacheTransactionImpl<CacheKeyRegistry, Key, $Debug, UserExtensionData>
  implements
    LiveCacheTransaction<CacheKeyRegistry, Key, $Debug, UserExtensionData>
{
  #originalCacheReference: Cache<
    CacheKeyRegistry,
    Key,
    $Debug,
    UserExtensionData
  >;
  #transactionalCache: Map<Key, CacheKeyRegistry[Key]>;
  #userOptionRetentionPolicy: ExpirationPolicy;
  #ttlPolicy: number;
  #lruPolicy: number;
  #revisionContext: unknown;

  #transactionOperations: TransactionOperations<
    CacheKeyRegistry,
    Key,
    $Debug,
    UserExtensionData
  >;

  constructor(
    originalCache: Cache<CacheKeyRegistry, Key, $Debug, UserExtensionData>,
    cacheEntriesBeforeTransaction: Map<Key, CacheKeyRegistry[Key]>,
    cacheRevisionsBeforeTransaction: Map<
      Key,
      CachedEntityRevision<CacheKeyRegistry, Key>[]
    >,
    transactionOperations: TransactionOperations<
      CacheKeyRegistry,
      Key,
      $Debug,
      UserExtensionData
    >
  ) {
    super(originalCache);

    this.#originalCacheReference = originalCache;
    this.#transactionOperations = transactionOperations;

    this.#transactionalCache = this.getTransactionalCache();
    // this.#cacheEntryState = this.cacheEntryState;

    this.setCacheEntriesBeforeTransaction(cacheEntriesBeforeTransaction);
    this.setRevisionsBeforeTransactionStart(cacheRevisionsBeforeTransaction);
    const { userOptionExpirationPolicy, lruPolicy, ttlPolicy } =
      this.getExpirationPolicies();
    this.#ttlPolicy = ttlPolicy;
    this.#lruPolicy = lruPolicy;
    this.#userOptionRetentionPolicy = userOptionExpirationPolicy;
  }

  async set(
    cacheKey: Key,
    value: CacheKeyRegistry[Key]
  ): Promise<CacheKeyRegistry[Key]> {
    this.#transactionalCache.set(cacheKey, value);

    this.setCacheEntryState(cacheKey, {
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
      this.setCacheEntryState(cacheKey, {
        retained: { lru: false, ttl: 0 },
        deletedRecordInTransaction: true,
        lastAccessed: Date.now(),
      });
      return true;
    }

    return false;
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
      revisionContext: unknown;
      $debug: $Debug;
    }
  ): Promise<CacheKeyRegistry[Key] | CacheKeyValue> {
    this.#revisionContext = options?.revisionContext;
    const mergeStrategy = this.#getMergeStrategy(options?.entityMergeStrategy);

    // get current cache value within this transaction
    const currentValue = await this.#originalCacheReference.get(cacheKey);
    const localRevisionsByEntry = this.getLocalRevisionsByEntry(cacheKey);

    let revisionNumber =
      localRevisionsByEntry &&
      localRevisionsByEntry[localRevisionsByEntry.length - 1].revision
        ? localRevisionsByEntry[localRevisionsByEntry.length - 1].revision
        : REVISION_COUNTER;

    revisionNumber = ++revisionNumber;

    // get merged entity
    const mergedEntity = currentValue
      ? mergeStrategy(
          cacheKey,
          {
            entity,
            revision: revisionNumber,
            revisionContext: this.#revisionContext,
          },
          currentValue,
          this
        )
      : entity;

    // Update transactional cache with merged entity
    // Calling set here will in turn also update cacheEntryState
    await this.set(cacheKey, mergedEntity as CacheKeyRegistry[Key]);

    // Update local & entry revisions with new revision values
    const revision = {
      entity: mergedEntity as CacheKeyRegistry[Key],
      revision: revisionNumber,
      revisionContext: this.#revisionContext,
    };

    this.setLocalRevisionsByEntry(cacheKey, revision);

    this.#transactionOperations.updateSavedRevisions(this.getLocalRevisions());

    return mergedEntity;
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

  async #prepareTransaction() {
    const trasactionCacheEntries: [
      Key,
      CacheKeyRegistry[Key],
      CacheEntryState<UserExtensionData>
    ][] = [];

    for await (const [cacheKey, value] of this.localEntries()) {
      const latestCacheValue = await this.#originalCacheReference.get(cacheKey);
      let mergedEntityToCommit;
      const mergeStrategy = this.#getMergeStrategy();

      const localRevisionsByEntry = this.getLocalRevisionsByEntry(cacheKey);

      let revisionNumber =
        localRevisionsByEntry &&
        localRevisionsByEntry[localRevisionsByEntry.length - 1].revision
          ? localRevisionsByEntry[localRevisionsByEntry.length - 1].revision
          : REVISION_COUNTER;

      revisionNumber = ++revisionNumber;

      if (latestCacheValue && mergeStrategy) {
        mergedEntityToCommit = mergeStrategy(
          cacheKey,
          {
            entity: value,
            revision: revisionNumber,
            revisionContext: this.#revisionContext,
          },
          latestCacheValue,
          this
        );
      } else {
        mergedEntityToCommit = value;
      }
      const structuredClonedValue = structuredClone(
        mergedEntityToCommit
      ) as CacheKeyRegistry[Key];

      const state = this.getCacheEntryState(cacheKey) || DEFAULT_ENTRY_STATE;

      trasactionCacheEntries.push([cacheKey, structuredClonedValue, state]);

      // Update saved revisions of the entity
      const entityRevision = {
        entity: mergedEntityToCommit as CacheKeyRegistry[Key],
        revision: revisionNumber,
        revisionContext: this.#revisionContext,
      };

      this.setLocalRevisionsByEntry(cacheKey, entityRevision);

      this.#transactionOperations.updateSavedRevisions(
        this.getLocalRevisions()
      );

      // Update revisions based on revision strategy
      await this.#transactionOperations.applyRetentionPolicies(cacheKey, this);
    }

    // Call commit hook to apply custom retention policies before commit (if passed by cache options)
    const commitCallback =
      this.#originalCacheReference.getCacheOptions()?.hooks?.commit;
    if (commitCallback) {
      await commitCallback(this);
    }

    return {
      entries: trasactionCacheEntries,
    };
  }

  // assign transaction or cache level overriden merge strategy else use default
  #getMergeStrategy(
    transactionMergeStrategy?: EntityMergeStrategy<
      CacheKeyRegistry,
      Key,
      $Debug,
      UserExtensionData
    >
  ): EntityMergeStrategy<CacheKeyRegistry, Key, $Debug, UserExtensionData> {
    const cacheWideMergeStrategy =
      this.#originalCacheReference.getCacheOptions()?.hooks
        ?.entitymergeStrategy as EntityMergeStrategy<
        CacheKeyRegistry,
        Key,
        $Debug,
        UserExtensionData
      >;

    return transactionMergeStrategy || cacheWideMergeStrategy;
  }
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
