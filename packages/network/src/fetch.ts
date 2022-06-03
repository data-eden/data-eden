import { Request, fetch } from 'cross-fetch';

export type Fetch = typeof fetch;

export type Middleware = (request: Request, next: (request: RequestInfo) => void) => Promise<void>;

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

export function buildFetch(middleware: Middleware[], options?: BuildFetchOptions): Fetch {
    return async (input: RequestInfo, init?: RequestInit) => {
        const request = new Request(input, init);

        for(const ware of middleware) {
            await new Promise((resolve, reject) => {
                try {
                    ware(request, (request: RequestInfo) => {
                        request = request;
    
                        resolve(request)
                    });
                } catch(ex) {
                    reject(ex);
                }
            });
        }
        
        return fetch(request);
    }
}