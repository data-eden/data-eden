/**
  These tokens are produced by the build system. An operation token represents a single operation (query, mutation or subscription).

  Documents with multiple operations will be compiled into modules with multiple operation exports.

  @example

  ```graphql
  # queries.graphql

  query searchBooks($search: String!) {
    searchBooks(query: $search) {
      isbn
      title
    }
  }

  query loadAuthor($name: String!) {
    loadAuthor(name: $name) {
      id
      name
    }
  }

  query($search: String!) {
    searchAll(query: $search) {
      name
    }
  }
  ```

  will produce a module with importable tokens, e.g.

  ```ts
  import SearchAll, { searchBooks, loadAuthor } from './queries.graphql'

  athena.query(loadAuthor, { name: 'Cixin Liu' });
  ```
*/
type OperationToken = QueryOperationToken | MutateOperationToken | SubscribeOperationToken;

type QueryOperationToken = unknown;
type MutateOperationToken = unknown;
type SubscribeOperationToken = unknown;

interface Athena {
  /**



    @example

      ```graphql
      # schema.graphql
      type Query {
        searchBooks(query: String!) {
        }
      }
      ```

      ```graphql
      # queries.graphql
      query SearchBooks($search: String!) {
        searchBooks(query: $search) {
          isbn
          title
        }
      }
      ```

      ```typescript
      import SearchBooks from './queries.graphql';
      let queryResponse = athena.query(SearchBooks)
      // TODO: continue

      ```

    @param  queryOperation - does some stuff i guess
  */
  query(queryOperation: QueryOperationToken): void;
  mutate(mutateOperation: MutateOperationToken): void;
  // TODO: what exactly does this returns
  subscribe(subscribeOperation: SubscribeOperationToken): void;
}

// TODO: options
export default function buildAthena(): Athena;
