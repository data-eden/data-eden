import {
  DocumentNode,
  FieldNode,
  Kind,
  OperationDefinitionNode,
  SelectionNode,
  parse,
  visit,
} from 'graphql';
import { DefaultVariables, DocumentInput } from './types.js';
import { TypedDocumentNode } from '@graphql-typed-document-node/core';

const TYPENAME_FIELD: FieldNode = {
  kind: 'Field' as Kind.FIELD,
  name: {
    kind: 'Name' as Kind.NAME,
    value: '__typename',
  },
};

function isField(selection: SelectionNode): selection is FieldNode {
  return selection.kind === 'Field';
}

// borrowed from https://github.com/apollographql/apollo-client/blob/d9abd26090642303970d252253a21e0f4a5702dd/src/utilities/graphql/transform.ts#L216-L270
export function addTypenameToDocument<
  Data extends object = object,
  Variables extends DefaultVariables = DefaultVariables
>(
  query: DocumentNode | TypedDocumentNode<Data, Variables>
): TypedDocumentNode<Data, Variables> {
  return visit(query, {
    SelectionSet: {
      enter(node, _key, parent) {
        // Don't add __typename to OperationDefinitions.
        if (
          parent &&
          (parent as OperationDefinitionNode).kind === 'OperationDefinition'
        ) {
          return;
        }

        // No changes if no selections.
        const { selections } = node;
        if (!selections) {
          return;
        }

        // If selections already have a __typename, or are part of an
        // introspection query, do nothing.
        const skip = selections.some((selection) => {
          return (
            isField(selection) &&
            (selection.name.value === '__typename' ||
              selection.name.value.lastIndexOf('__', 0) === 0)
          );
        });
        if (skip) {
          return;
        }

        // If this SelectionSet is @export-ed as an input variable, it should
        // not have a __typename field (see issue #4691).
        const field = parent as FieldNode;
        if (
          isField(field) &&
          field.directives &&
          field.directives.some((d) => d.name.value === 'export')
        ) {
          return;
        }

        // Create and return a new SelectionSet with a __typename Field.
        return {
          ...node,
          selections: [...selections, TYPENAME_FIELD],
        };
      },
    },
  });
}

export function prepareQuery<
  Data extends object = object,
  Variables extends DefaultVariables = DefaultVariables
>(
  queryOperation: DocumentInput<Data, Variables>
): TypedDocumentNode<Data, Variables> {
  const parsed =
    typeof queryOperation === 'string' ? parse(queryOperation) : queryOperation;
  const withTypename = addTypenameToDocument<Data, Variables>(parsed);

  return withTypename;
}
