/* eslint-disable @typescript-eslint/restrict-template-expressions */
import {
  GraphQLError,
  type GraphQLSchema,
  Kind,
  doTypesOverlap,
  isCompositeType,
  typeFromAST,
  validate,
  type ValidationContext,
  type ValidationRule,
} from 'graphql';
// import { validate, type ValidationRule } from 'graphql/validation/index.js';
import { dirname, join, relative, resolve } from 'path';
import { cwd } from 'process';
import { DependencyGraph } from './dependency-graph.js';
import type {
  ExtractedDefinitions,
  Fragment,
  UnresolvedFragment,
} from './types.js';
import { resolvedUnresolvedFragment } from '../utils.js';

function PossibleFragmentSpreadRules(
  foreignReferences: Map<string, Fragment | UnresolvedFragment>
): ValidationRule {
  return (context: ValidationContext) => {
    return {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      FragmentSpread(node) {
        const fragName = node.name.value;
        const frag = foreignReferences.get(fragName);
        if (!frag || frag.type !== 'fragment') {
          return;
        }

        const fragmentType = typeFromAST(
          context.getSchema(),
          frag.ast.typeCondition
        );
        if (!fragmentType) {
          return;
        }

        const parentType = context.getParentType();
        if (
          parentType &&
          isCompositeType(fragmentType) &&
          !doTypesOverlap(context.getSchema(), fragmentType, parentType)
        ) {
          context.reportError(
            new GraphQLError(
              `Fragment "${frag.outputName}" cannot be spread here as objects of type "${parentType}" can never be of type "${fragmentType}".`,
              { nodes: node }
            )
          );
        }
      },
    };
  };
}

export function resolveForeignReferences(
  projectDefinitions: Map<string, ExtractedDefinitions>,
  moduleAliasMap: Record<string, string> = {},
  schema: GraphQLSchema
): DependencyGraph {
  const aliasKeys = Object.keys(moduleAliasMap);
  const dependencyGraph = new DependencyGraph();
  for (const [, { definitions }] of projectDefinitions.entries()) {
    dependencyGraph.addDefinitions(definitions);
  }

  for (const definition of dependencyGraph.definitions) {
    if (definition.type === 'unresolvedFragment') {
      continue;
    }

    for (const [
      placeholder,
      foreignReference,
    ] of definition.foreignReferences.entries()) {
      if (foreignReference.type !== 'unresolvedFragment') {
        dependencyGraph.addDependency(definition, foreignReference);
        continue;
      }

      const { location, exportName } = foreignReference;
      const aliasKey = aliasKeys.find((key) => location.startsWith(key));
      let foreignFilePath = resolve(dirname(definition.filePath), location);
      if (aliasKey) {
        foreignFilePath = location.replace(aliasKey, moduleAliasMap[aliasKey]!);
      }

      const foreignDefinitionMap =
        projectDefinitions.get(foreignFilePath) ||
        projectDefinitions.get(foreignFilePath + '.ts') ||
        projectDefinitions.get(foreignFilePath + '.tsx') ||
        projectDefinitions.get(join(foreignFilePath, 'index.ts')) ||
        projectDefinitions.get(join(foreignFilePath, 'index.tsx')) ||
        projectDefinitions.get(definition.filePath) ||
        projectDefinitions.get(definition.filePath + '.ts') ||
        projectDefinitions.get(definition.filePath + '.tsx') ||
        projectDefinitions.get(join(definition.filePath, 'index.ts')) ||
        projectDefinitions.get(join(definition.filePath, 'index.tsx'));

      if (!foreignDefinitionMap) {
        throw new Error(
          `Could not find ${foreignFilePath} in project or it doesn't contain any graphql definitions`
        );
      }

      let foreignDefinition =
        foreignDefinitionMap.exportedDefinitionMap.get(exportName);

      if (!foreignDefinition) {
        throw new Error(
          `Could not find an exported definition at ${exportName} in ${definition.filePath}`
        );
      }

      if (
        foreignDefinition &&
        foreignDefinition.type === 'unresolvedFragment'
      ) {
        const oldforeignDefinition = foreignDefinition;
        foreignDefinition = resolvedUnresolvedFragment(
          dependencyGraph.definitions,
          foreignDefinition
        );

        if (!foreignDefinition) {
          throw new Error(
            `Foreign operation reference failed to resolve for ${oldforeignDefinition.exportName} at ${definition.ast.name} in ${definition.filePath} is unresolveable`
          );
        }
      }

      if (!foreignDefinition) {
        throw new Error(
          `Foreign operation reference at ${definition.ast.name} in ${definition.filePath} is unresolveable`
        );
      }

      if (foreignDefinition.type !== 'fragment') {
        throw new Error(
          `Foreign operation reference found at ${definition.ast.name} in ${definition.filePath}`
        );
      }

      definition.foreignReferences.set(placeholder, foreignDefinition);
      // we want to make sure we have the placeholder and also the resolved value
      definition.foreignReferences.set(
        foreignDefinition.outputName,
        foreignDefinition
      );
      dependencyGraph.addDependency(definition, foreignDefinition);
    }
    const errors = validate(
      schema,
      { kind: Kind.DOCUMENT, definitions: [definition.ast] },
      [PossibleFragmentSpreadRules(definition.foreignReferences)]
    );

    if (errors.length > 0) {
      const errorMessageHeader = `in graphql query at ${relative(
        cwd(),
        definition.filePath
      )} ${definition.loc?.start.line}:${definition.loc?.start.column}\n`;
      throw new Error(
        errorMessageHeader + errors.map((error) => error.message).join('\n')
      );
    }
  }

  return dependencyGraph;
}
