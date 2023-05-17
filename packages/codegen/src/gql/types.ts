import type {
  OperationDefinitionNode,
  NameNode,
  FragmentDefinitionNode,
} from 'graphql';

export interface UnresolvedFragment {
  location: string;
  filePath: string;
  exportName: string;
  isExternal: boolean;
  type: 'unresolvedFragment';
}

interface BaseDefinition {
  filePath: string;
  foreignReferences: Map<string, Fragment | UnresolvedFragment>;
  exportName?: string;
  outputName: string;
  loc?: {
    start: {
      line: number;
      column: number;
    };
    end: {
      line: number;
      column: number;
    };
  } | null;
}

export type OperationDefinitionNodeWithName = OperationDefinitionNode & {
  name: NameNode;
};

export interface Fragment extends BaseDefinition {
  ast: FragmentDefinitionNode;
  type: 'fragment';
}

export interface Operation extends BaseDefinition {
  ast: OperationDefinitionNodeWithName;
  type: 'operation';
}

export type Definition = Fragment | Operation;

export interface ExtractedDefinitions {
  definitions: Definition[];
  exportedDefinitionMap: Map<string, Definition | UnresolvedFragment>;
}
