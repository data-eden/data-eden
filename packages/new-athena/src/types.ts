import type { TypedDocumentNode } from '@graphql-typed-document-node/core';
import type { DocumentNode, GraphQLError } from 'graphql';

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

export interface LinkNode {
  __link: string;
}

export type CacheKey = string;
export type PropertyPath = string | number | Array<string | number>;

export interface ClientError {
  graphql?: Array<string | GraphQLError>;
  network?: unknown;
}

export interface OperationResult {
  data?: Data;
  error?: ClientError;
}

export interface ParsedEntity {
  entity: Entity;
  parent: Entity | null;
  prop: string | number | Array<string | number>;
  cacheKey: string;
}

export interface Args {
  [name: string]: Scalar | Array<Scalar>;
}

export interface Operation<
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
  args: Args;
  result?: OperationResult;
}

export interface BaseFields {
  id?: string;
  __typename: string;
}

export type Scalar = string | number | boolean | null;

export type DataField = Scalar | Data | Array<Scalar> | Array<Data>;

interface DataFields {
  [fieldName: string]: DataField;
}

export type Data = BaseFields & DataFields;

export type Entity = Data;

export type KeyGetter = (data: Data) => string | null;

export type Link = Record<string, string | Array<string>>;

export type KeyConfig = {
  [typeName: string]: KeyGetter;
};
