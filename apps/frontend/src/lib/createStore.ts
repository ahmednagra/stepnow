// apps/frontend/src/lib/createStore.ts
// Minimal reactive store on React's built-in useSyncExternalStore — no third-party
// state lib. Mirrors the slice of the zustand API the stores in src/stores/ use:
// a hook with optional selector, plus imperative getState/setState/subscribe.
"use client";

import { useSyncExternalStore } from "react";

type SetState<T> = (patch: Partial<T> | ((prev: T) => Partial<T>)) => void;

export type StoreHook<T> = {
  <U>(selector: (state: T) => U): U;
  (): T;
  getState: () => T;
  setState: SetState<T>;
  subscribe: (listener: () => void) => () => void;
};

export function createStore<T extends object>(initializer: (set: SetState<T>, get: () => T) => T): StoreHook<T> {
  let state: T;
  const listeners = new Set<() => void>();
  const getState = () => state;
  const setState: SetState<T> = (patch) => {
    state = { ...state, ...(typeof patch === "function" ? patch(state) : patch) };
    listeners.forEach((l) => l());
  };
  const subscribe = (listener: () => void) => {
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  };
  state = initializer(setState, getState);
  const serverState = state; // frozen pre-hydration snapshot for SSR / first client render

  function useStore<U>(selector?: (s: T) => U) {
    const sel = selector ?? ((s: T) => s as unknown as U);
    return useSyncExternalStore(subscribe, () => sel(state), () => sel(serverState));
  }
  const hook = useStore as unknown as StoreHook<T>;
  hook.getState = getState;
  hook.setState = setState;
  hook.subscribe = subscribe;
  return hook;
}
