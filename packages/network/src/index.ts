type Fetch = typeof fetch;

export type Middleware = (request: Request, fetch: Fetch) => ReturnType<Fetch>;
