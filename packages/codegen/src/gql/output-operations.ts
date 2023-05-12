import { parse, print, visit } from 'graphql';
import type { FragmentDefinitionNode } from 'graphql/language/index.js';
import type { Types } from '@graphql-codegen/plugin-helpers';

import type { DependencyGraph } from './dependency-graph.js';
import type {
  Definition,
  Fragment,
  Operation,
  OperationDefinitionNodeWithName,
} from './types.js';

function replaceForeignReferencesWithOutputName(
  definition: Definition
): FragmentDefinitionNode | OperationDefinitionNodeWithName {
  return visit(definition.ast, {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    FragmentDefinition(node) {
      if (node === definition.ast) {
        return {
          ...node,
          name: {
            ...node.name,
            value: definition.outputName,
          },
        };
      }
    },

    // eslint-disable-next-line @typescript-eslint/naming-convention
    OperationDefinition(node) {
      if (node === definition.ast) {
        return {
          ...node,
          name: {
            ...node.name,
            value: definition.outputName,
          },
        };
      }
    },

    // eslint-disable-next-line @typescript-eslint/naming-convention
    FragmentSpread(node) {
      const foreignRef = definition.foreignReferences.get(node.name.value);
      if (!foreignRef) {
        throw new Error(
          `Cannot find foreign reference for definition in ${definition.filePath}`
        );
      }
      if (foreignRef.type !== 'fragment') {
        throw new Error(
          `Unexpected foreign reference type: ${foreignRef.type} found at definition in ${definition.filePath}`
        );
      }

      return {
        ...node,
        name: {
          ...node.name,
          value: foreignRef.outputName,
        },
      };
    },
  });
}

function generateFinalOperationString(
  operation: Operation,
  outputStringsByDefinition: Map<Definition, string>
): string {
  const visitedSet = new Set<Definition>();
  const visitQueue: Definition[] = [operation];
  let opStr = '';

  while (visitQueue.length > 0) {
    const def = visitQueue.shift()!;
    if (visitedSet.has(def)) {
      continue;
    }
    opStr = outputStringsByDefinition.get(def)! + '\n\n' + opStr;
    visitQueue.push(
      ...(def.foreignReferences.values() as IterableIterator<Fragment>)
    );
    visitedSet.add(def);
  }

  return opStr;
}

export function outputOperations(
  dependencyGraph: DependencyGraph
): Array<Types.DocumentFile> {
  const outputStringsByDefinition = new Map<Definition, string>();
  for (const definition of dependencyGraph.definitions) {
    outputStringsByDefinition.set(
      definition,
      print(replaceForeignReferencesWithOutputName(definition))
    );
  }

  const operations = [...dependencyGraph.definitions].filter(
    (def): def is Operation => def.type === 'operation'
  );

  return operations.map((operation) => {
    const opStr = generateFinalOperationString(
      operation,
      outputStringsByDefinition
    );

    return {
      location: operation.filePath,
      rawSDL: opStr,
      document: parse(opStr),
    };
  });
}
