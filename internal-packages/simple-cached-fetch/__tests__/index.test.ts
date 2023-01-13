import {
  beforeAll,
  afterAll,
  afterEach,
  expect,
  test,
  describe,
} from 'vitest';
import * as http from 'http';

// TODO: don't duplicate this :)
import { createServer } from './utils.js';
import { buildCachedFetch } from '@data-eden/internal-package-simple-cached-fetch';

describe('@data-eden/internal-package-simple-cached-fetch', async function () {

  let server = await createServer();

  beforeAll(async () => await server.listen());
  afterEach(() => server.reset());
  afterAll(() => server.close());

  test('can make a simple request', async function() {
    server.get(
      '/resource',
      (request: http.IncomingMessage, response: http.ServerResponse) => {
        response.writeHead(200, { 'Content-Type': 'application/json' });
        response.end(
          JSON.stringify({
            status: 'success',
          })
        );
      }
    );

    const fetch = buildCachedFetch();

    const response = await fetch(server.buildUrl('/resource'));

    expect(response).toMatchInlineSnapshot(`
      {
        "status": "success",
      }
    `);
  });
});
