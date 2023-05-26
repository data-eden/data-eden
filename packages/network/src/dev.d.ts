// internal types only, used for local type casting
// should **not** be exported
export type FetchWithDebug = typeof fetch & {
  $debug: {
    creationStack: undefined | string;
    middlewares: Middleware[];
  };
};
