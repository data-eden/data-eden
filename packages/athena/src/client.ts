import { buildCache } from '@data-eden/cache';
import { set } from 'lodash-es';
import { isEntity, parseEntities } from './parse-entities.js';
import {
  type MergeResolvers,
  SignalCache,
  createLinkNode,
} from './signal-cache.js';
import type {
  DataEdenCache,
  DefaultVariables,
  DocumentInput,
  GraphQLOperation,
  GraphQLResponse,
  IdFetcher,
  OperationResult,
  ReactiveAdapter,
} from './types.js';
import { prepareOperation } from './utils.js';

export interface ClientArgs {
  url: string;
  getCacheKey: IdFetcher;
  fetch?: typeof fetch;
  buildRequest?: BuildRequest;
  adapter: ReactiveAdapter;
  queryTTL?: number;
  mergeResolvers: MergeResolvers;
}

export interface QueryOptions {
  reload?: boolean;
}

export type BuildRequest = (request: GraphQLOperation) => RequestInit;
export type CacheKey = string;
export type PropertyPath = string | number | Array<string | number>;
export type AthenaClientOptions = Omit<ClientArgs, 'adapter'>;

function defaultBuildRequest(request: GraphQLOperation): RequestInit {
  return {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  };
}

export class AthenaClient {
  private url: string;
  private fetch: typeof fetch;
  private cache: DataEdenCache;
  private getCacheKey: IdFetcher;
  private signalCache: SignalCache;
  private buildRequest: BuildRequest;

  constructor(options: ClientArgs) {
    this.url = options.url;
    this.getCacheKey = options.getCacheKey;
    this.fetch = options.fetch || globalThis.fetch.bind(globalThis);
    this.buildRequest = options.buildRequest || defaultBuildRequest;
    this.signalCache = new SignalCache(
      options.adapter,
      options.getCacheKey,
      options.mergeResolvers,
      options.queryTTL
    );

    const signalCache = this.signalCache;
    this.cache = buildCache({
      hooks: {
        async commit(tx) {
          for await (let entry of tx.localEntries()) {
            const [key, entity] = entry;
            // Entity can also be string | number so we need to make sure it's actually an object here
            if (isEntity(entity)) {
              signalCache.storeEntity(key, entity);
            }
          }
        },
      },
    });
  }

  async query<
    Data extends object = object,
    Variables extends DefaultVariables = DefaultVariables
  >(
    operation: DocumentInput<Data, Variables>,
    variables?: Variables,
    options?: QueryOptions
  ): Promise<OperationResult<Data>> {
    const prepared = prepareOperation<Data, Variables>(operation, variables);
    const result: OperationResult<Data> = {};
    if (!options?.reload) {
      const cachedEntities = this.signalCache.readOperation(prepared);

      if (cachedEntities) {
        result.data = cachedEntities as Data;
        return result;
      }
    }

    return this.makeRequest<Data, Variables>(prepared);
  }

  async mutate<
    Data extends object = object,
    Variables extends DefaultVariables = DefaultVariables
  >(
    operation: DocumentInput<Data, Variables>,
    variables?: Variables
  ): Promise<OperationResult<Data>> {
    const prepared = prepareOperation<Data, Variables>(operation, variables);

    return this.makeRequest<Data, Variables>(prepared);
  }

  private async makeRequest<
    Data extends object = object,
    Variables extends DefaultVariables = DefaultVariables
  >(
    operation: GraphQLOperation<Data, Variables>
  ): Promise<OperationResult<Data>> {
    let response: Response;
    const result: OperationResult<Data> = {};

    try {
      response = await this.fetch(this.url, this.buildRequest(operation));
    } catch (err) {
      result.error = {
        network: err,
      };

      return result;
    }

    const json = (await response.json()) as GraphQLResponse<Data>;

    const { errors, data } = json;

    if (errors !== undefined) {
      result.error = { graphql: errors };
    }

    if (data) {
      result.data = await this.processEntities(data, operation);
    }

    return result;
  }

  async processEntities<Data extends { [key: string]: any }>(
    response: Data,
    operation?: GraphQLOperation<Data>
  ): Promise<Data> {
    const parsedEntitiesList = parseEntities(response);

    // This object maps "root" entities from a graphql docment to the key used to store them in the
    // cache. We will later use this mapping to reconstitute all of the entities and construct
    // the result to pass back to the caller
    const roots = new Map<PropertyPath, CacheKey>();

    /**
     *`parseEntities` returns an array of arrays, where each inner array corresponds to a root
     * entity in a document, and contains the root and all of its children
     * e.g.
     * {
     *   person -> pet1, pet2
     *   car
     * }
     *
     * would result in
     * [
     *   [ pet2, pet1, person],
     *   [ car ]
     * ]
     */
    const tx = await this.cache.beginTransaction();
    for (const parsedEntities of parsedEntitiesList) {
      for (const { parent, prop, entity } of parsedEntities) {
        const key = this.getCacheKey(entity, parent);

        // replace the entity object with the key we're using to store it in the cache so that we can
        // later replace the key with the reactive entity
        // e.g. { pet: { id: 1, name: hitch }} -> { pet: 'pet:1' }
        if (parent && prop) {
          set(parent, prop, createLinkNode(key));
        }

        if (!parent) {
          roots.set(prop, key);
        }

        await tx.merge(key, entity);
      }
    }
    await tx.commit();

    const result = {} as Data;

    for (const [propertyPath, cacheKey] of roots.entries()) {
      set(result, propertyPath, this.signalCache.resolve(cacheKey));
    }

    if (operation) {
      this.signalCache.storeOperation(operation, roots);
    }

    return result;
  }
}

export function createClient(args: ClientArgs): AthenaClient {
  return new AthenaClient(args);
}
