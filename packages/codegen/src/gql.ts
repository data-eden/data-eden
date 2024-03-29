import type { TypedDocumentNode } from '@graphql-typed-document-node/core';

export type Primitive =
  | null
  | undefined
  | string
  | number
  | boolean
  | symbol
  | bigint;

type DefaultVariables = Record<string, object | Primitive> | undefined;

export function gql<
  Data extends object = object,
  Variables extends DefaultVariables = DefaultVariables
>(
  literals: TemplateStringsArray,
  ...args: any[]
): TypedDocumentNode<Data, Variables> {
  throw new Error(
    'This function should never actually be evaluated. Please use the babel plugin.'
  );
}
