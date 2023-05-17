import setupDebug from 'debug';

export function enable() {
  setupDebug.enable('@data-eden/codegen:*');
}

export function createDebug(namespace: string) {
  return setupDebug(`@data-eden/codegen:${namespace}`);
}
