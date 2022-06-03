import type { BuildFetchOptions, Fetch, Middleware } from "./types";

import { Request, fetch } from 'cross-fetch';

export function buildFetch(middleware: Middleware[], options?: BuildFetchOptions): Fetch {
    return (input: RequestInfo, init?: RequestInit) => {
        const request = new Request(input, init);

        async function chain(request: Request, middleware: Middleware[]): Promise<Response> {
            if (middleware.length === 0) return fetch(request)

            return middleware[0](request, (input: RequestInfo, init?: RequestInit) => chain(request, middleware.slice(1)))
        }

        return chain(request, middleware)
    }
}