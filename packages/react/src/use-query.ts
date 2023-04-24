import type {
  ClientError,
  DefaultVariables,
  DocumentInput,
  Entity,
  WithSignal,
} from '@data-eden/athena';
import { isSignalProxy, traverse, unwrap } from '@data-eden/athena';
import { Reaction } from '@signalis/core';
import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react';
import { useAthenaClient } from './provider.js';
import { EMPTY, safeIncrement } from './utils.js';

// Key and memoize the variables object so we determine when the variables themselves have
// actually changed
function useVariables<Variables extends DefaultVariables = DefaultVariables>(
  variables?: Variables
): Variables | undefined {
  const prev = useRef<
    { key: string; variables: Variables | undefined } | undefined
  >(undefined);

  return useMemo(() => {
    const key = JSON.stringify(variables);

    if (prev.current && prev.current.key === key) {
      return prev.current.variables;
    } else {
      prev.current = {
        key,
        variables,
      };

      return variables;
    }
  }, [variables]);
}

interface QueryResponse<
  Data extends object = object,
  Variables extends DefaultVariables = DefaultVariables
> {
  data: Data | undefined;
  loading: boolean;
  error: ClientError | undefined;
  refetch: (variables?: Variables) => Promise<void>;
}

export function useQuery<
  Data extends object = object,
  Variables extends DefaultVariables = DefaultVariables
>(
  query: DocumentInput<Data, Variables>,
  variables?: Variables
): QueryResponse<Data> {
  const client = useAthenaClient();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Data>();
  const [error, setError] = useState<ClientError>();
  const [, forceUpdate] = useReducer(safeIncrement, 0);
  const reactionRef = useRef<Reaction>();
  const vars = useVariables(variables);

  const refetch = useCallback(async function <
    Variables extends DefaultVariables = DefaultVariables
  >(variables?: Variables) {
    setLoading(true);

    try {
      const { data, error } = await client.query<Data>(
        query,
        // if new variables were passed in, we use those, otherwise we execute with the original
        // set
        variables || vars
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
          let visited = new WeakSet<WithSignal<Entity>>();

          traverse(data, (_key, value, _parent) => {
            // In case we have a cycle, we don't want to blow everything up recursing infinitely
            if (visited.has(value)) {
              return false;
            }

            // DFS through the root object and if we find any other signals, we also subscribe
            // to them so that deeply nested updates propagate through to React
            if (isSignalProxy(value)) {
              if (!foundRoot) {
                foundRoot = true;
              }
              visited.add(value);
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
    } finally {
      setLoading(false);
    }
  },
  EMPTY);

  useEffect(() => {
    void refetch(vars);

    return () => {
      reactionRef.current?.dispose();
      reactionRef.current = undefined;
    };
  }, [query, vars]);

  return { data: result, loading, error, refetch };
}
