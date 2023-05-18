import type { DependencyGraphNode } from './gql/dependency-graph.js';
import type { Definition, UnresolvedFragment } from './gql/types.js';
import { extname, parse, format } from 'node:path';
import { existsSync } from 'fs';

export function changeExtension(fileName: string, ext: string): string {
  const parts = parse(fileName);

  ext = ext.startsWith('.') ? ext : `.${ext}`;

  return format({
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

export function extensionAwareResolver(
  path: string,
  extensions: string[]
): string | undefined {
  const startingExtensionName = extname(path);
  const fileNameWithNoExtension = path.replace(`${startingExtensionName}`, '');

  return (
    extensions
      .map((ext) => {
        const potentialPath = fileNameWithNoExtension + `${ext}`;

        if (existsSync(potentialPath)) {
          return potentialPath;
        }
        return false;
      })
      .filter((path) => path !== false)[0] || undefined
  );
}
