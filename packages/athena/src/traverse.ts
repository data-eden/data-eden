import type { Entries } from 'type-fest';

export function traverse<T, Key extends keyof T>(
  obj: T,
  predicate: (key: Key, value: T[Key], parent: T) => boolean
) {
  if (typeof obj !== 'object' || obj === null) {
    return;
  }

  (Object.entries(obj) as Entries<typeof obj>).forEach(
    ([key, value]: [Key, T[Key]]) => {
      if (predicate(key, value, obj)) {
        // There has to be a better way to make TS happy here
        traverse(value as T, predicate);
      }
    }
  );
}
