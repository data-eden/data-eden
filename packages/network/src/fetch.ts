import type { FetchWithDebug } from './dev.js';
export type NormalizedFetch = (request: Request) => Promise<Response>;

export interface MiddlewareMetadata {
  /**
    The specific function that was returned by `buildFetch`. This can be useful
    to allow middlewares to handle state that is specifically related to one
    `buildFetch` result over another one.

    Note: The middleware **must not** actually invoke this `fetch` method (doing so
    will throw due to infinite recursion).
  */
  fetch: typeof fetch;
}

export type Middleware = (
  /**
   * Request object to be manipulated by middleware
   */
  request: Request,
  /**
   * localized fetch used when all middlewares are done with manipulating Request
   */
  next: NormalizedFetch,

  /**
   * metadata regarding the current request
   */
  metadata: MiddlewareMetadata
) => Promise<Response>;

export interface BuildFetchOptions {
  /**
   * Whether to force earlier built fetches to error making the most recent //
   * invokation the authoritive fetch. You will typically only want to set this to
   * false for testing. Defaults to true.
   */
  disablePrior?: boolean;
  /**
   * What message to throw if a user tries to invoke a disabled fetch. Useful
   * to help users know where to import fetch from rather than build it //
   * themselves.
   */
  disableMessage?: string;

  /**
   * override the default fetch implementation
   */
  fetch?: typeof fetch;

  /**
   * Whether to enable debug mode. This is useful for debugging through the
   * middleware stack. The default value is `true` `buildFetch` will add a
   * `$debug` property on the `fetch` function that is returned with helpful
   * debug information.
   */
  debug?: boolean;
}

function globalFetch(request: Request): Promise<Response> {
  return fetch(request);
}

/**
 * Builds a `fetch`-compatible function that runs `middleware`s on each
 * request.
 *
 * @param middlewares {Middleware[]} array of middlewares
 * @param options {BuildFetchOptions=} optional options for overriding buildFetch configuration
 * @returns Fetch
 */
export function buildFetch(
  middlewares: Middleware[],
  options?: BuildFetchOptions
): typeof fetch {
  if (typeof fetch === 'undefined') {
    throw new Error(
      "@data-eden/network requires `fetch` to be available on`globalThis`. Did you forget to setup `cross-fetch/polyfill` before calling @data-eden/network's `buildFetch`?"
    );
  }
  const _fetch: NormalizedFetch = options?.fetch || globalFetch;

  let result: typeof fetch;

  const curriedMiddlewares: NormalizedFetch = [...middlewares]
    .reverse()
    .reduce(
      (next: NormalizedFetch, middleware: Middleware): NormalizedFetch => {
        return async (request: Request) => {
          const metadata = {
            fetch: result,
          };

          return middleware(request, next, metadata);
        };
      },
      _fetch
    );

  result = async (rawRequest: RequestInfo | URL, init?: RequestInit) => {
    const normalizedRequest = new Request(rawRequest, init);
    return curriedMiddlewares(normalizedRequest);
  };

  if (options?.debug !== false) {
    const error = new Error();
    // eslint-disable-next-line
    (result as FetchWithDebug).$debug = {
      get creationStack() {
        return error.stack;
      },

      get middlewares() {
        return middlewares;
      },
    };
  }

  return result;
}
