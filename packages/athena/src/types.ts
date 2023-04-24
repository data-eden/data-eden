import type { buildCache } from '@data-eden/cache';
import type { buildFetch } from '@data-eden/network';
import type { SIGNAL } from './signal-proxy.js';
import type { DocumentNode, GraphQLError } from 'graphql';
import type { TypedDocumentNode } from '@graphql-typed-document-node/core';
import type { Primitive } from 'type-fest';

export type DataEdenFetch = ReturnType<typeof buildFetch>;
export type DataEdenCache = ReturnType<typeof buildCache>;

export type DefaultVariables = Record<string, object | Primitive> | undefined;
export type DefaultRecord = Record<string, object>;

export type DocumentInput<
  Data = Record<string, any>,
  Variables = DefaultVariables
> = string | DocumentNode | TypedDocumentNode<Data, Variables>;

export interface ReactiveSignal<T> {
  value: T;
}

export type ReactiveAdapter = <T>(value: T) => ReactiveSignal<T>;

export type WithSignal<T> = T & {
  [SIGNAL]: ReactiveSignal<T>;
};

export type Scalar = string | number | boolean;

export interface GraphQLRequest<
  Data extends object = object,
  Variables = DefaultVariables
> {
  query: DocumentNode | TypedDocumentNode<Data, Variables>;
  variables?: Variables;
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
  prop: PropertyKey | Array<PropertyKey>;
}

export type IdFetcher<T = any> = (v: T) => string;
