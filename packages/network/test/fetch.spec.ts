import { beforeAll, afterAll, afterEach, expect, test, assert } from 'vitest'

import { setupServer } from 'msw/node'
import { rest } from 'msw'

import { buildFetch, Fetch } from '../src/fetch';

export const restHandlers = [
    rest.get('http://www.example.com/resource', (req, res, ctx) => {
        return res(ctx.status(200), ctx.json({ status: 'success', headers: req.headers }))
    }),
]

const server = setupServer(...restHandlers)

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterAll(() => server.close())
afterEach(() => server.resetHandlers())

test('basic middleware',  async () => {
    expect.assertions(2);

    async function noopMiddleware(request: Request, next: (request: RequestInfo) => void) : Promise<void> {
        return next(request);
    }
    
    async function csrfMiddleware(request: Request, next: (request: RequestInfo) => void) : Promise<void> {
        request.headers.set('X-CSRF', 'a totally legit request');
        
        return next(request);
    }

    const fetch = buildFetch([
        noopMiddleware,
        csrfMiddleware,
    ]);

    const response = await fetch('http://www.example.com/resource');

    expect(response.status).toEqual(200);
    expect(await response.json()).toMatchInlineSnapshot(`
      {
        "headers": {
          "headers": {
            "accept": "*/*",
            "accept-encoding": "gzip,deflate",
            "connection": "close",
            "host": "www.example.com",
            "user-agent": "node-fetch/1.0 (+https://github.com/bitinn/node-fetch)",
            "x-csrf": "a totally legit request",
          },
          "names": {},
        },
        "status": "success",
      }
    `);
});
