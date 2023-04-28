import type { TypedDocumentNode } from '@graphql-typed-document-node/core';
import type { DefaultVariables } from './types.js';

export function graphql<
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
