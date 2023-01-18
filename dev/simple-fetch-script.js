import { createServer } from '@data-eden/shared-test-utilities';
import { buildFetch } from '@data-eden/network';

async function main() {
  const server = await createServer();

  server.get('/resource', (_request, response) => {
    response.writeHead(200, { 'Content-Type': 'application/json' });
    response.end(
      JSON.stringify({
        status: 'success',
      })
    );
  });

  await server.listen();

  const url = server.buildUrl('/resource');

  const noopMiddleware = async (request, next) => {
    return next(request);
  };

  const csrfMiddleware = async (request, next) => {
    request.headers.set('X-CSRF', 'a totally legit request');

    return next(request);
  };

  const fetch = buildFetch([noopMiddleware, csrfMiddleware]);

  const response = await fetch(url);
  const result = await response.json();

  console.log(`Result: ${result.status}`);

  await server.close();
}

main();
