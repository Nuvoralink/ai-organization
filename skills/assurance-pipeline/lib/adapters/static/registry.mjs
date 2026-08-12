/** Stack-parametric registry for deterministic static-analysis adapters. */
import { semgrepAdapter } from './semgrep.mjs';

const adaptersByName = new Map();

export function registerAdapter(adapter) {
  if (!adapter || typeof adapter !== 'object') throw new Error('Static adapter must be an object');
  if (typeof adapter.name !== 'string' || adapter.name.length === 0) throw new Error('Static adapter requires name');
  if (!Array.isArray(adapter.stacks) || adapter.stacks.length === 0) {
    throw new Error(`Static adapter ${adapter.name} requires at least one stack`);
  }
  if (adapter.stacks.some((stack) => typeof stack !== 'string' || stack.length === 0)) {
    throw new Error(`Static adapter ${adapter.name} has an invalid stack`);
  }
  if (typeof adapter.run !== 'function') throw new Error(`Static adapter ${adapter.name} requires run`);
  adaptersByName.set(adapter.name, adapter);
  return adapter;
}

export function getAdaptersForStack(stack) {
  if (typeof stack !== 'string' || stack.length === 0) return [];
  return [...adaptersByName.values()].filter((adapter) => adapter.stacks.includes(stack));
}

registerAdapter(semgrepAdapter);
