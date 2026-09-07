"use client";

import { useState, type ReactNode } from "react";
import { usePlannedScreenings } from "@/lib/usePlan";
import { Header } from "./Header";
import { PlanDrawer } from "./PlanDrawer";
import { TabNav } from "./TabNav";

export function AppShell({ children }: { children: ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { plannedScreenings, conflicts, remove, clear } = usePlannedScreenings();

  return (
    <div className="flex min-h-full flex-col">
      <Header plannedCount={plannedScreenings.length} onOpenPlan={() => setDrawerOpen(true)} />
      <TabNav />
      <div className="flex-1">{children}</div>

      <PlanDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        screenings={plannedScreenings}
        conflicts={conflicts}
        onRemove={remove}
        onClear={clear}
      />
    </div>
  );
}
