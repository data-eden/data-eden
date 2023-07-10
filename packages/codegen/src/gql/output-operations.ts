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
          `Cannot find foreign reference for definition in ${definition.filePath} for ${node.name.value}`
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
  fragments: Set<Fragment>,
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

    visitedSet.add(def);
  }

  return opStr;
}

export function outputOperations(
  dependencyGraph: DependencyGraph
): Array<Types.DocumentFile> {
  const outputStringsByDefinition = new Map<Definition, string>();
  for (let definition of dependencyGraph.definitions) {
    if (definition.type === 'unresolvedFragment') {
      throw new Error(
        `Could not resolve ${definition.exportName} from ${definition.filePath}`
      );
    }

    outputStringsByDefinition.set(
      definition,
      print(replaceForeignReferencesWithOutputName(definition))
    );
  }

  const updatedFragments = new Set<Fragment>();

  // TODO: we need to clean this up. Since we use these fragments later on in the build we need to resolve the foreign refs in them here
  for (let fragment of dependencyGraph.fragments) {
    updatedFragments.add({
      ...fragment,
      ast: {
        ...fragment.ast,
        ...replaceForeignReferencesWithOutputName(fragment),
      } as FragmentDefinitionNode,
    });
  }

  dependencyGraph.fragments.clear();

  // TODO: this needs to be fixed
  for (let fragment of updatedFragments) {
    dependencyGraph.fragments.add(fragment);
  }

  const operations = [...dependencyGraph.definitions].filter(
    (def): def is Operation =>
      def.type === 'operation' || def.type === 'fragment'
  );

  const operationsByFilePath: Record<string, string[]> = {};

  operations.map((operation) => {
    const opStr = generateFinalOperationString(
      dependencyGraph.fragments,
      operation,
      outputStringsByDefinition
    );

    if (!operationsByFilePath[operation.filePath]) {
      operationsByFilePath[operation.filePath] = [];
    }

    operationsByFilePath[operation.filePath].push(opStr);
  });

  return Object.keys(operationsByFilePath).map((filePath) => {
    const opStr = operationsByFilePath[filePath].join('\n');

    return {
      location: filePath,
      rawSDL: opStr,
      document: parse(opStr),
    };
  });
}
