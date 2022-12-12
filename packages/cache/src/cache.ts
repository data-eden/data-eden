// eslint-disable-next-line
function structuredClone(x: any): any {
  try {
    return JSON.parse(JSON.stringify(x));
  } catch (error) {
    throw new Error('The cache value is not structured clonable use `save` with serializer')
  }
}

const DEFAULT_EXPIRATION = { lru: 10, ttl: 5000 };

const DEFAULT_ENTRY_STATE = { retained: {lru: false, ttl: DEFAULT_EXPIRATION.ttl} };

type DefaultRegistry = Record<string, object>;

export interface CacheDebugAPIs {
  size(): void;
  entries(): void;
  history(): void;
}
export interface CacheTransactionDebugAPIs {
  size(): void;
  entries(): void;
}

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
  lastAccessed?: number; // timestamp
  extensions?: UserExtensionData;
}

type CacheKeyValue = Record<string, object | string | number> | string | number ;

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
export interface RevisionMergeStrategy<
  CacheKeyRegistry extends DefaultRegistry,
  Key extends keyof CacheKeyRegistry,
  $Debug = unknown,
  UserExtensionData = unknown
> {
  (cacheKey: Key, tx: CommittingTransactionImpl<CacheKeyRegistry, Key, $Debug, UserExtensionData>): void;
}

interface CachedEntityRevision<CacheKeyValue> {
  entity: CacheKeyValue;
  revision: number;
  revisionContext?: string; // Use to store queryIds that can be used for debugging
}

type ExpirationPolicy = false | {
  lru: number;
  ttl: number;
}
export interface CacheOptions<CacheKeyRegistry extends DefaultRegistry, Key extends keyof CacheKeyRegistry, $Debug = unknown, UserExtensionData = unknown> {
  hooks: {
    /**
    An optional callback that is invoked just before a transaction is committed.

    This does not allow users to mutate the transaction, but it is a hook where
    custom retention policies can be implemented.

    The default retention policies are all implementable in userland as commit hooks.
    */
    commit?: (tx: CacheTransaction<CacheKeyRegistry, Key, $Debug, UserExtensionData>) => void;

    /**
    An optional hook for merging new versions of an entity into the cache. This
    hook specifies the default behaviour for the cache -- a different merge
    strategy can be passed in per call to `LiveCacheTransaction.merge`

    The hook returns the updated merged entry -- it may not mutate any of its arguments.

    If unspecified, the default merge strategy is to deeply merge objects.
    */
    entitymergeStrategy?: EntityMergeStrategy<CacheKeyRegistry, Key, $Debug, UserExtensionData>;
    /**
    An optional hook for merging the list of revisions for a cache entry.

    If unspecified, the default retention strategy is to keep the full history
    of an entry as long as it's in the cache, evicting revisions only when the
    value itself is evicted.
    */
    revisionMergeStrategy?: RevisionMergeStrategy<CacheKeyRegistry, Key, $Debug, UserExtensionData>;
  }
  expiration?: ExpirationPolicy;
  $debug?: $Debug;
}

export interface Cache<
  CacheKeyRegistry extends DefaultRegistry,
  Key extends keyof CacheKeyRegistry,
  $Debug = unknown,
  UserExtensionData = unknown
  > {
  
  /**
    Evict all entries from the cache.
  */
  clear(): Promise<void>;

  getCacheOptions(): CacheOptions<CacheKeyRegistry, Key, $Debug, UserExtensionData> | undefined;

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

  loadEntryRevisions(revisionMap: Map<Key, CachedEntityRevision<CacheKeyValue>[]>): Promise<void>;

  [Symbol.asyncIterator](): AsyncIterableIterator<[Key, CacheKeyRegistry[Key], CacheEntryState<UserExtensionData>?]>

  entries(): AsyncIterableIterator<[Key, CacheKeyRegistry[Key], CacheEntryState<UserExtensionData>]>;

  entryRevisions(cacheKey: Key):  AsyncIterableIterator<CachedEntityRevision<CacheKeyValue>>;

  keys(): AsyncIterableIterator<Key>;

  values(): AsyncIterableIterator<CacheKeyRegistry[Key]>;

  beginTransaction(): Promise<LiveCacheTransaction<CacheKeyRegistry, Key, $Debug, UserExtensionData>>;
}


export interface CacheTransaction<
  CacheKeyRegistry extends DefaultRegistry,
  Key extends keyof CacheKeyRegistry,
  $Debug = unknown,
  UserExtensionData = unknown
  > {
  
  get(cacheKey: Key): CacheKeyRegistry[Key] | CacheKeyValue | undefined;

  [Symbol.asyncIterator](entryMap: Map<Key, CacheKeyRegistry[Key] | CacheKeyValue| CachedEntityRevision<CacheKeyValue>[]>, cacheKey?: Key): AsyncIterableIterator<[Key, CacheKeyRegistry[Key] | CacheKeyValue, CacheEntryState<UserExtensionData>?] | CachedEntityRevision<CacheKeyValue>>;

  entries(): AsyncIterableIterator<[Key, CacheKeyRegistry[Key] | CacheKeyValue, CacheEntryState<UserExtensionData>]>;

  localEntries(): AsyncIterableIterator<[Key, CacheKeyRegistry[Key] | CacheKeyValue, CacheEntryState<UserExtensionData>]>;

  $debug?: $Debug & CacheTransactionDebugAPIs;
}
export interface LiveCacheTransaction<
  CacheKeyRegistry extends DefaultRegistry,
  Key extends keyof CacheKeyRegistry,
  $Debug = unknown,
  UserExtensionData = unknown
> extends CacheTransaction<CacheKeyRegistry, Key, $Debug, UserExtensionData> {

  merge(cacheKey: Key, value: CachedEntityRevision<CacheKeyValue>,
    options?: {
      $debug: $Debug;
    }
  ): Promise<CacheKeyRegistry[Key] | CacheKeyValue>;

  set(cacheKey: Key, value: CacheKeyRegistry[Key] | CacheKeyValue): CacheKeyRegistry[Key] | CacheKeyValue;

  delete(cacheKey: Key): Promise<boolean>;

  commit(): Promise<void>;

  rollback(previousCacheState: Map<Key, CacheKeyRegistry[Key]>): Promise<void>;
}

export interface CommittingTransaction<
  CacheKeyRegistry extends DefaultRegistry,
  Key extends keyof CacheKeyRegistry = keyof CacheKeyRegistry,
  $Debug = unknown,
  UserExtensionData = unknown
> extends Omit<CacheTransaction<CacheKeyRegistry, Key, $Debug, UserExtensionData>, 'get'| 'entries'| 'localEntries'> {
  cache: {
    clearRevisions(tx: CommittingTransactionImpl<CacheKeyRegistry, Key, $Debug, UserExtensionData>, id: Key): void;
    appendRevisions(tx: CommittingTransactionImpl<CacheKeyRegistry, Key, $Debug, UserExtensionData>, id: Key, revisions: CachedEntityRevision<CacheKeyValue>[]): void;
  }

  bootstrapEntityRevisons(id: Key): Promise<void>;

  addTransactionRevision(id: Key, revisions: CachedEntityRevision<CacheKeyValue>): void;

  /**
  An async generator that produces the revisions of `key` within this transaction.
  */
  localRevisions(cacheKey: Key): AsyncIterableIterator<CachedEntityRevision<CacheKeyValue>>;

  /**
  An async generator that produces the complete list of revisions for `key`,
  from the time the transaction began and including the revisions added in this
  transaction.
  */
  entryRevisions(cacheKey: Key): AsyncIterableIterator<CachedEntityRevision<CacheKeyValue>>;

 /**
  An async generator that produces the saved list of revisions for `key`,
  based on the retention starategy applied
  */
  savedRevisions(cacheKey: Key): AsyncIterableIterator<CachedEntityRevision<CacheKeyValue>>;
}

class CommittingTransactionImpl<
  CacheKeyRegistry extends DefaultRegistry,
  Key extends keyof CacheKeyRegistry = keyof CacheKeyRegistry,
  $Debug = unknown,
  UserExtensionData = unknown
> implements 
    CommittingTransaction<CacheKeyRegistry, Key, $Debug, UserExtensionData>  
{
  #localRevisions: Map<Key, CachedEntityRevision<CacheKeyValue>[]>;
  #entryRevisions: Map<Key, CachedEntityRevision<CacheKeyValue>[]>; 
  #originalCache: CacheImpl<CacheKeyRegistry, Key, $Debug, UserExtensionData>;
  #savedRevisions: Map<Key, CachedEntityRevision<CacheKeyValue>[]>;
  
  cache: { 
    clearRevisions(tx: CommittingTransactionImpl<CacheKeyRegistry, Key, $Debug, UserExtensionData>, id: Key): void, 
    appendRevisions(tx: CommittingTransactionImpl<CacheKeyRegistry, Key, $Debug, UserExtensionData>, id: Key, revisions: CachedEntityRevision<CacheKeyValue>[]): void 
  } = {
    clearRevisions(tx: CommittingTransactionImpl<CacheKeyRegistry, Key, $Debug, UserExtensionData>, id: Key): void {
      tx.#savedRevisions.delete(id);
    },

    appendRevisions(tx: CommittingTransactionImpl<CacheKeyRegistry, Key, $Debug, UserExtensionData>, id: Key, revisions: CachedEntityRevision<CacheKeyValue>[]): void {
      tx.#savedRevisions.get(id)?.concat(revisions);
    }
  };

  constructor(originalCache: CacheImpl<CacheKeyRegistry, Key, $Debug, UserExtensionData>) {
    this.#localRevisions = new Map<Key, CachedEntityRevision<CacheKeyValue>[]>;
    this.#entryRevisions = new Map<Key, CachedEntityRevision<CacheKeyValue>[]>;
    this.#savedRevisions = new Map<Key, CachedEntityRevision<CacheKeyValue>[]>; 

    this.#originalCache = originalCache;
  }

  async bootstrapEntityRevisons(id: Key): Promise<void> {
    for await (const revision of this.#originalCache.entryRevisions(id)){
      if (this.#entryRevisions.has(id)) {
        this.#entryRevisions.get(id)?.push(revision)
      } else {
        this.#entryRevisions.set(id, [revision])
      }
    }
  }

  addTransactionRevision(id: Key, revision: CachedEntityRevision<CacheKeyValue>): void {
    if (this.#localRevisions.has(id)) {
      this.#localRevisions.get(id)?.push(revision)
    } else {
      this.#localRevisions.set(id, [revision])
    }

    if (this.#entryRevisions.has(id)) {
      this.#entryRevisions.get(id)?.push(revision)
    } else {
      this.#entryRevisions.set(id, [revision])
    }
  }

  commitTransactionRevisions(): Promise<void> {
    return this.#originalCache.loadEntryRevisions(this.#savedRevisions)
  }

//  [Symbol.asyncIterator](entryMap: Map<Key, CacheKeyRegistry[Key] | CacheKeyValue>, cacheKey?: Key): AsyncIterableIterator<[Key, CacheKeyRegistry[Key] | CacheKeyValue, CacheEntryState<UserExtensionData> | undefined] | CachedEntityRevision<CacheKeyValue>>;

  async *[Symbol.asyncIterator](entryMap: Map<Key, CacheKeyRegistry[Key] | CachedEntityRevision<CacheKeyValue>[]>, cacheKey: Key): AsyncIterableIterator<CachedEntityRevision<CacheKeyValue>> {
    if (entryMap.has(cacheKey)) {
      const revisions = entryMap.get(cacheKey) as CachedEntityRevision<CacheKeyValue>[];
      for await (const revision of revisions) {
        yield revision;
      } 
    }
  }

  localRevisions(cacheKey: Key): AsyncIterableIterator<CachedEntityRevision<CacheKeyValue>> {
    return this[Symbol.asyncIterator](this.#localRevisions, cacheKey,);
  }

  entryRevisions(cacheKey: Key): AsyncIterableIterator<CachedEntityRevision<CacheKeyValue>> {
    return this[Symbol.asyncIterator](this.#entryRevisions, cacheKey);
  }

  savedRevisions(cacheKey: Key): AsyncIterableIterator<CachedEntityRevision<CacheKeyValue>> {
    return this[Symbol.asyncIterator](this.#savedRevisions, cacheKey);
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
  #originalCacheReference: CacheImpl<CacheKeyRegistry, Key, $Debug, UserExtensionData>;
  #transactionalCache: Map<Key, CacheKeyRegistry[Key]>;
  #localUpdatedEntries: Map<Key, CacheKeyRegistry[Key]>;
  #commitingTransaction: CommittingTransactionImpl<CacheKeyRegistry, Key, $Debug, UserExtensionData>;
  #cacheEntryState: Map<Key, CacheEntryState<UserExtensionData>>;
  #userOptionRetentionPolicy: ExpirationPolicy;
  #ttlOption: number;
  #lruOption: number;

  constructor(
    originalCache: CacheImpl<CacheKeyRegistry, Key, $Debug, UserExtensionData>,
    transactionalCacheEntryMap: Map<Key, CacheKeyRegistry[Key]>,
    committingTransaction: CommittingTransactionImpl<CacheKeyRegistry, Key, $Debug, UserExtensionData>
  ) {    
    this.#originalCacheReference = originalCache;
    this.#transactionalCache = transactionalCacheEntryMap;
    this.#localUpdatedEntries = new Map<Key, CacheKeyRegistry[Key]>();
    this.#commitingTransaction = committingTransaction;
    this.#cacheEntryState = new Map<Key, CacheEntryState<UserExtensionData>>;
    this.#ttlOption = DEFAULT_EXPIRATION.ttl;
    this.#lruOption = DEFAULT_EXPIRATION.lru;
    
    this.#userOptionRetentionPolicy = this.#originalCacheReference.getCacheOptions()?.expiration || DEFAULT_EXPIRATION;

    if (this.#userOptionRetentionPolicy && this.#userOptionRetentionPolicy?.lru && typeof this.#userOptionRetentionPolicy.lru === 'number') {
      this.#lruOption = this.#userOptionRetentionPolicy.lru
    }

    if (this.#userOptionRetentionPolicy && this.#userOptionRetentionPolicy?.ttl && typeof this.#userOptionRetentionPolicy.ttl === 'number') {
      this.#ttlOption = this.#userOptionRetentionPolicy.ttl
    }

  }

  static async beginLiveTransaction<
    CacheKeyRegistry extends DefaultRegistry, 
    Key extends keyof CacheKeyRegistry,
    $Debug = unknown,
    UserExtensionData = unknown>(originalCache: CacheImpl<CacheKeyRegistry, Key, $Debug, UserExtensionData>) {
    
    const committingTransaction = new CommittingTransactionImpl<CacheKeyRegistry, Key, $Debug, UserExtensionData>(originalCache);
    const transactionalCache = new Map<Key, CacheKeyRegistry[Key]>();
    for await (const [key, value] of originalCache.entries()) {
      transactionalCache.set(key, {...value});
      await committingTransaction.bootstrapEntityRevisons(key);
    }

    return new LiveCacheTransactionImpl<CacheKeyRegistry, Key, $Debug, UserExtensionData>(originalCache, transactionalCache, committingTransaction);
  }

  get(cacheKey: Key): CacheKeyRegistry[Key] | undefined {
    const cacheValue = this.#transactionalCache.get(cacheKey);

    // Update cache entry state
    if (cacheValue) {
      this.#cacheEntryState.set(cacheKey, { retained: { lru: true, ttl: this.#ttlOption }, lastAccessed: Date.now() })
    }

    return cacheValue;
  }

  async *[Symbol.asyncIterator](entryMap: Map<Key, CacheKeyRegistry[Key]>): AsyncIterableIterator<[Key, CacheKeyRegistry[Key], CacheEntryState<UserExtensionData>]> {
    for (const [key, value] of entryMap) {
      const state = this.#cacheEntryState.get(key) || DEFAULT_ENTRY_STATE;
      yield [key, value, state];
    }
  }

  entries(): AsyncIterableIterator<[Key, CacheKeyRegistry[Key], CacheEntryState<UserExtensionData>]> {
    return this[Symbol.asyncIterator](this.#transactionalCache);
  }

  localEntries(): AsyncIterableIterator<[Key, CacheKeyRegistry[Key], CacheEntryState<UserExtensionData>]> {
    return this[Symbol.asyncIterator](this.#localUpdatedEntries);
  }

  set(cacheKey: Key, value: CacheKeyRegistry[Key]): CacheKeyRegistry[Key] {
    this.#transactionalCache.set(cacheKey, value);
    this.#localUpdatedEntries.set(cacheKey, value);

    // Update cache entry state
    this.#cacheEntryState.set(cacheKey, { retained: { lru: true, ttl: this.#ttlOption }, lastAccessed: Date.now() })

    return value;
  }

  async delete(cacheKey: Key): Promise<boolean> {
    return new Promise((resolve) => {

      if (this.#transactionalCache.has(cacheKey)) {
        this.#transactionalCache.delete(cacheKey);
      }

      if (this.#localUpdatedEntries.has(cacheKey)) {
        this.#localUpdatedEntries.delete(cacheKey);
      }
      
      return resolve(this.#transactionalCache.has(cacheKey) === false && (this.#localUpdatedEntries.has(cacheKey) === false))
    });
  }
  
  async merge(cacheKey: Key, entityRevision: CachedEntityRevision<CacheKeyValue>,
    options?: {
      $debug: $Debug;
    }
  ): Promise<CacheKeyRegistry[Key] | CacheKeyValue> {

    // assign custom merge strategy if specified else use default
    const mergeStrategyFromCacheOptionHook = this.#originalCacheReference.getCacheOptions()?.hooks.entitymergeStrategy;
    const mergeStrategy = mergeStrategyFromCacheOptionHook || defaultMergeStrategy;

    // assign custom revision strategy if specified else use default
    const revisionStrategyFromCacheOptionHook = this.#originalCacheReference.getCacheOptions()?.hooks.revisionMergeStrategy;
    const revisionStrategy = async (id: Key, tx: CommittingTransactionImpl<CacheKeyRegistry, Key, $Debug, UserExtensionData>) => revisionStrategyFromCacheOptionHook || defaultRevisionStrategy;

    // get current cache value within this transaction
    const currentValue = this.#transactionalCache.get(cacheKey);

    const mergedEntity = mergeStrategy(cacheKey, { entity: entityRevision.entity, revision: entityRevision.revision, revisionContext: entityRevision?.revisionContext }, currentValue, this);  
    
    // TODO throw error if Merge entity is undefined

    // Update transactional cache with merged entity
    this.set(cacheKey, mergedEntity as CacheKeyRegistry[Key]);

    // Update local & entry revisions with new revision vales
    this.#commitingTransaction.addTransactionRevision(cacheKey, {entity: mergedEntity, revision: entityRevision.revision, revisionContext: entityRevision?.revisionContext});

    // call revisionStrategy to append revisions to transaction entityRevisions
    await revisionStrategy(cacheKey, this.#commitingTransaction);

    // Update cache entry state
    this.#cacheEntryState.set(cacheKey, { retained: { lru: true, ttl: this.#ttlOption }, lastAccessed: Date.now() })

    return mergedEntity;
  }

  async commit(options?: {
    timeout: number | false
  }): Promise<void> {    
    
    const cacheSnapshotBeforeCommit = new Map<Key, CacheKeyRegistry[Key]>();

    for await (const [cacheKey] of this.localEntries()) {
      const originalCacheValue = await this.#originalCacheReference.get(cacheKey)
      if (originalCacheValue) {
        cacheSnapshotBeforeCommit.set(cacheKey, {...originalCacheValue });
      }
    }

    const timeout: number = options?.timeout ? options.timeout : 10000;
    const commitLock = new Promise((resolve, reject) => setTimeout(reject, timeout));
    const writeToCache = async () => {
      const trasactionCacheEntries: [Key, CacheKeyRegistry[Key], CacheEntryState<UserExtensionData> | undefined][] = [];

      for await (const [cacheKey, value, state] of this.localEntries()) {
        const latestCacheValue = await this.#originalCacheReference.get(cacheKey)
        let entityToCommit;

        const revisionEntry = (await this.#commitingTransaction.localRevisions(cacheKey).next()).value as CachedEntityRevision<CacheKeyValue>;
        const revision = revisionEntry.revision;

        // assign custom merge strategy if specified else use default
        const mergeStrategyFromCacheOptionHook = this.#originalCacheReference.getCacheOptions()?.hooks.entitymergeStrategy;
        const mergeStrategy = mergeStrategyFromCacheOptionHook || defaultMergeStrategy;
        
        if (latestCacheValue) {   
          entityToCommit = mergeStrategy(cacheKey, { entity: value as CacheKeyValue, revision }, latestCacheValue, this);
        } else {
          entityToCommit = value;
        }

        const structuredClonedValue = structuredClone(entityToCommit) as CacheKeyRegistry[Key];
  
        trasactionCacheEntries.push([cacheKey, structuredClonedValue, state])

        // Update saved revisions of the entity
        this.#commitingTransaction.addTransactionRevision(cacheKey, {entity: entityToCommit as CacheKeyValue, revision: revision});

        const revisionStrategy = async (id: Key, tx: CommittingTransactionImpl<CacheKeyRegistry, Key, $Debug, UserExtensionData>) => this.#originalCacheReference.getCacheOptions()?.hooks.revisionMergeStrategy || defaultRevisionStrategy; 

        // Update revisions based on revision strategy
        await revisionStrategy(cacheKey, this.#commitingTransaction);
      }

      // Apply custom retention policies before commit (if passed by cache options)
      const customRetentionPolicy = this.#originalCacheReference.getCacheOptions()?.hooks.commit;
      if (customRetentionPolicy) {
        customRetentionPolicy(this);
      }

      // commit transaction entries to main cache
      await this.#originalCacheReference.load(trasactionCacheEntries);

      // commit all revisions to main cache
      await this.#commitingTransaction.commitTransactionRevisions();
    };

    try {
      await Promise.race([writeToCache(), commitLock]);
    } catch {
      // TODO throw error
      await this.rollback(cacheSnapshotBeforeCommit);
    }
  }

  async rollback(previousCacheState: Map<Key, CacheKeyRegistry[Key]>): Promise<void> {

    const arrayOfCacheEntryTuples: [Key, CacheKeyRegistry[Key], CacheEntryState<UserExtensionData>?][] = [];

    for (const [cacheKey] of previousCacheState) { 
      const prevCacheValue = previousCacheState.get(cacheKey)  

      const structuredClonedValue = structuredClone(prevCacheValue) as CacheKeyRegistry[Key];
      arrayOfCacheEntryTuples.push([cacheKey, structuredClonedValue]);
    }
    await this.#originalCacheReference.load(arrayOfCacheEntryTuples); 
  }
}
 

class CacheImpl<
  CacheKeyRegistry extends DefaultRegistry,
  Key extends keyof CacheKeyRegistry,
  $Debug = unknown,
  UserExtensionData = unknown
  > implements Cache<CacheKeyRegistry, Key, $Debug, UserExtensionData>
{
  #weakCache = new Map<Key, WeakRef<CacheKeyRegistry[Key]>>();
  #entryRevisions = new Map<Key, CachedEntityRevision<CacheKeyValue>[]>;
  #cacheOptions: CacheOptions<CacheKeyRegistry, Key, $Debug, UserExtensionData> | undefined;
  #cacheEntryState = new Map<Key, CacheEntryState<UserExtensionData> | undefined>;
  #ttl = new Map<Key, CacheKeyRegistry[Key]>();
  #lru = new Map<Key, CacheKeyRegistry[Key]>();
  #custom = new Map<Key, CacheKeyRegistry[Key]>();

  constructor(options: CacheOptions<CacheKeyRegistry, Key, $Debug, UserExtensionData> | undefined) {
    this.#cacheOptions = options;
  }

  /**
    Evict all entries from the cache.
  */
  async clear(): Promise<void> {
    for await (const [key,] of this.entries()) {
      this.#weakCache.delete(key)
    }
  }

  getCacheOptions(): CacheOptions<CacheKeyRegistry, Key, $Debug, UserExtensionData> | undefined{
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
  async save(): Promise<[Key, CacheKeyRegistry[Key], CacheEntryState<UserExtensionData> | undefined][]> {
    const arrayOfCacheEntryTuples: [Key, CacheKeyRegistry[Key], CacheEntryState<UserExtensionData> | undefined][] = [];
    for await (const [key, value, state] of this.entries()) {
      // create state
      const structuredClonedValue = structuredClone(value) as CacheKeyRegistry[Key];
      arrayOfCacheEntryTuples.push([key, structuredClonedValue, state])
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
    for await (let entry of entries) {
      let [key, value, state] = entry;

      // TODO: finalizregistry
      let clone = structuredClone(value) as CacheKeyRegistry[Key];
      this.#weakCache.set(key, new WeakRef(clone));

      if (this.#cacheOptions?.expiration && this.#cacheOptions.expiration.lru) {
        updateLruCache(this.#lru, key, value, state || DEFAULT_ENTRY_STATE)
      }
  
      if (this.#cacheOptions?.expiration && this.#cacheOptions.expiration.ttl) {
        updateTtlCache(this.#ttl, key, value, state || DEFAULT_ENTRY_STATE)
      }

      this.#cacheEntryState.set(key, state)
    }
  }

  async loadEntryRevisions(revisions: Map<Key, CachedEntityRevision<CacheKeyValue>[]>): Promise<void> { 
    for await (const [cacheKey, revision] of revisions) {
      if (this.#entryRevisions.has(cacheKey)) {
        this.#entryRevisions.get(cacheKey)?.concat(revision)
      } else {
        this.#entryRevisions.set(cacheKey, revision)
      }
    }
  }  

  /**
    Generator function for async iterable that yields iterable cache entries. This
    will include both strongly held (unexpired entries) as well as weakly held
    entries.
  */
  async *[Symbol.asyncIterator](): AsyncIterableIterator<[Key, CacheKeyRegistry[Key], CacheEntryState<UserExtensionData>]> {

    // yield weekly held values
    for await (const [key] of this.#weakCache) {
      const valueRef = this.#weakCache.get(key)?.deref();

      // Because of the limited guarantees of `FinalizationRegistry`, when yielding
      // weakly-held values to the user in `entries` we have to check that the
      // value is actually present,
      if(!valueRef) {
        throw new Error('ref is undefined');
      }

      const state = this.#cacheEntryState.get(key) || DEFAULT_ENTRY_STATE;

      yield [key, valueRef, state];
    }

    // yield strongly held values
    for await (const [key] of this.#ttl) {
      const value = this.#ttl.get(key) as CacheKeyRegistry[Key];

      const state = this.#cacheEntryState.get(key) || DEFAULT_ENTRY_STATE;

      yield [key, value, state];
    }

    for await (const [key] of this.#lru) {
      const value = this.#lru.get(key) as CacheKeyRegistry[Key];
      const state = this.#cacheEntryState.get(key) || DEFAULT_ENTRY_STATE;
      yield [key, value, state];
    }
  }

  /**
    Generator function that yields each of the iterable cache entries. Note that this
    will include both strongly held (unexpired entries) as well as weakly held
    entries.
  */
  entries(): AsyncIterableIterator<[Key, CacheKeyRegistry[Key], CacheEntryState<UserExtensionData>]> {
    return this[Symbol.asyncIterator]();
  }

  entryRevisions(cacheKey: Key): AsyncIterableIterator<CachedEntityRevision<CacheKeyValue>> {
    const entryRevisionIterator = { 
      async *[Symbol.asyncIterator](revisions: CachedEntityRevision<CacheKeyValue>[]): AsyncIterableIterator<CachedEntityRevision<CacheKeyValue>> {
        for (const revision of revisions) {
          yield revision;
        }
      }
    }

    const revisions = this.#entryRevisions.get(cacheKey) || [];
    return entryRevisionIterator[Symbol.asyncIterator](revisions)
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

  async beginTransaction(): Promise<LiveCacheTransaction<CacheKeyRegistry, Key, $Debug, UserExtensionData>> {
    return await LiveCacheTransactionImpl.beginLiveTransaction(this);
  }
}

export function buildCache<
  CacheKeyRegistry extends DefaultRegistry = DefaultRegistry,
  Key extends keyof CacheKeyRegistry = keyof CacheKeyRegistry,
  $Debug = unknown,
  UserExtensionData = unknown
>(options?: CacheOptions<CacheKeyRegistry, Key, $Debug, UserExtensionData>): Cache<CacheKeyRegistry, Key, $Debug, UserExtensionData> {
  return new CacheImpl<CacheKeyRegistry, Key, $Debug, UserExtensionData>(options);
}

const defaultMergeStrategy = function deepMergeStratey<
  CacheKeyRegistry extends DefaultRegistry, 
  Key extends keyof CacheKeyRegistry,
>(id: Key, { entity, revision }: CachedEntityRevision<CacheKeyValue>, current: CacheKeyRegistry[Key] | undefined, tx: CacheTransaction<CacheKeyRegistry, Key>): CacheKeyValue { 
  return deepMerge(current as CacheKeyValue, entity);
}

const defaultRevisionStrategy = async function retainAllRevisions<
  CacheKeyRegistry extends DefaultRegistry, 
  Key extends keyof CacheKeyRegistry,
  $Debug = unknown,
  UserExtensionData = unknown
>(id: Key, tx: CommittingTransactionImpl<CacheKeyRegistry, Key, $Debug, UserExtensionData>): Promise<void> {
  const revisions: CachedEntityRevision<CacheKeyValue>[] = [];

  for await (const revision of tx.localRevisions(id)) {
    revisions.push(revision);
  }

  tx.cache.appendRevisions(tx, id, [...revisions]); 
}

// eslint-disable-next-line
const isObject = function isObject(obj: any): obj is Record<string, any> {
  return obj !== null && !Array.isArray(obj) && typeof obj === 'object';
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

function updateLruCache<  
  CacheKeyRegistry extends DefaultRegistry, 
  Key extends keyof CacheKeyRegistry,
  UserExtensionData = unknown
>(lruCache: Map<Key, CacheKeyRegistry[Key]>, cacheKey: Key, value: CacheKeyRegistry[Key], state: CacheEntryState<UserExtensionData>): Map<Key, CacheKeyRegistry[Key]> {

  // TODO implement LRU 
  return lruCache;
}

function updateTtlCache<  
  CacheKeyRegistry extends DefaultRegistry, 
  Key extends keyof CacheKeyRegistry,
  UserExtensionData = unknown
>(ttlCache: Map<Key, CacheKeyRegistry[Key]>, cacheKey: Key, value: CacheKeyRegistry[Key], state: CacheEntryState<UserExtensionData>): Map<Key, CacheKeyRegistry[Key]> {

    // TODO implement TTL 
  return ttlCache;
}