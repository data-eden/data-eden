import { buildCache } from '@data-eden/cache';
import { set } from 'lodash-es';
import { isEntity, parseEntities } from './parse-entities.js';
import { SignalCache, createLinkNode } from './signal-cache.js';
import type {
  DataEdenCache,
  DataEdenFetch,
  DefaultVariables,
  DocumentInput,
  GraphQLRequest,
  GraphQLResponse,
  IdFetcher,
  OperationResult,
  ReactiveAdapter,
} from './types.js';
import { prepareOperation } from './utils.js';

export interface ClientArgs {
  url: string;
  id: IdFetcher;
  fetch?: typeof fetch;
  adapter: ReactiveAdapter;
}

export type CacheKey = string;
export type PropertyPath = string | number | Array<string | number>;
export type AthenaClientOptions = Omit<ClientArgs, 'adapter'>;

export class AthenaClient {
  private url: string;
  private fetch: DataEdenFetch;
  private cache: DataEdenCache;
  private getId: IdFetcher;
  private signalCache: SignalCache;

  constructor(options: ClientArgs) {
    this.url = options.url;
    this.getId = options.id;
    this.fetch = options.fetch || globalThis.fetch;
    this.signalCache = new SignalCache(options.adapter, options.id);

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
    variables?: Variables
  ): Promise<OperationResult<Data>> {
    const prepared = prepareOperation<Data, Variables>(operation, variables);

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
  >(request: GraphQLRequest<Data, Variables>): Promise<OperationResult<Data>> {
    let response: Response;
    const result: OperationResult<Data> = {};

    try {
      response = await this.fetch(this.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });
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
      result.data = await this.processEntities(data);
    }

    return result;
  }

  async processEntities<Data extends { [key: string]: any }>(
    response: Data
  ): Promise<Data> {
    let fakeRevisionCounter = 0;

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
    for (const parsedEntities of parsedEntitiesList) {
      const tx = await this.cache.beginTransaction();
      for (const { parent, prop, entity } of parsedEntities) {
        const key = this.getId(entity);

        // replace the entity object with the key we're using to store it in the cache so that we can
        // later replace the key with the reactive entity
        // e.g. { pet: { id: 1, name: hitch }} -> { pet: 'pet:1' }
        if (parent && prop) {
          set(parent, prop, createLinkNode(key));
        }

        if (!parent) {
          roots.set(prop, key);
        }

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        await tx.merge(key, { entity, revision: fakeRevisionCounter++ });
      }
      await tx.commit();
    }

    const result = {} as Data;

    for (const [propertyPath, cacheKey] of roots.entries()) {
      set(result, propertyPath, this.signalCache.resolve(cacheKey));
    }

    return result;
  }
}

export function createClient(args: ClientArgs): AthenaClient {
  return new AthenaClient(args);
}
