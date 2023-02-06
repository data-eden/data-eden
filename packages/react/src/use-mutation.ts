import {
  ClientError,
  DefaultVariables,
  DocumentInput,
  isSignalProxy,
  traverse,
  unwrap,
} from '@data-eden/athena';
import { Reaction } from '@signalis/core';
import { useCallback, useReducer, useRef, useState } from 'react';
import { useAthenaClient } from './provider.js';
import { safeIncrement } from './utils.js';

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

  const execute = useCallback(
    async (variables: Variables) => {
      setLoading(true);

      try {
        const { data, error } = await client.mutate<Data, Variables>(
          query,
          variables
        );

        if (!reactionRef.current) {
          const reaction = new Reaction(() => {
            if (data) {
              setResult(data);
            }

            if (error) {
              setError(error);
            }

            forceUpdate();
          });

          reaction.trap(() => {
            let foundRoot = false;
            let visited = new WeakSet<object>();
            traverse(data, (_key, value, _parent) => {
              // DFS through the root object and if we find any other signals, we also subscribe
              // to them so that deeply nested updates propagate through to React
              if (isSignalProxy(value)) {
                if (visited.has(value)) {
                  return false;
                }
                visited.add(value);
                if (!foundRoot) {
                  foundRoot = true;
                }
                unwrap(value);
                return true;
              }

              if (Array.isArray(value)) {
                return true;
              }

              if (!foundRoot) {
                return true;
              }

              return false;
            });
          });

          reactionRef.current = reaction;
          reaction.compute();
        }

        return data;
      } finally {
        setLoading(false);
      }
    },
    [query]
  );

  return { data: result, loading, execute, error };
}
