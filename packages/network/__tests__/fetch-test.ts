import { beforeAll, afterAll, afterEach, expect, test, describe } from 'vitest';

import { Response, Request } from 'cross-fetch';
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
    rest.post('http://www.example.com/resource/preview', (req, res, ctx) => {
      return res(
        ctx.status(200),
        ctx.json({ status: 'success', method: 'POST', headers: req.headers })
      );
    }),
  ];

  const server = setupServer(...restHandlers);

  server.events.on('request:unhandled', (req) => {
    console.log('%s %s has no handler', req.method, req.url.href);

    throw new Error('handle unhandled request!');
  });

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

  test('should be able to return fetch without middlewares passed', async () => {
    expect.assertions(2);

    const fetch = buildFetch([]);

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
          },
          "names": {},
        },
        "status": "success",
      }
    `);
  });

  test('should be able to handle basic middleware', async () => {
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

    const customFetch = (
      _input: RequestInfo,
      _init?: RequestInit
    ): Promise<Response> => {
      return Promise.resolve(new Response('We overrode fetch!'));
    };

    const fetch = buildFetch([noopMiddleware], {
      fetch: customFetch,
    });

    const response = await fetch('https://www.example.com');

    expect(await response.text()).toMatchInlineSnapshot('"We overrode fetch!"');
  });

  test('should be able to change the http method for a given request', async () => {
    expect.assertions(2);

    const queryTunneling: Middleware = async (
      request: Request,
      next: NormalizedFetch
    ) => {
      if (request.url.length <= 10) {
        // no tunneling needed
        return next(request);
      }

      const url = new URL(request.url);
      request.headers.set('X-HTTP-Method-Override', request.method);
      const tunneledRequest = new Request(
        `${url.protocol}//${url.hostname}${url.pathname}`,
        {
          method: 'POST',
          headers: request.headers,
          body: url.searchParams,
        }
      );

      return next(tunneledRequest);
    };

    const fetch = buildFetch([csrfMiddleware, queryTunneling, noopMiddleware]);

    const response = await fetch('http://www.example.com/resource/preview');

    expect(response.status).toEqual(200);
    expect(await response.json()).toMatchInlineSnapshot(`
      {
        "headers": {
          "headers": {
            "accept": "*/*",
            "accept-encoding": "gzip,deflate",
            "connection": "close",
            "content-length": "0",
            "content-type": "application/x-www-form-urlencoded;charset=UTF-8",
            "host": "www.example.com",
            "user-agent": "node-fetch/1.0 (+https://github.com/bitinn/node-fetch)",
            "x-csrf": "a totally legit request",
            "x-http-method-override": "GET",
          },
          "names": {},
        },
        "method": "POST",
        "status": "success",
      }
    `);
  });

  test('should be able to maintain order of middlewares passed', async () => {
    expect.assertions(5);

    const middlewareOne: Middleware = async (
      request: Request,
      next: NormalizedFetch
    ) => {
      expect(request.headers).toMatchInlineSnapshot(`
        Headers {
          Symbol(map): {},
        }
      `);

      return next(request);
    };

    const middlewareTwo: Middleware = async (
      request: Request,
      next: NormalizedFetch
    ) => {
      expect(request.headers).toMatchInlineSnapshot(`
        Headers {
          Symbol(map): {},
        }
      `);

      request.headers.set('two', 'true');

      return next(request);
    };

    const middlewareThree: Middleware = async (
      request: Request,
      next: NormalizedFetch
    ) => {
      expect(request.headers).toMatchInlineSnapshot(`
        Headers {
          Symbol(map): {
            "two": [
              "true",
            ],
          },
        }
      `);

      request.headers.set('three', 'true');

      return next(request);
    };

    const fetch = buildFetch([middlewareOne, middlewareTwo, middlewareThree]);

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
            "three": "true",
            "two": "true",
            "user-agent": "node-fetch/1.0 (+https://github.com/bitinn/node-fetch)",
          },
          "names": {},
        },
        "status": "success",
      }
    `);
  });
});
