import type { Entries } from 'type-fest';
import { traverse } from './traverse.js';
import type { Entity, ParsedEntity } from './types.js';

// if something is an object with a `__typename` field, it's an Entity as far as we're concerned
export function isEntity(obj: unknown): obj is Entity {
  return typeof obj === 'object' && obj !== null && '__typename' in obj;
}

export function parseEntities<
  Data extends Record<string, object | Array<object>>
>(document: Data): Array<Array<ParsedEntity>> {
  const result: Array<Array<ParsedEntity>> = [];

  // DFS through each top-level element in document.data because it's possible that a gql operation
  // can return sibling entities and we need to treat each of them as root entities for the sake
  // of finding child entities
  (Object.entries(document) as Entries<Data>).forEach(([key, entry]) => {
    if (Array.isArray(entry)) {
      // We cast back to `object` here because `isArray` casts to `any[]`
      const localResult = entry.map((v, idx) => parse([key, idx], v as object));
      result.push(...localResult);
    } else {
      const localResult = parse(key, entry);

      result.push(localResult);
    }
  });

  return result;
}

function parse(
  key: string | number | Array<string | number>,
  entry: object
): Array<ParsedEntity> {
  const result: Array<ParsedEntity> = [];

  // This tracks the property we're in if we are currently traversing through an array
  let currentArrayProp: string | null;
  let ArrayMetadata = new WeakMap<
    Array<Entity>,
    { key: string; parent: Entity }
  >();

  let root: Entity | undefined = undefined;

  if (isEntity(entry)) {
    root = entry;
    result.push({
      entity: entry,
      parent: null,
      prop: key,
    });
  }

  traverse(entry, (key, value, parent) => {
    let parentEntity: Entity | null = null;

    if (isEntity(value)) {
      if (Array.isArray(parent)) {
        // if we're here, it means we're in a hasMany relationship and need to track which property
        // got us here so we can refer back to the property key when linking entities later,
        // e.g. { pets: [ { name: 'hitch', id: 1 }]} will have a prop value of `pets[0]` so we know
        // how to get to it from the parent
        const meta = ArrayMetadata.get(parent as Array<Entity>) || null;
        if (meta) {
          currentArrayProp = meta.key;
          parentEntity = meta.parent;
        }
      } else {
        if (isEntity(parent)) {
          parentEntity = parent;
        }
        currentArrayProp = null;
      }

      if (result.length === 0) {
        // if the result array is empty, then this is the first entity we've found, and is therefore
        // the root entity, so we special-case it and set the parent and prop
        result.push({
          entity: value,
          parent: null,
          prop: key,
        });
      } else {
        result.push({
          entity: value,
          parent: parentEntity,
          prop: currentArrayProp ? [currentArrayProp, key] : key,
        });
      }

      return true;
    }

    if (Array.isArray(value)) {
      if (!Array.isArray(parent) && isEntity(parent)) {
        // If we've arrived here, we know that we're traversing through an array of entities
        // because the parent is an entity and the current value is an array
        ArrayMetadata.set(value as Array<Entity>, {
          parent,
          key,
        });
      }
      return true;
    }

    // If we haven't found the root yet, just keep digging
    if (root === undefined) {
      return true;
    }

    return false;
  });

  return result.reverse();
}
