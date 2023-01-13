import * as http from 'http';
import getPort from 'get-port';

export const host = 'localhost';

interface RequestHandler {
  (request: http.IncomingMessage, response: http.ServerResponse): void;
}

interface Server {
  host: string;
  protocol: string;
  port: number;

  buildUrl(path: string): string;
  listen(): Promise<void>;
  close(): Promise<void>;

  get(path: string, handler: RequestHandler): void;
  post(path: string, handler: RequestHandler): void;

  reset(): Promise<void>;
}

export async function createServer(): Promise<Server> {
  const port = await getPort();

  let server = http.createServer();
  const protocol = 'http';
  const handlers: [method: string, path: string, handler: RequestHandler][] =
    [];

  server.on(
    'request',
    (request: http.IncomingMessage, response: http.ServerResponse) => {
      for (const [method, path, handler] of handlers) {
        if (method === request.method && path === request.url) {
          handler(request, response);
          return;
        }
      }

      throw new Error(
        `Unhandled request: ${
          request.method ?? 'GET'
        } ${protocol}://${host}:${port}${request.url ?? '<UNKNOWN URL>'}`
      );
    }
  );

  return {
    host,
    port,
    protocol,

    buildUrl(path: string) {
      return `${protocol}://${host}:${port}${path}`;
    },

    listen() {
      return new Promise((resolve) => {
        server.listen(port, resolve);
      });
    },

    async close() {
      server.close();
    },

    get(path: string, handler: RequestHandler) {
      handlers.push(['GET', path, handler]);
    },

    post(path: string, handler: RequestHandler) {
      handlers.push(['POST', path, handler]);
    },

    async reset() {
      handlers.length = 0;
    },
  };
}
