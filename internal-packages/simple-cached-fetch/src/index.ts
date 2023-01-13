import { buildFetch } from '@data-eden/network';
import { buildCache } from '@data-eden/cache';

async function loggerMiddleware(
  request: Request,
  next: (request: Request) => Promise<Response>
): Promise<Response> {
  console.log('request happening!');
  return next(request);
}

function getUrl(input: RequestInfo | URL): string {
  if (typeof input === 'string') {
    return input;
  }

  if ('url' in input) {
    return input.url;
  }

  return input.toString();
}

type Signal = object;
function buildSignal(key:string, value: object): Signal {
  // TODO: wtf is this?
  return value;
}

export function buildCachedFetch() {
  const fetch = buildFetch([loggerMiddleware]);
  const cache = buildCache();

  // TODO: make this not "leak"
  let signals = new Map<string, Signal>();

  return async function (input: RequestInfo | URL, init?: RequestInit | undefined) {
    const key = getUrl(input);

    // assume "fetch first" (could have an option for "cache first", but that is orthogonal to testing reactivity)
    const response = await fetch(input, init)
    const json = await response.json() as object;

    const tx = await cache.beginTransaction();
    tx.set(key, json);
    await tx.commit();

    const cacheResult = await cache.get(key);

    if (cacheResult === undefined) {
      throw new Error('INTERNAL ERROR: cache.set + cache.get resulted in undefined');
    }

    let signal = signals.get(key);
    if (signal === undefined) {
      signal = buildSignal(key, cacheResult);
    }

    return signal;
  };
}
