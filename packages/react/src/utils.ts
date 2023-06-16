export const EMPTY = Object.freeze([]);

export function safeIncrement(x: number) {
  if (x == Number.MAX_SAFE_INTEGER) {
    return 0;
  }

  return x + 1;
}

function isObject(item: unknown): item is Record<string, unknown> {
  return !!(item && typeof item === 'object' && !Array.isArray(item));
}

function isArray(item: unknown): item is Array<unknown> {
  return Array.isArray(item);
}

export function mergeDeep<Data extends object = object>(
  target: unknown,
  source: Data | undefined
) {
  if (!target) {
    return source;
  }

  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach((key) => {
      const targetValue = target[key];
      const sourceValue = source[key];

      if (isObject(sourceValue)) {
        if (!(key in target)) {
          Object.assign(target, { [key]: source[key] });
        } else {
          target[key] = mergeDeep(target[key] || {}, sourceValue);
        }
      } else {
        if (isArray(sourceValue) && isArray(targetValue)) {
          Object.assign(target, { [key]: [...targetValue, ...sourceValue] });
        } else {
          Object.assign(target, { [key]: source[key] });
        }
      }
    });
  }

  return target;
}
