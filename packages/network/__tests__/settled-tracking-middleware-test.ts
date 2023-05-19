import {
  beforeAll,
  beforeEach,
  afterAll,
  afterEach,
  expect,
  test,
  describe,
} from 'vitest';

import type { FetchDebugInfo } from '@data-eden/network';
import {
  buildFetch,
  SettledTrackingMiddleware,
  hasPendingRequests,
  requestsCompleted,
  getPendingRequestState,
} from '@data-eden/network';

import { _setupDefaultRequestsCompletedOptions } from '#settled-tracking-middleware';

import type * as http from 'http';

import { fileURLToPath } from 'url';
import * as path from 'path';

import { createServer } from '@data-eden/shared-test-utilities';

describe('@data-eden/network: settled-tracking-middleware', async function () {
  const server = await createServer();

  function sanitizeStacktrace(errorStack: string): string {
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const prefix = path.resolve(__dirname, '../../../');
    const lines = errorStack.split('\n');

    return (
      lines
        // only look at the first 3 stack frames to avoid including a bunch of node_modules and whatnot
        .slice(0, 3)
        // strip the repo root prefix from the stacks to ensure stable across users
        .map((line: string) => line.replace(prefix, ''))
        // strip line:col information
        .map((line: string) => line.replace(/:\d+:\d+/, ''))
        // remove trailing whitespace (avoids snapshot instability for editors that auto delete trailing whitespace)
        .map((line: string) => line.trimEnd())
        .join('\n')
    );
  }

  function sanitizeServerUrl(input: string): string {
    const baseUrl = server.buildUrl('');

    return input.replace(baseUrl, '');
  }

  function simplifyPendingState(pendingState: FetchDebugInfo[]) {
    return pendingState.map((debugInfo) => {
      const prefixLength = server.buildUrl('').length;

      if (debugInfo.stack === undefined) {
        throw new Error('stack trace not found');
      }

      return {
        ...debugInfo,
        startTime: 99999999,
        stack: sanitizeStacktrace(debugInfo.stack),
        url: debugInfo.url.slice(prefixLength),
      };
    });
  }

  beforeAll(() => server.listen());
  beforeEach(() => {
    server.get(
      '/resource',
      (_request: http.IncomingMessage, response: http.ServerResponse) => {
        response.writeHead(200, { 'Content-Type': 'application/json' });
        response.end(JSON.stringify({ status: 'success' }));
      }
    );
  });
  afterEach(() => server.reset());
  afterAll(() => server.close());

  test('hasPendingRequest returns true for multiple requests', async () => {
    const fetch = buildFetch([SettledTrackingMiddleware]);

    expect(hasPendingRequests(fetch)).toEqual(false);

    const fetch1 = fetch(server.buildUrl('/resource'));
    const fetch2 = fetch(server.buildUrl('/resource'));

    expect(hasPendingRequests(fetch)).toEqual(true);

    await fetch1;

    expect(hasPendingRequests(fetch)).toEqual(true);

    await fetch2;

    expect(hasPendingRequests(fetch)).toEqual(false);
  });

  test('hasPendingRequest returns true when requests are outstanding with multiple `buildFetch` calls', async () => {
    const fetch1 = buildFetch([SettledTrackingMiddleware]);
    const fetch2 = buildFetch([SettledTrackingMiddleware]);

    expect(
      hasPendingRequests(fetch1),
      'middleware1 no requests started'
    ).toEqual(false);
    expect(
      hasPendingRequests(fetch2),
      'middleware2 no request started'
    ).toEqual(false);

    const fetchResult1 = fetch1(server.buildUrl('/resource'));

    expect(
      hasPendingRequests(fetch1),
      'middleware1 when request initiated'
    ).toEqual(true);
    expect(
      hasPendingRequests(fetch2),
      'middleware2 no requests started (after middleware1 started)'
    ).toEqual(false);

    const fetchResult2 = fetch2(server.buildUrl('/resource'));

    expect(
      hasPendingRequests(fetch1),
      'middleware1 when request initiated for both'
    ).toEqual(true);
    expect(
      hasPendingRequests(fetch2),
      'middleware2 when request initiated'
    ).toEqual(true);

    await fetchResult1;

    expect(
      hasPendingRequests(fetch1),
      'middleware1 after request awaited'
    ).toEqual(false);
    expect(
      hasPendingRequests(fetch2),
      'middleware2 after middleware1 request awaited'
    ).toEqual(true);

    await fetchResult2;

    expect(
      hasPendingRequests(fetch1),
      'middleware1 after all requests completed'
    ).toEqual(false);
    expect(
      hasPendingRequests(fetch2),
      'middleware2 after all requests completed'
    ).toEqual(false);
  });

  test('getPendingRequestState returns an empty array when no requests have been done', async () => {
    const fetch = buildFetch([SettledTrackingMiddleware]);

    expect(
      simplifyPendingState(getPendingRequestState(fetch))
    ).toMatchInlineSnapshot('[]');
  });

  test('getPendingRequestState includes debug information for all currently pending requests', async () => {
    const fetch1 = buildFetch([SettledTrackingMiddleware]);
    const fetch2 = buildFetch([SettledTrackingMiddleware]);

    const fetches = [
      fetch1(server.buildUrl('/resource')),
      fetch2(server.buildUrl('/resource')),
      fetch1(server.buildUrl('/resource')),
      fetch2(server.buildUrl('/resource')),
    ];

    try {
      expect(simplifyPendingState(getPendingRequestState(fetch1)))
        .toMatchInlineSnapshot(`
          [
            {
              "method": "GET",
              "stack": "Error:
              at SettledTrackingMiddleware (/packages/network/src/settled-tracking-middleware.ts)
              at /packages/network/src/fetch.ts",
              "startTime": 99999999,
              "url": "/resource",
            },
            {
              "method": "GET",
              "stack": "Error:
              at SettledTrackingMiddleware (/packages/network/src/settled-tracking-middleware.ts)
              at /packages/network/src/fetch.ts",
              "startTime": 99999999,
              "url": "/resource",
            },
          ]
        `);

      expect(simplifyPendingState(getPendingRequestState(fetch2)))
        .toMatchInlineSnapshot(`
          [
            {
              "method": "GET",
              "stack": "Error:
              at SettledTrackingMiddleware (/packages/network/src/settled-tracking-middleware.ts)
              at /packages/network/src/fetch.ts",
              "startTime": 99999999,
              "url": "/resource",
            },
            {
              "method": "GET",
              "stack": "Error:
              at SettledTrackingMiddleware (/packages/network/src/settled-tracking-middleware.ts)
              at /packages/network/src/fetch.ts",
              "startTime": 99999999,
              "url": "/resource",
            },
          ]
        `);
    } finally {
      await Promise.allSettled(fetches);
    }
  });

  test('requestCompleted waits for all pending requests', async () => {
    const fetch = buildFetch([SettledTrackingMiddleware]);

    const steps: string[] = [];
    steps.push(`hasPendingRequests: ${String(hasPendingRequests(fetch))}`);

    const fetch1 = fetch(server.buildUrl('/resource'));
    const fetch2 = fetch(server.buildUrl('/resource'));

    const completedPromise = requestsCompleted(fetch).then(() => {
      steps.push('requests completed');
    });

    steps.push(`hasPendingRequests: ${String(hasPendingRequests(fetch))}`);

    await fetch1;

    steps.push(`hasPendingRequests: ${String(hasPendingRequests(fetch))}`);

    await fetch2;

    steps.push(`hasPendingRequests: ${String(hasPendingRequests(fetch))}`);

    await completedPromise;

    expect(steps).toMatchInlineSnapshot(`
      [
        "hasPendingRequests: false",
        "hasPendingRequests: true",
        "hasPendingRequests: true",
        "requests completed",
        "hasPendingRequests: false",
      ]
    `);
  });

  test('requestCompleted resolves when no requests have been made', async () => {
    const fetch = buildFetch([SettledTrackingMiddleware]);

    await requestsCompleted(fetch);
  });

  test('requestsCompleted with a custom timeout', async () => {
    expect.assertions(3);

    const steps: string[] = [];
    const fetch = buildFetch([SettledTrackingMiddleware]);

    server.get(
      '/slow-request',
      (_request: http.IncomingMessage, response: http.ServerResponse) => {
        setTimeout(() => {
          steps.push('/slow-response resolving');
          response.writeHead(200, { 'Content-Type': 'application/json' });
          response.end(JSON.stringify({ status: 'success' }));
        }, 50);
      }
    );

    let fetchPromise;

    try {
      fetchPromise = fetch(server.buildUrl('/slow-request'));

      await requestsCompleted(fetch, { timeout: 5 });
      steps.push('requestCompleted resolved incorrectly');
    } catch (error: unknown) {
      if (error instanceof Error) {
        expect(sanitizeServerUrl(error.message)).toMatchInlineSnapshot(`
          "requestsCompleted timeout waiting for requests to complete:
            GET /slow-request"
        `);
        expect(error.name).toMatchInlineSnapshot(
          '"SETTLED_MIDDLEDWARE_REQUEST_COMPLETED_TIMEOUT"'
        );
      }
    } finally {
      await fetchPromise;
    }

    try {
      fetchPromise = fetch(server.buildUrl('/slow-request'));

      await requestsCompleted(fetch, { timeout: 100 });

      expect(steps).toMatchInlineSnapshot(`
        [
          "/slow-response resolving",
          "/slow-response resolving",
        ]
      `);
    } finally {
      await fetchPromise;
    }
  });

  test('requestsCompleted with a custom timeout message prefix', async () => {
    expect.assertions(1);

    const steps: string[] = [];
    const fetch = buildFetch([SettledTrackingMiddleware]);

    server.get(
      '/slow-request',
      (_request: http.IncomingMessage, response: http.ServerResponse) => {
        setTimeout(() => {
          steps.push('/slow-response resolving');
          response.writeHead(200, { 'Content-Type': 'application/json' });
          response.end(JSON.stringify({ status: 'success' }));
        }, 50);
      }
    );

    let fetchPromise;

    try {
      fetchPromise = fetch(server.buildUrl('/slow-request'));

      await requestsCompleted(fetch, {
        timeout: 5,
        timeoutMessagePrefix: 'HIYA',
      });
    } catch (error: unknown) {
      if (error instanceof Error) {
        expect(sanitizeServerUrl(error.message)).toMatchInlineSnapshot(`
          "HIYA
            GET /slow-request"
        `);
      }
    } finally {
      await fetchPromise;
    }
  });

  test('requestsCompleted when requests take longer than default timeout', async () => {
    expect.assertions(1);

    const steps: string[] = [];
    const fetch = buildFetch([SettledTrackingMiddleware]);

    server.get(
      '/slow-request',
      (_request: http.IncomingMessage, response: http.ServerResponse) => {
        setTimeout(() => {
          steps.push('/slow-response resolving');
          response.writeHead(200, { 'Content-Type': 'application/json' });
          response.end(JSON.stringify({ status: 'success' }));
        }, 50);
      }
    );

    let fetchPromise;

    try {
      fetchPromise = fetch(server.buildUrl('/slow-request'));

      _setupDefaultRequestsCompletedOptions({ timeout: 5 });

      await requestsCompleted(fetch);
    } catch (error: unknown) {
      if (error instanceof Error) {
        expect(sanitizeServerUrl(error.message)).toMatchInlineSnapshot(`
          "requestsCompleted timeout waiting for requests to complete:
            GET /slow-request"
        `);
      }
    } finally {
      await fetchPromise;
    }
  });
});
