import * as path from 'node:path';
import type { DependencyGraphNode } from './gql/dependency-graph.js';
import type { Definition, UnresolvedFragment } from './gql/types.js';

export function changeExtension(fileName: string, ext: string): string {
  const parts = path.parse(fileName);

  ext = ext.startsWith('.') ? ext : `.${ext}`;

  return path.format({
    ...parts,
    ext,
    base: undefined,
  });
}

export function resolvedUnresolvedFragment(
  definitions: Set<DependencyGraphNode>,
  unresolvedFragment: UnresolvedFragment
): Definition | undefined {
  return Array.from(definitions).find((potentialDefinitionLocations) => {
    if (
      unresolvedFragment &&
      unresolvedFragment.type === 'unresolvedFragment' &&
      potentialDefinitionLocations.type !== 'unresolvedFragment' &&
      potentialDefinitionLocations.filePath === unresolvedFragment.filePath
    ) {
      return (
        potentialDefinitionLocations.exportName ===
        unresolvedFragment.exportName
      );
    }
  }) as Definition;
}
