import type { ReactiveSignal, WithSignal } from './types.js';

export const SIGNAL = Symbol('data-eden-signal');

export function unwrap<T>(v: WithSignal<T>): T {
  return v[SIGNAL].value;
}

export function isSignalProxy(v: unknown): v is WithSignal<unknown> {
  return typeof v === 'object' && v !== null && SIGNAL in v;
}

export class SignalProxy<T extends object>
  implements ProxyHandler<ReactiveSignal<T>>
{
  get(target: ReactiveSignal<T>, prop: PropertyKey) {
    // this is an escape hatch let us actually access the underlying signal, typically inside of
    // the framework integration libraries
    if (prop === SIGNAL) {
      return target;
    }
    const value = target.value;
    const result = Reflect.get(value, prop);
    return result;
  }

  has(target: ReactiveSignal<T>, p: string | symbol): boolean {
    const innerValue = target.value;
    if (p === SIGNAL) {
      return true;
    }
    return Reflect.has(innerValue, p);
  }

  ownKeys(target: ReactiveSignal<T>): ArrayLike<string | symbol> {
    const innerValue = target.value;
    return Reflect.ownKeys(innerValue);
  }

  getOwnPropertyDescriptor(
    target: ReactiveSignal<T>,
    p: string | symbol
  ): PropertyDescriptor | undefined {
    const innerValue = target.value;

    return Reflect.getOwnPropertyDescriptor(innerValue, p);
  }

  set(target: ReactiveSignal<T>, prop: PropertyKey, value: unknown) {
    const innerValue = target.value;
    const result = Reflect.set(innerValue, prop, value);
    target.value = innerValue;
    return result;
  }
}

export function createSignalProxy<T extends object>(
  v: ReactiveSignal<T>
): WithSignal<T> {
  return new Proxy(v, new SignalProxy()) as unknown as WithSignal<T>;
}
