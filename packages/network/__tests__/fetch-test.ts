import { beforeAll, afterAll, afterEach, expect, test, describe } from 'vitest';

import { Response } from 'cross-fetch';
import { setupServer } from 'msw/node';
import { rest } from 'msw';

import { buildFetch, Middleware, NormalizedFetch } from '../src/fetch';

describe('@data-eden/fetch', function () {
  const restHandlers = [
    rest.get('http://www.example.com/resource', (req, res, ctx) => {
      return res(
        ctx.status(200),
        ctx.json({ status: 'success', headers: req.headers })
      );
    }),
  ];

  const server = setupServer(...restHandlers);

  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
  afterAll(() => server.close());
  afterEach(() => server.resetHandlers());

  const noopMiddleware: Middleware = async (
    request: Request,
    next: NormalizedFetch
  ) => {
    return next(request);
  };

  const csrfMiddleware: Middleware = async (
    request: Request,
    next: NormalizedFetch
  ) => {
    request.headers.set('X-CSRF', 'a totally legit request');

    return next(request);
  };

  test('basic middleware', async () => {
    expect.assertions(2);

    const fetch = buildFetch([noopMiddleware, csrfMiddleware]);

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

  test('should be able to override fetch', async () => {
    expect.assertions(1);

    const customFetch = async (
      input: RequestInfo,
      init?: RequestInit
    ): Promise<Response> => {
      return new Response('We overrode fetch!');
    };

    const fetch = buildFetch([noopMiddleware], {
      fetch: customFetch,
    });

    const response = await fetch('https://www.example.com');

    expect(await response.text()).toMatchInlineSnapshot('"We overrode fetch!"');
  });
});
