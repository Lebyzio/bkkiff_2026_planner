/**
 * A tiny external store for an arbitrary JSON-serializable value, persisted to
 * localStorage and kept in sync across every component that reads it via
 * useSyncExternalStore (mirrors persistedSetStore.ts, but for plain objects).
 */
export function createPersistedStore<T>(storageKey: string, defaultValue: T) {
  let current: T = defaultValue;
  let hydrated = false;
  const listeners = new Set<() => void>();

  function hydrate() {
    if (hydrated || typeof window === "undefined") return;
    hydrated = true;
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) current = { ...defaultValue, ...JSON.parse(raw) };
    } catch {
      current = defaultValue;
    }
    listeners.forEach((l) => l());
  }

  function subscribe(listener: () => void) {
    hydrate();
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  function getSnapshot(): T {
    hydrate();
    return current;
  }

  function getServerSnapshot(): T {
    return defaultValue;
  }

  function set(next: T | ((prev: T) => T)) {
    current = typeof next === "function" ? (next as (prev: T) => T)(current) : next;
    if (typeof window !== "undefined") {
      window.localStorage.setItem(storageKey, JSON.stringify(current));
    }
    listeners.forEach((l) => l());
  }

  return { subscribe, getSnapshot, getServerSnapshot, set };
}
