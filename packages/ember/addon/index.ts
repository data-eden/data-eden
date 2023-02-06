import {
  createClient as baseCreateClient,
  type AthenaClientOptions,
  type ReactiveSignal,
} from '@data-eden/athena';
import { tracked } from '@glimmer/tracking';

class Wrapper<T> {
  @tracked value: T;

  constructor(value: T) {
    this.value = value;
  }
}

function adapter<T>(value: T): ReactiveSignal<T> {
  return new Wrapper(value);
}

export function createClient(options: AthenaClientOptions) {
  return baseCreateClient({ ...options, adapter });
}
