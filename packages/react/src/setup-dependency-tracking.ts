import type { WithSignal } from '@data-eden/athena';
import { isSignalProxy, traverse, unwrap } from '@data-eden/athena';
import { Reaction } from '@signalis/core';
import type { MutableRefObject } from 'react';

// Given a reactive entity, this function will traverse the entity and subscribe to all
// the entities within it in order to make sure the component it was called in will react to
// deeply nested changes
export function setupDependencyTracking<Data extends object = object>(
  cb: () => void,
  reactionRef: MutableRefObject<Reaction | undefined>,
  data?: Data
) {
  if (reactionRef.current) {
    return;
  }

  if (data) {
    const reaction = new Reaction(() => {
      cb();
    });

    reaction.trap(() => {
      let foundRoot = false;
      let visited = new WeakSet<WithSignal<any>>();

      traverse(data, (_key, value, _parent) => {
        // In case we have a cycle, we don't want to blow everything up recursing infinitely
        if (visited.has(value)) {
          return false;
        }

        // DFS through the root object and if we find any other signals, we also subscribe
        // to them so that deeply nested updates propagate through to React
        if (isSignalProxy(value)) {
          if (!foundRoot) {
            foundRoot = true;
          }
          visited.add(value);
          unwrap(value);
          return true;
        }

        if (Array.isArray(value)) {
          return true;
        }

        if (!foundRoot) {
          return true;
        }

        return false;
      });
    });

    reactionRef.current = reaction;
    reaction.compute();
  }
}
