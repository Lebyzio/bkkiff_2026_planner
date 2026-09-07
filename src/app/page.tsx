"use client";

import { useMemo } from "react";
import { DaySection } from "@/components/DaySection";
import { FilterBar } from "@/components/FilterBar";
import { formatDuration } from "@/lib/format";
import { allMovieTitles, filterScreenings, groupByDate, SCREENINGS } from "@/lib/schedule";
import { useFilters } from "@/lib/useFilters";
import { usePlannedScreenings } from "@/lib/usePlan";

export default function CreatePlanPage() {
  const { filters, setFilters, reset } = useFilters();
  const { ids: plannedIds, toggle, plannedScreenings, conflicts } = usePlannedScreenings();

  const allTitles = useMemo(() => allMovieTitles(), []);

  const filtered = useMemo(
    () => filterScreenings(SCREENINGS, filters, plannedIds),
    [filters, plannedIds],
  );
  const dayGroups = useMemo(() => groupByDate(filtered), [filtered]);

  const totalPlannedMinutes = plannedScreenings.reduce((sum, s) => sum + (s.durationMin ?? 0), 0);

  return (
    <div className="flex flex-col">
      <FilterBar
        filters={filters}
        setFilters={setFilters}
        allTitles={allTitles}
        resultCount={filtered.length}
        onReset={reset}
      />

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 py-6 sm:px-6">
        {dayGroups.length === 0 ? (
          <div className="mt-16 text-center">
            <p className="font-display text-2xl text-text-muted">ไม่พบรอบฉายตามตัวกรองนี้</p>
            <p className="mt-2 text-sm text-text-muted">ลองปรับตัวกรองโรงหนัง เวลา หรือชื่อหนังดูอีกครั้ง</p>
          </div>
        ) : (
          dayGroups.map((group) => (
            <DaySection
              key={group.date}
              date={group.date}
              screenings={group.screenings}
              plannedIds={plannedIds}
              plannedScreenings={plannedScreenings}
              conflicts={conflicts}
              onTogglePlan={toggle}
            />
          ))
        )}
      </main>

      <footer className="border-t border-border-soft px-4 py-4 text-center text-xs text-text-muted sm:px-6">
        {plannedScreenings.length > 0 ? (
          <>
            แผนของฉัน: {plannedScreenings.length} รอบฉาย · รวม {formatDuration(totalPlannedMinutes)}
          </>
        ) : (
          "ข้อมูลตารางฉายจาก BKKIFF 2026 (อัพเดตเมื่อวันที่ 7 กันยายน 2569 เวลา 23:00 น.) - Lebyzio"
        )}
      </footer>
    </div>
  );
}
