/* eslint-disable @typescript-eslint/restrict-template-expressions */
import type { Definition } from './types.js';

export class DependencyGraph {
  #nodes = new Set<Definition>();
  #outgoingEdges = new Map<Definition, Set<Definition>>();
  #incomingEdges = new Map<Definition, Set<Definition>>();

  addDefinition(node: Definition): void {
    this.#nodes.add(node);
    this.#outgoingEdges.set(node, new Set<Definition>());
    this.#incomingEdges.set(node, new Set<Definition>());
  }

  addDefinitions(nodes: Definition[]): void {
    for (const node of nodes) {
      this.addDefinition(node);
    }
  }

  get definitions(): Set<Definition> {
    return this.#nodes;
  }

  addDependency(from: Definition, to: Definition): void {
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
