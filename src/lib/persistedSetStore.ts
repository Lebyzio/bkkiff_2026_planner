/**
 * A tiny external store for a Set<string> persisted to localStorage and kept
 * in sync across every component that reads it via useSyncExternalStore.
 * Plain module state (not React Context) so toggling a ticket in one part of
 * the tree is reflected everywhere else without prop drilling.
 */
const EMPTY_SET: ReadonlySet<string> = new Set();

export function createPersistedSetStore(storageKey: string) {
  let current: ReadonlySet<string> = EMPTY_SET;
  let hydrated = false;
  const listeners = new Set<() => void>();

  function readFromStorage(): Set<string> {
    if (typeof window === "undefined") return new Set();
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) return new Set();
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? new Set(parsed) : new Set();
    } catch {
      return new Set();
    }
  }

  function hydrate() {
    if (hydrated || typeof window === "undefined") return;
    hydrated = true;
    current = readFromStorage();
    listeners.forEach((l) => l());
  }

  function persist() {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(storageKey, JSON.stringify(Array.from(current)));
  }

  function subscribe(listener: () => void) {
    hydrate();
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  function getSnapshot(): ReadonlySet<string> {
    hydrate();
    return current;
  }

  function getServerSnapshot(): ReadonlySet<string> {
    return EMPTY_SET;
  }

  function set(next: Set<string>) {
    current = next;
    persist();
    listeners.forEach((l) => l());
  }

  function toggle(id: string) {
    const next = new Set(current);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    set(next);
  }

  function remove(id: string) {
    if (!current.has(id)) return;
    const next = new Set(current);
    next.delete(id);
    set(next);
  }

  function clear() {
    set(new Set());
  }

  return { subscribe, getSnapshot, getServerSnapshot, toggle, remove, clear };
}
