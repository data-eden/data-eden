import * as http from 'http';
import { createServer } from '@data-eden/shared-test-utilities';
import { afterAll, afterEach, beforeAll, describe, expect, test } from 'vitest';
import { createClient } from '@data-eden/react';
import { FindUserDocument } from './fixtures/client/graphql/__generated/find-user.graphql.js';

async function readRequestBody(request: http.IncomingMessage) {
  let body = '';

  request.on('data', (chunk) => {
    body += chunk;
  });

  return new Promise((resolve, reject) => {
    request.on('end', () => {
      resolve(body);
    });

    request.on('error', (error) => {
      reject(error);
    });
  });
}
describe('@data-eden/athena client', async function () {
  const server = await createServer();

  beforeAll(async () => {
    server.listen();
  });
  afterEach(async () => {
    await server.reset();
  });
  afterAll(() => {
    server.close();
  });

  test('custom buildRequest can alter the URL', async () => {
    let serverError: any;
    let queryId = FindUserDocument['__meta__']['queryId'];
    server.post(`/graphql?queryId=${queryId}`, async (request, response) => {
      try {
        let body = await readRequestBody(request);
        expect(body).toEqual(JSON.stringify({ variables: { userId: '7' } }));
      } catch (e) {
        serverError = e;
      } finally {
        response.writeHead(200, { 'Content-Type': 'application/json' });
        response.end(
          JSON.stringify({
            user: {
              id: 1,
              username: 'marlborough',
              email: 'john.churchill@example.com',
            },
          })
        );
      }
    });

    const client = createClient({
      id(obj) {
        return obj['id'];
      },
      buildRequest(operation, variables, { url: graphqlUrl }) {
        let queryId = operation['__meta__']['queryId'];
        let url = new URL(graphqlUrl);
        url.searchParams.append('queryId', queryId);

        return new Request(url, {
          method: 'POST',
          body: JSON.stringify({ variables }),
        });
      },
      url: server.buildUrl('/graphql'),
    });

    let responseDoc = await client.query(FindUserDocument, { userId: '7' });
    if (serverError !== undefined) {
      throw serverError;
    }
  });
});
