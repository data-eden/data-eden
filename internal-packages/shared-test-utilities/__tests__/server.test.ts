import { expect, test, describe } from 'vitest';
import type * as http from 'http';

import { createServer } from '@data-eden/shared-test-utilities';

describe('@data-eden/shared-test-utilities/server.ts', function () {
  test('it generally works', async function () {
    const server = await createServer();

    try {
      await server.listen();

      server.get(
        '/resource',
        (_request: http.IncomingMessage, response: http.ServerResponse) => {
          response.writeHead(200, { 'Content-Type': 'application/json' });
          response.end(
            JSON.stringify({
              status: 'success',
            })
          );
        }
      );

      let response = await fetch(server.buildUrl('/resource'));

      expect(await response.json()).toMatchInlineSnapshot(`
        {
          "status": "success",
        }
      `);
    } finally {
      await server.close();
    }
  });
});
