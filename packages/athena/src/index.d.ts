// TODO: import these from packages/cache/index.ts
import type { CacheOptions } from './cache.js';





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

interface OperationOptions {
  request: {
    maxAge: number | 'default';
  }
  response: Omit<CacheOptions, '$debug'>
}

// TODO: make this depend on QueryOperationToken; will require fancy genericizing
// see e.g. ember-restli-graphql
type VariableTypes = unknown;
// TODO: GraphQLResponse (data, errors, extensions)
type Response = unknown;

interface Athena {
  /**

    Execcute `queryOperation` and resturn the result.

    @example

      ```graphql
      # schema.graphql
      type Query {
        searchBooks(query: String!) {
          isbn
          title
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
      let result = await athena.query(SearchBooks)

      // result has a type generated from the SearchBooks query
      let isbns = query.data.searchBooks.map(b => b.isbn);
      ```

    @param  queryOperation - does some stuff i guess
  */
  // TODO: add generic parameters to QueryOperationToken, VariableTypes, Response et. al
  // see e.g. executeMutation
  // TODO: thread $debug = $Debug & AthenaDebugAPIs on the response
  //  to do this correctly we should mock up a larger set of $debug APIs to see which ones belong where
  //  note the cache types we have in cache.d.ts definitely have some $debug threadding issues
  query(queryOperation: QueryOperationToken, variables: VariableTypes, options?: OperationOptions): Promise<Response>;
  query(queryOperation: QueryOperationToken, options?: OperationOptions): Promise<Response>;

  // TODO: add generic parameters to QueryOperationToken, VariableTypes, Response et. al
  // see e.g. executeMutation
  mutate(queryOperation: QueryOperationToken, variables: VariableTypes, options?: OperationOptions): Promise<Response>;
  mutate(queryOperation: QueryOperationToken, options?: OperationOptions): Promise<Response>;

  // TODO: what exactly does subscribe return?
  subscribe(subscribeOperation: SubscribeOperationToken): void;
}

// TODO: options
//  options.cache
//  options.queryLookup (from token)
//  options.fetch
interface BuildAthenaOptions {
  // TODO: cache options | false // no cache
  // TODO: rerender options (starbeam?)
  foo: void;
}

export default function buildAthena(options?: BuildAthenaOptions): Athena;
