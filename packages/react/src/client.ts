import {
  createClient as baseCreateClient,
  type AthenaClient,
  type AthenaClientOptions,
  type ReactiveSignal,
} from '@data-eden/athena';
import { createSignal } from '@signalis/core';

function adapter<T>(v: T): ReactiveSignal<T> {
  return createSignal(v, false);
}

export function createClient(options: AthenaClientOptions): AthenaClient {
  return baseCreateClient({ ...options, adapter });
}
