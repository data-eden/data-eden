
export type Fetch = typeof fetch;

export type Middleware = (request: Request, fetch: Fetch) => ReturnType<Fetch>;

export interface BuildFetchOptions {
  // Whether to force earlier built fetches to error making the most recent //
  // invokation the authoritive fetch. You will typically only want to set this to
  // false for testing. Defaults to true.
  disablePrior?: boolean;
  // What message to throw if a user tries to invoke a disabled fetch. Useful
  // to help users know where to import fetch from rather than build it //
  // themselves.
  disableMessage?: string;
};