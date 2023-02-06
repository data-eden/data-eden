export const EMPTY = [] as const;

export function safeIncrement(x: number) {
  if (x == Number.MAX_SAFE_INTEGER) {
    return 0;
  }

  return x + 1;
}
