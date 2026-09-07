"use client";

import { useEffect, useMemo, useState } from "react";
import { formatDateShort, formatDuration, titleWithYear } from "@/lib/format";
import { downloadPlanIcs } from "@/lib/exportPlanIcs";
import { exportPlanPdf } from "@/lib/exportPlanPdf";
import { buildPlanText } from "@/lib/exportPlanText";
import { findDuplicateTitle, findTightTransition, isSingleScreening, VENUE_BY_ID } from "@/lib/schedule";
import type { Screening } from "@/lib/types";
import { DuplicateTitleBadge } from "./DuplicateTitleBadge";
import { QnaBadge } from "./QnaBadge";
import { SingleScreeningBadge } from "./SingleScreeningBadge";
import { TransitionWarningBadge } from "./TransitionWarningBadge";

interface PlanDrawerProps {
  open: boolean;
  onClose: () => void;
  screenings: Screening[]; // already sorted by date, time
  conflicts: Map<string, string[]>;
  onRemove: (id: string) => void;
  onClear: () => void;
}

export function PlanDrawer({ open, onClose, screenings, conflicts, onRemove, onClear }: PlanDrawerProps) {
  const [exportState, setExportState] = useState<"idle" | "exporting" | "error">("idle");
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const transitionById = useMemo(() => {
    const map = new Map<string, ReturnType<typeof findTightTransition>>();
    for (const s of screenings) map.set(s.id, findTightTransition(s, screenings));
    return map;
  }, [screenings]);

  const duplicateById = useMemo(() => {
    const map = new Map<string, ReturnType<typeof findDuplicateTitle>>();
    for (const s of screenings) map.set(s.id, findDuplicateTitle(s, screenings));
    return map;
  }, [screenings]);

  if (!open) return null;

  const conflictCount = screenings.filter((s) => (conflicts.get(s.id)?.length ?? 0) > 0).length;
  const transitionCount = Array.from(transitionById.values()).filter(Boolean).length;
  const duplicateCount = Array.from(duplicateById.values()).filter(Boolean).length;

  async function handleExport() {
    setExportState("exporting");
    try {
      await exportPlanPdf(screenings, conflicts);
      setExportState("idle");
    } catch (err) {
      console.error("Failed to export plan as PDF", err);
      setExportState("error");
    }
  }

  function handleExportIcs() {
    downloadPlanIcs(screenings);
  }

  async function handleCopyText() {
    const text = buildPlanText(screenings, conflicts);
    try {
      await navigator.clipboard.writeText(text);
      setCopyState("copied");
      setTimeout(() => setCopyState("idle"), 2000);
    } catch (err) {
      console.error("Failed to copy plan as text", err);
      setCopyState("error");
      setTimeout(() => setCopyState("idle"), 2000);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        aria-label="ปิดแผนของฉัน"
        onClick={onClose}
        className="absolute inset-0 bg-black/60"
      />
      <aside className="relative flex h-full w-full max-w-sm flex-col border-l border-border bg-bg-elevated shadow-2xl">
        <div className="flex items-center justify-between border-b border-border-soft px-4 py-4">
          <div>
            <h2 className="font-display text-2xl tracking-wide text-text">แผนของฉัน</h2>
            <p className="text-xs text-text-muted">{screenings.length} รอบฉาย</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="ปิด"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-text-muted hover:text-text"
          >
            ×
          </button>
        </div>

        {conflictCount > 0 && (
          <div
            className="mx-4 mt-3 rounded-md border px-3 py-2 text-xs"
            style={{ borderColor: "var(--color-danger)", color: "var(--color-danger)" }}
          >
            มี {conflictCount} รอบฉายที่เวลาซ้อนกัน — ลองตรวจสอบก่อนไปดูจริง
          </div>
        )}

        {transitionCount > 0 && (
          <div
            className="mx-4 mt-3 rounded-md border px-3 py-2 text-xs"
            style={{ borderColor: "var(--color-warning)", color: "var(--color-warning)" }}
          >
            มี {transitionCount} รอบฉายที่เปลี่ยนโรงกระชั้นชิดเวลา — เผื่อเวลาเดินทางด้วย
          </div>
        )}

        {duplicateCount > 0 && (
          <div
            className="mx-4 mt-3 rounded-md border px-3 py-2 text-xs"
            style={{ borderColor: "var(--color-warning)", color: "var(--color-warning)" }}
          >
            มี {duplicateCount} รอบฉายที่เป็นหนังเรื่องเดียวกันซ้ำในแผน — ถ้าไม่ได้ตั้งใจดูซ้ำ ลองตรวจสอบดูอีกครั้ง
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-4 py-3">
          {screenings.length === 0 ? (
            <p className="mt-8 text-center text-sm text-text-muted">
              ยังไม่ได้เลือกรอบฉายใด — กด “+” บนตั๋วที่อยากดูเพื่อเพิ่มเข้าแผน
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {screenings.map((s) => {
                const venue = VENUE_BY_ID[s.venueId];
                const hasConflict = (conflicts.get(s.id)?.length ?? 0) > 0;
                return (
                  <li
                    key={s.id}
                    className="flex items-start justify-between gap-2 rounded-md border bg-bg-ticket px-3 py-2.5"
                    style={{ borderColor: hasConflict ? "var(--color-danger)" : "var(--color-border-soft)" }}
                  >
                    <div className="min-w-0">
                      <p className="text-xs text-text-muted">
                        {formatDateShort(s.date)} · <span className="font-mono">{s.time}</span>
                      </p>
                      <p className="truncate font-display text-lg leading-tight text-text">
                        {titleWithYear(s.title, s.year)}
                      </p>
                      <p className="mt-0.5 flex items-center gap-1.5 text-xs text-text-muted">
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: venue.color }} />
                        <span className="truncate">
                          {venue.name}
                          {s.theater ? ` · ${s.theater}` : ""} · {formatDuration(s.durationMin)}
                        </span>
                      </p>
                      {(s.qna || isSingleScreening(s.title) || transitionById.get(s.id) || duplicateById.get(s.id)) && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {s.qna && <QnaBadge compact />}
                          {isSingleScreening(s.title) && <SingleScreeningBadge compact />}
                          {transitionById.get(s.id) && (
                            <TransitionWarningBadge transition={transitionById.get(s.id)!} compact />
                          )}
                          {duplicateById.get(s.id) && (
                            <DuplicateTitleBadge duplicate={duplicateById.get(s.id)!} compact />
                          )}
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => onRemove(s.id)}
                      aria-label={`เอา ${s.title} ออกจากแผน`}
                      className="shrink-0 rounded-full border border-border px-2 py-1 text-xs text-text-muted hover:border-danger hover:text-danger"
                    >
                      เอาออก
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {screenings.length > 0 && (
          <div className="flex flex-col gap-2 border-t border-border-soft px-4 py-3">
            <button
              type="button"
              onClick={handleExport}
              disabled={exportState === "exporting"}
              className="transition-standard w-full rounded-md border border-accent bg-accent py-2 text-xs font-semibold text-accent-ink hover:bg-accent/90 disabled:cursor-wait disabled:opacity-70"
            >
              {exportState === "exporting" ? "กำลังสร้าง PDF…" : "ดาวน์โหลดแผนเป็น PDF"}
            </button>
            {exportState === "error" && (
              <p className="text-center text-xs" style={{ color: "var(--color-danger)" }}>
                สร้าง PDF ไม่สำเร็จ ลองอีกครั้ง
              </p>
            )}
            <button
              type="button"
              onClick={handleExportIcs}
              className="transition-standard w-full rounded-md border border-border py-2 text-xs font-semibold text-text hover:border-accent hover:text-accent"
            >
              ดาวน์โหลดเป็นปฏิทิน (.ics)
            </button>
            <button
              type="button"
              onClick={handleCopyText}
              className="transition-standard w-full rounded-md border border-border py-2 text-xs font-semibold text-text hover:border-accent hover:text-accent"
            >
              {copyState === "copied"
                ? "คัดลอกแล้ว!"
                : copyState === "error"
                  ? "คัดลอกไม่สำเร็จ ลองอีกครั้ง"
                  : "คัดลอกแผนเป็นข้อความ"}
            </button>
            <button
              type="button"
              onClick={onClear}
              className="w-full rounded-md border border-border py-2 text-xs text-text-muted hover:border-danger hover:text-danger"
            >
              ล้างแผนทั้งหมด
            </button>
          </div>
        )}
      </aside>
    </div>
  );
}
