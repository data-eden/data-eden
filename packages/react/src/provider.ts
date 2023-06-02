import type { AthenaClient, Entity } from '@data-eden/athena';
import { createContext, useContext } from 'react';
import { createClient } from './client.js';

const client = createClient({
  url: 'http://localhost:4000/graphql',
  getCacheKey: (v: Entity) => `${v.__typename}:${v.id}`,
});

const AthenaContext = createContext<AthenaClient>(client);

export function useAthenaClient() {
  const client = useContext(AthenaContext);

  return client;
}

export const AthenaProvider = AthenaContext.Provider;
