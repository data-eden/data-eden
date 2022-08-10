import { beforeAll, afterAll, afterEach, expect, test, describe } from 'vitest';

import { Response, Request } from 'cross-fetch';
// TODO: this import _should_ use `msw/node`, but the types do not resolve
// properly when using `moduleResolution: 'node16'`
import { setupServer } from 'msw/lib/node/index.js';
import { MockedRequest, rest } from 'msw';

import { buildFetch, Middleware, NormalizedFetch } from '@data-eden/network';

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
    rest.get('http://www.example.com/analytics', (_req, res, ctx) => {
      return res(
        ctx.set('x-call-id', '1234567'),
        ctx.status(200),
        ctx.json({ status: 'success' })
      );
    }),
  ];

  const server = setupServer(...restHandlers);

  server.events.on('request:unhandled', (req: MockedRequest) => {
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
      _input: URL | RequestInfo,
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

  test('should be able to introspect on the response as a middleware', async () => {
    expect.assertions(4);

    async function analyticsMiddleware(
      request: Request,
      next: (request: Request) => Promise<Response>
    ): Promise<Response> {
      const response = await next(request);

      expect(response.headers).toMatchInlineSnapshot(`
        Headers {
          Symbol(map): {
            "content-type": [
              "application/json",
            ],
            "x-call-id": [
              "1234567",
            ],
            "x-powered-by": [
              "msw",
            ],
          },
        }
      `);
      expect(response.status).toEqual(200);

      return response;
    }

    const fetch = buildFetch([analyticsMiddleware]);

    const response = await fetch('http://www.example.com/analytics');
    expect(response.status).toEqual(200);
    expect(await response.json()).toMatchInlineSnapshot(`
      {
        "status": "success",
      }
    `);
  });

  test('can read and mutate request headers', async function () {
    expect.assertions(2);

    server.use(
      rest.get('http://www.example.com/foo', (req, res, ctx) => {
        expect(req.headers).toMatchInlineSnapshot(`
          HeadersPolyfill {
            "headers": {
              "accept": "*/*",
              "accept-encoding": "gzip,deflate",
              "connection": "close",
              "host": "www.example.com",
              "user-agent": "node-fetch/1.0 (+https://github.com/bitinn/node-fetch)",
              "x-track": "signup",
            },
            "names": Map {
              "x-track" => "x-track",
              "accept" => "accept",
              "user-agent" => "user-agent",
              "accept-encoding" => "accept-encoding",
              "connection" => "connection",
              "host" => "host",
            },
          }
        `);
        return res(ctx.status(200), ctx.json({ status: 'success' }));
      })
    );

    // A middleware might provide a header-based API (perhaps with sugar
    // functions) to let users annotate requests, e.g. for requests that should
    // be grouped according to a product use case.
    //
    // In the general case a middleware would need to be able to consume and
    // modify the headers as a way of providing a seamless API.
    async function headerTransformationMiddleware(
      request: Request,
      next: NormalizedFetch
    ): Promise<Response> {
      let useCaseAnnotation = request.headers.get('X-Use-Case');

      if (useCaseAnnotation) {
        request.headers.set('X-Track', useCaseAnnotation);
        request.headers.delete('X-Use-Case');
      }

      return next(request);
    }

    let fetch = buildFetch([headerTransformationMiddleware]);
    let response = await fetch('http://www.example.com/foo', {
      headers: { 'X-Use-Case': 'signup' },
    });
    expect(await response.json()).toMatchInlineSnapshot(`
      {
        "status": "success",
      }
    `);
  });
});
