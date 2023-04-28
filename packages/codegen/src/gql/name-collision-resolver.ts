import type { DependencyGraph } from './dependency-graph.js';
import type { Definition } from './types.js';

export function resolveNameCollisions(dependencyGraph: DependencyGraph): void {
  const definitionByName = new Map<string, Definition[]>();
  const namesWithCollisions = new Set<string>();
  for (const definition of dependencyGraph.definitions) {
    const name = definition.outputName;

    if (definitionByName.has(name)) {
      namesWithCollisions.add(name);
      definitionByName.get(name)!.push(definition);
    } else {
      definitionByName.set(name, [definition]);
    }
  }

  for (const name of namesWithCollisions) {
    const definitions = definitionByName.get(name)!;
    definitions.sort((def1, def2) =>
      def1.filePath.localeCompare(def2.filePath)
    );
    let fragmentNumber = 0;
    for (const definition of definitions) {
      definition.outputName = `${definition.outputName}_${fragmentNumber++}`;
    }
  }
}
