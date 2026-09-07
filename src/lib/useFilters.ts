"use client";

import { useSyncExternalStore } from "react";
import { createPersistedStore } from "./persistedStore";
import { EMPTY_FILTERS } from "./schedule";
import type { Filters } from "./types";

const filtersStore = createPersistedStore<Filters>("bkkiff-planer:filters", EMPTY_FILTERS);

/** Filter selections persisted to localStorage, hydrated after mount to avoid SSR mismatch. */
export function useFilters() {
  const filters = useSyncExternalStore(
    filtersStore.subscribe,
    filtersStore.getSnapshot,
    filtersStore.getServerSnapshot,
  );

  return {
    filters,
    setFilters: filtersStore.set,
    reset: () => filtersStore.set(EMPTY_FILTERS),
  };
}
