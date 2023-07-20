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

  /**
   * Gives consumers an opportunity to manipulate the Promise object before
   * handing it over to downstream for further processing.
   *
   * One use case is in Ember distribution whereas the fetch needs to return a
   * RSVP.Promise instance instead of the native promise.
   */
  coerce?: (promise: Promise<Response>) => Promise<Response>;
}

function globalFetch(request: Request): Promise<Response> {
  return fetch(request);
}

/**
 * Default coercer
 * @param p the native Promise returned from fetch.
 * @returns A promise that's duck-type compatible to Promise<Response>
 */
const defaultCoercer = (p: Promise<Response>) => p;

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
  const coerce = options?.coerce ?? defaultCoercer;

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

  result = (rawRequest: RequestInfo | URL, init?: RequestInit) => {
    const normalizedRequest = new Request(rawRequest, init);
    const nativePromise = curriedMiddlewares(normalizedRequest);
    return coerce(nativePromise);
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
