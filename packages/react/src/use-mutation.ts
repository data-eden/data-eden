import type {
  ClientError,
  DefaultVariables,
  DocumentInput,
} from '@data-eden/athena';
import type { Reaction } from '@signalis/core';
import { useCallback, useReducer, useRef, useState } from 'react';
import { useAthenaClient } from './provider.js';
import { setupDependencyTracking } from './setup-dependency-tracking.js';
import { EMPTY, safeIncrement } from './utils.js';

export function useMutation<
  Data extends object = object,
  Variables extends DefaultVariables = DefaultVariables
>(query: DocumentInput<Data, Variables>) {
  const client = useAthenaClient();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Data>();
  const [error, setError] = useState<ClientError>();
  const [, forceUpdate] = useReducer(safeIncrement, 0);
  const reactionRef = useRef<Reaction>();

  const trackDeps = useCallback((data?: Data, error?: ClientError) => {
    setupDependencyTracking(
      () => {
        if (data) {
          setResult(data);
        }

        if (error) {
          setError(error);
        }

        forceUpdate();
      },
      reactionRef,
      data
    );
  }, EMPTY);

  const execute = useCallback(
    async (variables: Variables) => {
      setLoading(true);

      try {
        const { data, error } = await client.mutate<Data, Variables>(
          query,
          variables
        );

        trackDeps(data, error);

        return data;
      } finally {
        setLoading(false);
      }
    },
    [query]
  );

  return { data: result, loading, execute, error };
}
