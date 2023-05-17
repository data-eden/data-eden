/* eslint-disable @typescript-eslint/restrict-template-expressions */
import type { Definition, Fragment, UnresolvedFragment } from './types.js';

export type DependencyGraphNode = Definition | UnresolvedFragment;

export class DependencyGraph {
  #fragment = new Set<Fragment>();
  #nodes = new Set<DependencyGraphNode>();
  #outgoingEdges = new Map<DependencyGraphNode, Set<DependencyGraphNode>>();
  #incomingEdges = new Map<DependencyGraphNode, Set<DependencyGraphNode>>();

  addDefinition(node: DependencyGraphNode): void {
    if (node.type === 'fragment') {
      this.#fragment.add(node);
    }
    this.#nodes.add(node);
    this.#outgoingEdges.set(node, new Set<DependencyGraphNode>());
    this.#incomingEdges.set(node, new Set<DependencyGraphNode>());
  }

  addDefinitions(nodes: DependencyGraphNode[]): void {
    for (const node of nodes) {
      this.addDefinition(node);
    }
  }

  get fragments(): Set<Fragment> {
    return this.#fragment;
  }

  get definitions(): Set<DependencyGraphNode> {
    return this.#nodes;
  }

  addDependency(from: DependencyGraphNode, to: DependencyGraphNode): void {
    if (!this.#nodes.has(from)) {
      throw new Error(`Definition ${from} is not in the graph`);
    }

    if (!this.#nodes.has(to)) {
      throw new Error(`Definition ${to} is not in the graph`);
    }

    this.#outgoingEdges.get(from)!.add(to);
    this.#incomingEdges.get(to)!.add(from);
  }
}
