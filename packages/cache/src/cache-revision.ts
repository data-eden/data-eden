import { CacheTransactionImpl } from './cache-transaction.js';
import type {
  Cache,
  CommittingTransaction,
  CachedEntityRevision,
  DefaultRegistry,
  CacheTransactionDebugAPIs,
} from './index.js';

export class CommittingTransactionImpl<
    CacheKeyRegistry extends DefaultRegistry,
    Key extends keyof CacheKeyRegistry = keyof CacheKeyRegistry,
    $Debug = unknown,
    UserExtensionData = unknown
  >
  extends CacheTransactionImpl<CacheKeyRegistry, Key, $Debug, UserExtensionData>
  implements
    CommittingTransaction<CacheKeyRegistry, Key, $Debug, UserExtensionData>
{
  #txRetainedEntryRevisions: Map<
    Key,
    CachedEntityRevision<CacheKeyRegistry, Key>[]
  >;
  $debug?: ($Debug & CacheTransactionDebugAPIs) | undefined;
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
  > {
    return this.#txRetainedEntryRevisions;
  }
  updateRevisions(
    localRevisionsMap: Map<Key, CachedEntityRevision<CacheKeyRegistry, Key>[]>
  ): void {
    this.setLocalRevisions(localRevisionsMap);
  }

  constructor(
    originalCache: Cache<CacheKeyRegistry, Key, $Debug, UserExtensionData>,
    cacheRevisionsBeforeTransaction: Map<
      Key,
      CachedEntityRevision<CacheKeyRegistry, Key>[]
    >
  ) {
    super(originalCache);

    this.setRevisionsBeforeTransactionStart(cacheRevisionsBeforeTransaction);

    const appendRevisions = (
      cacheKey: Key,
      revisions: CachedEntityRevision<CacheKeyRegistry, Key>[]
    ) => this.#appendRevisions(cacheKey, revisions);

    const clearRevisions = (cacheKey: Key) => this.#clearRevisions(cacheKey);

    this.cache = {
      clearRevisions,
      appendRevisions,
    };
    this.#txRetainedEntryRevisions = new Map<
      Key,
      CachedEntityRevision<CacheKeyRegistry, Key>[]
    >();
  }

  #appendRevisions(
    cacheKey: Key,
    revisions: CachedEntityRevision<CacheKeyRegistry, Key>[]
  ) {
    if (this.#txRetainedEntryRevisions.has(cacheKey)) {
      const appendedRevisions =
        this.#txRetainedEntryRevisions.get(cacheKey)?.concat(revisions) || [];
      this.#txRetainedEntryRevisions.set(cacheKey, appendedRevisions);
    } else {
      this.#txRetainedEntryRevisions.set(cacheKey, revisions);
    }
  }

  #clearRevisions(cacheKey: Key) {
    if (this.#txRetainedEntryRevisions.has(cacheKey)) {
      this.#txRetainedEntryRevisions.delete(cacheKey);
    }
  }
}
