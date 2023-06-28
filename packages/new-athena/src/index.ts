import { type DocumentNode, type GraphQLError } from 'graphql';
import type { TypedDocumentNode } from '@graphql-typed-document-node/core';

export type Primitive =
  | null
  | undefined
  | string
  | number
  | boolean
  | symbol
  | bigint;

export type DefaultVariables = Record<string, object | Primitive> | undefined;
export type DefaultRecord = Record<string, object>;

export interface ClientError {
  graphql?: Array<string | GraphQLError>;
  network?: unknown;
}

export interface OperationResult<Data extends object = object> {
  data?: Data;
  error?: ClientError;
}

interface Operation<
  Data extends DefaultRecord = DefaultRecord,
  Variables extends DefaultVariables = DefaultVariables
> {
  type: 'mutation' | 'query' | 'subscription';
  /*
    In the case of:

    query getComments() {
        id
        message
    }

    name would be `getComments` and populated in __meta__ by codegen
  */
  name: string;
  queryId: string;
  querySource?: DocumentNode | TypedDocumentNode<Data, Variables>;
  arguments: Record<string, object | Primitive>;
  result?: OperationResult<Data>;
}

/**
 * raw JSON blob -> normalize -> [ record, links ] -> resolve -> signal blob -> UI
 */

/**
 * resolvers: {
 *  Query: {
 *    comments: pagination()
 *  }
 * }
 */

// export const CreateOnePetDocument = {
//   __meta__: {
//     queryId: '2418fa9c2c9325b1484fd9c96c06a51871c2ca41893ddf3c57c318ae071fe9ec', } }

// {Query: {
//   comments: (op: Operation, oldValue: any, newValue: any) {
//     if(op.queryId === CreateOnePetDocument.__meta__.queryId) {

//     }
//   }
// }

// export type CreateOnePetMutation = {
//   __typename: 'Mutation';
//   createPet: { __typename: 'Pet'; id: string; name: string };
// };

// 12345 -> query getComments() {
//   id
//   message
// }

type Entity = Record<string, any>;

class SignalCache {
  records: Map<string, Entity>;
  links: Map<string, string | Array<string>>;

  store(op: Operation) {
    cache.beginTransaction();
    cache.write(getKey(op), op.result);
    cache.commit();

    for await (let entry of tx.localEntries()) {
      const [key, entity] = entry;
      // Entity can also be string | number so we need to make sure it's actually an object here
      if (isEntity(entity)) {
        signalCache.storeEntity(key, entity, !!tx.context.fetchMore); //op.type
      }
    }
  }

  storeEntity() {}
  resolve(op: Operation | Entity) {}
  evict() {}
}
