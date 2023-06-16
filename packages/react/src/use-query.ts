/* eslint-disable @typescript-eslint/ban-ts-comment */
import type {
  ClientError,
  DefaultVariables,
  DocumentInput,
  QueryOptions,
} from '@data-eden/athena';
import type { Reaction } from '@signalis/core';
import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react';
import { useAthenaClient } from './provider.js';
import { setupDependencyTracking } from './setup-dependency-tracking.js';
import { EMPTY, safeIncrement, mergeDeep } from './utils.js';

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
  refetch: (variables?: Variables, options?: QueryOptions) => Promise<void>;
  fetchMore: (variables?: Variables, options?: QueryOptions) => Promise<void>;
}

interface UseQueryOptions<Data extends object = object> {
  initialData?: Data;
  lazy?: boolean;
  reload?: boolean;
}

export function useQuery<
  Data extends object = object,
  Variables extends DefaultVariables = DefaultVariables
>(
  query: DocumentInput<Data, Variables>,
  variables?: Variables,
  options: UseQueryOptions<Data> = {}
): QueryResponse<Data> {
  const client = useAthenaClient();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Data | undefined>(options.initialData);
  const [error, setError] = useState<ClientError>();
  const [, forceUpdate] = useReducer(safeIncrement, 0);
  const reactionRef = useRef<Reaction>();
  const vars = useVariables(variables);
  const { initialData } = options;

  const trackDeps = useCallback(
    (data?: Data, error?: ClientError) => {
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
    },
    [EMPTY]
  );

  if (initialData) {
    useEffect(() => {
      void (async function () {
        const data = await client.processEntities(initialData);

        trackDeps(data);
      })();

      return () => {
        reactionRef.current?.dispose();
        reactionRef.current = undefined;
      };
    }, EMPTY);
  }

  const refetch = useCallback(async function <
    Variables extends DefaultVariables = DefaultVariables
  >(variables?: Variables, options?: QueryOptions) {
    setLoading(true);

    try {
      const { data, error } = await client.query<Data>(
        query,
        // if new variables were passed in, we use those, otherwise we execute with the original
        // set
        variables || vars,
        options
      );

      setResult(data);

      trackDeps(data, error);
    } finally {
      setLoading(false);
    }
  },
  EMPTY);

  const fetchMore = useCallback(
    async function <Variables extends DefaultVariables = DefaultVariables>(
      variables?: Variables
    ) {
      setLoading(true);

      try {
        const { data, error } = await client.query<Data>(
          query,
          // if new variables were passed in, we use those, otherwise we execute with the original
          // set
          variables || vars,
          {
            reload: true,
          }
        );

        // We are going to walk the data and merge over the result so that we can keep the proxies
        // Any fields that are updated will be on the newest signal
        mergeDeep<Data>(result, data);

        trackDeps(data, error);
      } finally {
        setLoading(false);
      }
    },
    [result]
  );

  if (!options.lazy) {
    useEffect(() => {
      void refetch(vars, options);

      return () => {
        reactionRef.current?.dispose();
        reactionRef.current = undefined;
      };
    }, [query, vars]);
  }

  return { data: result, loading, error, refetch, fetchMore };
}
