import type { buildCache } from '@data-eden/cache';
import type { SIGNAL } from './signal-proxy.js';
import type { GraphQLError } from 'graphql';
import type { TypedDocumentNode } from '@graphql-typed-document-node/core';
import type { Primitive } from 'type-fest';
import type { CodegenDocument } from '@data-eden/codegen';

export type DataEdenCache = ReturnType<typeof buildCache>;

export type DefaultVariables = Record<string, object | Primitive> | undefined;
export type DefaultRecord = Record<string, object>;

export type DocumentInput<
  Data = Record<string, any>,
  Variables = DefaultVariables
> = TypedDocumentNode<Data, Variables> & {
  __meta__?: CodegenDocument;
};
export interface ReactiveSignal<T> {
  value: T;
}

export type ReactiveAdapter = <T>(value: T) => ReactiveSignal<T>;

export type WithSignal<T> = T & {
  [SIGNAL]: ReactiveSignal<T>;
};

export type Scalar = string | number | boolean;

export interface GraphQLOperation<
  Data extends object = object,
  Variables = DefaultVariables
> {
  query?: DocumentInput<Data, Variables>;
  variables?: Variables;
  extensions?: {
    persistedQuery?: {
      version: number;
      sha256Hash: string;
    };
  };
  fetchMore?: boolean | undefined;
}

export interface GraphQLResponse<Data extends object = object> {
  data?: Data;
  errors?: Array<string | GraphQLError>;
}

export interface ClientError {
  graphql?: Array<string | GraphQLError>;
  network?: unknown;
}
export interface OperationResult<Data extends object = object> {
  data?: Data;
  error?: ClientError;
}

export type Entity<T extends object = Record<string, any>> = T & {
  id: string;
  __typename: string;
};

export interface ParsedEntity {
  entity: Entity;
  parent: Entity | null;
  prop: string | number | Array<string | number>;
}

export type IdFetcher<T = any> = (v: T) => string | undefined;
export type SyntheticIdFetcher = (
  parsedEntity: ParsedEntity,
  getCacheKey: IdFetcher
) => string;
