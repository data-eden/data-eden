import {
  type DocumentNode,
  type DefinitionNode,
  type ASTVisitor,
  type InlineFragmentNode,
  visit,
  Kind,
} from 'graphql';

/**
 *
 * @param parentNode - node to inline all fragments into
 * @param document - document containing all fragments
 */
export function inlineAllFragments(
  parentNode: DefinitionNode,
  document: DocumentNode
): DefinitionNode {
  if (
    parentNode.kind !== Kind.FRAGMENT_DEFINITION &&
    parentNode.kind !== Kind.OPERATION_DEFINITION
  ) {
    throw new Error(`${parentNode.kind} is not currently supported to mock`);
  }

  const { name } = parentNode;

  if (!name) {
    throw new Error(
      'Please name operation or fragment, unnamed operations or fragments are not supported.'
    );
  }

  const fragmentNameToNode = new Map<string, InlineFragmentNode>();

  const documentCleaned = visit(document, {
    FragmentDefinition(node) {
      // http://spec.graphql.org/June2018/#sec-Fragment-Name-Uniqueness
      if (fragmentNameToNode.has(node.name.value)) {
        throw new Error(`Fragment ${node.name.value} defined more than once`);
      }

      if (node.name.value !== name.value) {
        fragmentNameToNode.set(node.name.value, {
          kind: Kind.INLINE_FRAGMENT,
          typeCondition: {
            kind: Kind.NAMED_TYPE,
            name: {
              kind: Kind.NAME,
              value: node.typeCondition.name.value,
            },
          },
          selectionSet: node.selectionSet,
        });

        // delete the fragment node
        return null;
      }
    },
  });

  const visitor: ASTVisitor = {
    FragmentSpread: {
      enter(this, node) {
        return fragmentNameToNode.get(node.name.value);
      },
    },
  };

  return visit(documentCleaned, visitor).definitions[0];
}
