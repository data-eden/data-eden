# @data-eden/athena

This library has several key components:

**GraphQL Client** The main interface of Athena is a GraphQL client that closely follows the API of urql. This client uses a custom fetch function from @data-eden/network and includes a caching layer built on top of @data-eden/cache.

**Reactivity Layer** Athena also includes a reactivity layer that keeps all GraphQL entities synchronized with the cache. This layer is built around the concept of Signals, which is explained in more detail in the README for [@signalis/core](https://github.com/cafreeman/signalis/blob/main/packages/core/README.md).

The reactivity layer operates on two main principles:

- All entities are wrapped in proxies that provide reactivity while hiding the actual signal from the consumer. This allows GraphQL response data to be interacted with as if it were a regular object.

- All GraphQL responses are broken into entities, normalized, and cached so that all relationships between entities are encoded via the normalized store and kept in sync via the reactive proxy. The cache processes all GraphQL responses, ensuring that the underlying entities and their relationships are kept in sync while maintaining referential stability.

## Query Metadata

- **Paths of referenced entities** In order to correctly distinguish cache entries like 'urn:author:1' as either strings or references. More advanced cases to handle:
  - arrays of references
  - graphql unions (mandate/include `__typename`) with fragments that have type conditions
  - arrays of graphql unions
  - ?? non-union cases with fragments with type conditions (e.g. for interfaces)

Consider e.g.

```graphql
{
  foo {
    bar {
      __typename

      ... on TypeA {
        a
        b
        c
      }

      ... on TypeB {
        d
        e
        f
      }
    }
  }
}
```

- **Unconventional ID Field Names** In order to identify whether an object should be a cached entity we need to know what the `ID` field is. We only need to stash extra information for unconventional names (e.g. if the whole API always uses `id` or `urn` then we don't need to copy that data).
- **$!prod.fields** Field masking during non-production environments.
