# @data-eden/athena

TODO: writeme

## Query Metadata

* **Paths of referenced entities** In order to correctly distinguish cache entries like 'urn:author:1' as either strings or references.  More advanced cases to handle:
  - arrays of references
  - graphql unions (mandate/include `__typename`) with fragments that have type conditions
  - arrays of graphql unions
  - ?? non-union cases with fragments with type conditions (e.g. for interfaces)

Consider e.g.

{
  foo {
    bar {
      __typename

      ... on TypeA {
        a b c
      }

      ... on TypeB {
        d e f
      }
    }
  }
}

* **Unconventional ID Field Names** In order to identify whether an object should be a cached entity we need to know what the `ID` field is. We only need to stash extra information for unconventional names (e.g. if the whole API always uses `id` or `urn` then we don't need to copy that data).
* **$!prod.fields** Field masking during non-production environments.
