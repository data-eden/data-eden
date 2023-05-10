import { createServer } from 'node:http';
import { createYoga } from 'graphql-yoga';
import { schema } from './schema';
import { usePersistedOperations } from '@graphql-yoga/plugin-persisted-operations';
import { readJSONSync } from 'fs-extra';
import path from 'node:path';

const store = readJSONSync(
  path.resolve('../react-graphql-test-app/src/graphql/query-identifiers.json')
);

// Create a Yoga instance with a GraphQL schema.
const yoga = createYoga({
  schema,
  logging: 'debug',
  plugins: [
    usePersistedOperations({
      allowArbitraryOperations: true,
      getPersistedOperation(hash: string) {
        console.log('resolving operation for ', hash);
        return store[hash];
      },
    }),
  ],
});

// Pass it into a server to hook into request handlers.
// eslint-disable-next-line @typescript-eslint/no-misused-promises
const server = createServer(yoga);

// Start the server and you're done!
server.listen(4000, () => {
  console.info('Server is running on http://localhost:4000/graphql');
});
