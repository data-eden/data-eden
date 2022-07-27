# TODO: title

## Assumptions

- The `CacheRegistry` will be generated by the "Codegen" system where the full
  set of query keys are known ahead of time. In Athena's case that will mean
  that inidivual query ids like `query-id-123` will map to **exactly** the return type of that query.
  Similarly, `cache.get(someEntityId)` will map to **exactly** the correct type of the "merged model". For an example of generating these type registries, see <https://tsplay.dev/NrnDlN>. This gives strong types for entries whose types are statically known. There is no support for strongly typing dynamic entries -- they will be typed as `unknown` and users will have to typecast or equivalent.

## Features

// TODO: rewrite after writing `save` api

- The cache is serializable. This means e.g. it can be written to and restored from persistent storage. It also means that values must be serializable one way or another.

## Implementation Notes

- 🔥🐉 When cache entries (key,value pairs) are added to the cache (i.e. via `tx.commit()`) particular care is needed.
  1. The main cache is a `Map<String, WeakRef<ValueType>>`.
  2. There are additional caches that are `Map<string,ValueType>` to handle the
     Least-Recently-Used (LRU) and Time-to-Live (TTL) expiration features.
  3. This means that keys are always strongly held (more on this in a minute) and
     values are strongly held until they expire, after which they are weakly
     held by the cache, but may be strongly held by the user (so e.g. a
     component that has a reference to a value will mean that the cache can
     still return that value via `get`). A `FinalizationRegistry` is created to
     remove the strongly held keys after the value is garbage-collected.
  4. Because of the limited guarantees of `FinalizationRegistry`, when yielding
     weakly-held values to the user in `entries` we have to check that the
     value is actually present, as there will be a period of time when the
     value has been garbage collected, but our finalizer has not been called.
     The finalizer does not save us from this, but it does save us from leaking
     memory in the long run by strongly retaining keys.
  5. See the README of <https://github.com/tc39/proposal-weakrefs> for a
     detailed run through of how to make an "iterable weakmap" (which is
     effectively what we are describing).
- `buildCache()` returns an implementation of `Cache`, internally by creating a
  class instance, but that class itself is not publically exported.
- `$debug` refers to debug only information & utilities that are not eagerly
  loaded. They are available to be lazily loaded in production (via `await import`). This is how we get **zero-cost debugging** that has no member
  impact but still provides powerful debugging, even in production.
- All the userland hooks are async so that if and when we add extension points
  (likely to `CacheOptions.hooks`) we do not foreclose use cases that require
  async (e.g. a `get` hook that falls back to reading from `IndexedDB` or make
  a network call)

## Use Cases

There are some particular use cases to make sure are ergonomic & have good examples.

- optimistic writes (consider how to do `@tracking` invalidation on new requests &c.)
- side-loading cache entries (e.g. via server push, websockets)

## Open Questions

- Should we deeply freeze all cache values & revisions in non-production modes?