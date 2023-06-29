import type { Args, Data, Entity, LinkNode, Operation } from './types.js';

export function keyForQuery(queryId: string, variables?: Args) {
  return `query:${
    variables ? `${queryId}(${JSON.stringify(variables)})` : queryId
  }`;
}

export function isEntity(obj: unknown): obj is Entity {
  return typeof obj === 'object' && obj !== null && '__typename' in obj;
}

export function isQuery(result: Data) {
  return result.__typename === 'Query';
}

export function createLinkNode(key: string): LinkNode {
  return {
    __link: key,
  };
}

export function isOperation(operation: unknown): operation is Operation {
  return (
    typeof operation === 'object' &&
    operation !== null &&
    'type' in operation &&
    'name' in operation &&
    'queryId' in operation
  );
}

export function isLinkNode(v: unknown): v is LinkNode {
  return typeof v === 'object' && v !== null && '__link' in v;
}
