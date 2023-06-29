import type { Entity, KeyGetter, ParsedEntity } from './index.js';
import { traverse } from './traverse.js';
import { isEntity } from './utils.js';

// DFS through each top-level element in document.data because it's possible that a gql operation
// can return sibling entities and we need to treat each of them as root entities for the sake
// of finding child entities
export function parse(entity: Entity, getKey: KeyGetter): Array<ParsedEntity> {
  const result: Array<ParsedEntity> = [];

  // This tracks the property we're in if we are currently traversing through an array
  let currentArrayProp: string | null;
  let ArrayMetadata = new WeakMap<
    Array<Entity>,
    { key: string; parent: Entity }
  >();

  let root: Entity | undefined = undefined;

  // This is the root level operation
  if (isEntity(entity)) {
    const cacheKey = getKey(entity);
    if (!cacheKey) {
      throw new Error(
        `@data-eden/athena: We couldn't find a key for ${entity.__typename} and could not generate a synthetic one since this is a top level object. Provide a key generator in \`keys\` for ${entity.__typename}.`
      );
    }

    root = entity;
    result.push({
      cacheKey: cacheKey,
      entity: entity,
      parent: null,
      prop: entity.__typename,
    });
  }

  traverse(entity, (key, value, parent) => {
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
        } else {
          parentEntity = null;
        }
        currentArrayProp = null;
      }

      if (result.length === 0) {
        const entityId = getKey(value);

        if (!entityId) {
          throw new Error(
            `@data-eden/athena: We couldn't find a key for ${value.__typename} and could not generate a synthetic one since this is a top level object. Provide a key generator in \`keys\` for ${value.__typename}.`
          );
        }

        // if the result array is empty, then this is the first entity we've found, and is therefore
        // the root entity, so we special-case it and set the parent and prop
        result.push({
          cacheKey: entityId,
          entity: value,
          parent: null,
          prop: key,
        });
      } else {
        const prop = currentArrayProp ? [currentArrayProp, key] : key;

        let entityId = getKey(value);

        // If we can pull a key off the entity itself, we go with that and move on
        if (entityId) {
          result.push({
            cacheKey: entityId,
            entity: value,
            parent: parentEntity,
            prop,
          });
        } else if (parentEntity) {
          // If we can't generate a key from the entity itself, we check to see if the parent exists. If it does,
          // this means we're working with an embedded type and therefore need to derive a synthetic key using
          // the parent's key
          const parentId = getKey(parentEntity);

          if (!parentId) {
            throw new Error(
              `@data-eden/athena: Unable to generate a key for embedded type ${value.__typename}. All embedded types must belong to a non-embedded type.`
            );
          }

          if (parentId) {
            result.push({
              cacheKey: `${parentId}.${
                currentArrayProp ? `${currentArrayProp}.${key}` : key
              }`,
              entity: value,
              parent: parentEntity,
              prop,
            });
          } else {
            throw new Error(
              `@data-eden/athena: Unable to generate a key for ${value.__typename}. Please provide a key generator in \`keys\`.`
            );
          }
        }
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
