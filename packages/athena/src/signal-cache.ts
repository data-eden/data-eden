import type { Entries } from 'type-fest';
import { createSignalProxy } from './signal-proxy.js';
import { traverse } from './traverse.js';
import type {
  DefaultRecord,
  DefaultVariables,
  Entity,
  IdFetcher,
  ReactiveAdapter,
  Scalar,
  WithSignal,
} from './types.js';
import type {
  DocumentNode,
  FieldNode,
  SelectionNode,
  ValueNode,
  VariableNode,
} from 'graphql';
import { visit } from 'graphql';
import type { TypedDocumentNode } from '@graphql-typed-document-node/core';
import type { Primitive } from 'type-fest';

export type Link = Record<string, string | Array<string>>;

interface LinkNode {
  __link: string;
}
export function createLinkNode(key: string): LinkNode {
  return {
    __link: key,
  };
}

function isLinkNode(v: unknown): v is LinkNode {
  return typeof v === 'object' && v !== null && '__link' in v;
}

interface Payload<
  Data extends DefaultRecord = DefaultRecord,
  Variables extends DefaultVariables = DefaultVariables
> {
  query: DocumentNode | TypedDocumentNode<Data, Variables>;
  variables: Variables;
  result: Array<{ key: string; entity: Entity }>;
}

interface Operation {
  name: string;
  arguments: Record<string, object | Primitive>;
}

function isField(selection: SelectionNode): selection is FieldNode {
  return selection.kind === 'Field';
}

function isVariable(selection: ValueNode): selection is VariableNode {
  return selection.kind === 'Variable';
}

function parseQuery(query: DocumentNode): Array<Operation> {
  const operations: Array<Operation> = [];

  visit(query, {
    OperationDefinition: {
      enter(node, _key, _parent) {
        const selections = node.selectionSet.selections;
        selections.forEach((selection) => {
          if (isField(selection)) {
            const name = selection.name.value;

            const op: Operation = {
              name,
              arguments: {},
            };
            const args = selection.arguments;

            if (args) {
              args.forEach((arg) => {
                const variable = isVariable(arg.value)
                  ? arg.value.name.value
                  : undefined;
                if (variable) {
                  op.arguments[arg.name.value] = variable;
                }
              });
            }

            operations.push(op);
          }
        });
      },
    },
  });

  return operations;
}

function convertOperationToKey(op: Operation) {
  const stringParts: Array<string> = [];
  stringParts.push(op.name);
  stringParts.push('(');

  const entries = Object.entries(op.arguments);
  const len = entries.length;

  Object.entries(op.arguments).forEach(([key, value], idx) => {
    stringParts.push(key);
    stringParts.push(': ');
    stringParts.push(JSON.stringify(value));
    if (idx < len - 1) {
      stringParts.push(', ');
    }
  });

  stringParts.push(')');

  return stringParts.join('');
}

function defaultIdGetter(v: Entity) {
  return `${v.__typename}:${v.id}`;
}

export class SignalCache {
  getId: IdFetcher;
  signalAdapter: ReactiveAdapter;
  queryLinks = new Map<string, Link>();
  links = new Map<string, Link>();
  records = new Map<string, Record<string, Scalar>>();
  signals = new Map<string, WeakRef<WithSignal<Entity>>>();
  private registry: FinalizationRegistry<string>;

  constructor(
    signalAdapter: ReactiveAdapter,
    getId: IdFetcher = defaultIdGetter
  ) {
    this.getId = getId;
    this.signalAdapter = signalAdapter;
    this.registry = new FinalizationRegistry((key) => {
      this.evict(key);
    });
  }

  // Store the results of an entire query. This method will actually the cache the query instance
  // along with all of the entities it resolves
  store({ query, variables, result }: Payload) {
    const operations = parseQuery(query);

    if (variables) {
      operations.forEach((op) => {
        Object.keys(op.arguments).forEach((arg) => {
          op.arguments[arg] = variables[arg];
        });
      });
    }

    const opKeys = operations.map((op) => convertOperationToKey(op));

    opKeys.forEach((opKey, idx) => {
      this.queryLinks.set(opKey, {
        [operations[idx].name]: result[idx].key,
      });
    });

    result.forEach(({ key, entity }) => {
      this.storeEntity(key, entity);
    });
  }

  // Store a single entity by key.
  storeEntity(key: string, entity: Entity) {
    const record = this.records.get(key) || {};
    const links = this.links.get(key) || {};

    (Object.entries(entity) as Entries<typeof entity>).forEach(
      ([entityKey, value]) => {
        if (Array.isArray(value)) {
          const arrayLink: Array<string> = [];
          value.forEach((link) => {
            if (isLinkNode(link)) {
              arrayLink.push(link.__link);
            }
          });
          links[entityKey] = arrayLink;
        } else if (isLinkNode(value)) {
          links[entityKey] = value.__link;
        } else {
          // If value is not an array of links or a link itself, then it must be a scalar
          record[entityKey] = value as Scalar;
        }
      }
    );

    this.links.set(key, links);
    this.records.set(key, record);
  }

  // Given an entity key, this method will fully materialize all of the data for the given entity,
  // wrapping each entity in a signal proxy if it isn't already. If the signal proxy has already
  // been created, this method will ensure the underlying data is updated while maintaining
  // referential stability
  resolve(
    entityKey: string,
    visited: Set<string> = new Set<string>(),
    exploring: Set<string> = new Set<string>()
  ) {
    let root: WithSignal<Entity>;

    const links = this.links.get(entityKey) || this.queryLinks.get(entityKey);

    if (!links) {
      throw new Error(
        `@data-eden/athena - internal error: No entity found for ${entityKey}`
      );
    }

    exploring.add(entityKey);

    const signal = this.getSignal(entityKey);

    if (signal) {
      root = signal;
    } else {
      exploring.delete(entityKey);
      root = createSignalProxy(this.signalAdapter({ id: '', __typename: '' }));
      this.signals.set(entityKey, new WeakRef(root));
      this.registry.register(root, entityKey);
    }

    Object.assign(root, this.records.get(entityKey));

    // These two variables are used to track when we're traversing through an array that we can
    // correctly map the position of the entity in the array
    let ArrayMetadata = new WeakMap<
      Array<string>,
      { key: string; array: Array<Entity> }
    >();
    let parentKey: (string | number) | null = null;
    let parentArray: Array<Entity> | null = null;

    traverse(links, (key, value, parent) => {
      if (Array.isArray(value)) {
        parentKey = key;

        if (!(parentKey in root)) {
          root[parentKey] = [];
        }

        // We know this has to exist because we just checked previously and created it if it was
        // missing
        parentArray = root[parentKey] as Array<Entity>;

        const meta = {
          key: parentKey,
          array: parentArray,
        };

        // We use this to identify when the underlying array in the signal proxy contains links
        // that the entity no longer does (e.g. a mutation has removed an entity from an array
        // of entities). In that case, we make sure to remove the entity from the proxy's array
        // as well
        const toRemove = parentArray.filter((v) => {
          return !value.includes(this.getId(v, root));
        });

        for (let entity of toRemove) {
          const idx = parentArray.findIndex((v) => v === entity);
          if (idx !== -1) {
            parentArray.splice(idx, 1);
          }
        }

        ArrayMetadata.set(value, meta);

        return true;
      }

      if (Array.isArray(parent)) {
        const meta = ArrayMetadata.get(parent);

        if (meta !== undefined) {
          parentKey = meta.key;
          parentArray = meta.array;
        }
      } else {
        parentKey = null;
      }

      exploring.add(value);

      const resolved = this.resolve(value, visited, exploring);
      if (resolved) {
        if (parentArray && typeof parseInt(key) === 'number') {
          // If parentArray exists, then we know we are traversing through an array, so each key
          // is an index number
          parentArray[key as unknown as number] = resolved;
        } else {
          root[key] = resolved;
        }
      }

      exploring.delete(value);
      visited.add(value);

      return true;
    });

    exploring.delete(entityKey);
    visited.add(entityKey);

    return root;
  }

  evict(entityKey: string) {
    this.records.delete(entityKey);
    this.signals.delete(entityKey);
    this.links.delete(entityKey);

    traverse(Object.fromEntries(this.links), (key, value, parent) => {
      if (Array.isArray(value)) {
        const idx = value.findIndex((v) => v === entityKey);
        if (idx !== -1) {
          value.splice(idx, 1);
        }
        // we've already determined whether or not this particular array contains the entity key
        // or not, so there's no reason traverse down this path further
        return false;
      }

      if (typeof value === 'string') {
        if (value === entityKey) {
          delete parent[key];
        }
      }

      return true;
    });
  }

  private getSignal(key: string): WithSignal<Entity> | undefined {
    const ref = this.signals.get(key);

    if (ref === undefined) {
      // In this case, it simply means we haven't create the signal proxy yet
      // and want to signal that to the caller
      return ref;
    }

    const signal = ref.deref();

    if (signal === undefined) {
      // The signal was GC'd but the finalizer hasn't run yet, so we can
      // evict proactively
      this.evict(key);
    }

    return signal;
  }
}
