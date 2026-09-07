"use client";

import { useMemo, useSyncExternalStore } from "react";
import { createPersistedSetStore } from "./persistedSetStore";
import { findConflicts, SCREENINGS } from "./schedule";

const planStore = createPersistedSetStore("bkkiff-planer:my-plan");

/** Screening ids the visitor has added to "แผนของฉัน" (My Plan). */
export function usePlannedIds() {
  const ids = useSyncExternalStore(
    planStore.subscribe,
    planStore.getSnapshot,
    planStore.getServerSnapshot,
  );
  return { ids, toggle: planStore.toggle, remove: planStore.remove, clear: planStore.clear };
}

/** My Plan resolved to full Screening objects (sorted), plus which of them clash. */
export function usePlannedScreenings() {
  const { ids, toggle, remove, clear } = usePlannedIds();

  const plannedScreenings = useMemo(() => {
    const byId = new Map(SCREENINGS.map((s) => [s.id, s] as const));
    return Array.from(ids)
      .map((id) => byId.get(id))
      .filter((s): s is NonNullable<typeof s> => Boolean(s))
      .sort((a, b) => (a.date === b.date ? a.time.localeCompare(b.time) : a.date.localeCompare(b.date)));
  }, [ids]);

  const conflicts = useMemo(() => findConflicts(plannedScreenings), [plannedScreenings]);

  return { ids, toggle, remove, clear, plannedScreenings, conflicts };
}
