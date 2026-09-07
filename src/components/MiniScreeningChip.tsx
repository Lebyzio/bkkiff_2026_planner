"use client";

import type { TightTransition } from "@/lib/schedule";
import type { Screening, Venue } from "@/lib/types";

interface MiniScreeningChipProps {
  screening: Screening;
  venue: Venue;
  isPlanned: boolean;
  hasConflict: boolean;
  onToggle: (id: string) => void;
  /** Set when this (unplanned) screening overlaps something already in the plan — blocks selection. */
  lockedBy?: Screening;
  /** Set when picking/keeping this screening leaves little time to reach another venue — a warning, not a block. */
  tightTransition?: TightTransition;
}

export function MiniScreeningChip({
  screening,
  venue,
  isPlanned,
  hasConflict,
  onToggle,
  lockedBy,
  tightTransition,
}: MiniScreeningChipProps) {
  const titleSuffix = screening.note ? (screening.note === "Opening Ceremony" ? " · พิธีเปิด" : " · พิธีปิด") : "";
  const isLocked = !isPlanned && Boolean(lockedBy);
  const showTransitionWarning = !isLocked && Boolean(tightTransition);

  const title = isLocked
    ? `ทับเวลากับ "${lockedBy?.title}" (${lockedBy?.time}) ที่เลือกไว้แล้ว`
    : showTransitionWarning
      ? `เหลือเวลาเปลี่ยนโรงแค่ ${tightTransition?.gapMinutes} นาที ก่อน/หลัง "${tightTransition?.screening.title}" (${tightTransition?.screening.time})`
      : `${screening.time} ${screening.title}${screening.theater ? ` · ${screening.theater}` : ""}${screening.qna ? " · Q&A ผู้กำกับ" : ""}`;

  return (
    <button
      type="button"
      onClick={() => onToggle(screening.id)}
      disabled={isLocked}
      aria-pressed={isPlanned}
      title={title}
      className="transition-standard mb-1 block w-full rounded border px-1.5 py-1 text-left last:mb-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent disabled:cursor-not-allowed"
      style={{
        borderColor: hasConflict ? "var(--color-danger)" : isPlanned ? venue.color : "var(--color-border-soft)",
        backgroundColor: isPlanned ? `${venue.color}26` : "var(--color-bg-ticket)",
        opacity: isLocked ? 0.45 : 1,
      }}
    >
      <span className="flex items-center gap-1">
        <span className="font-mono text-[10px] tabular-nums text-text-muted">{screening.time}</span>
        {screening.qna && (
          <span
            aria-hidden
            className="h-1.5 w-1.5 shrink-0 rounded-full"
            style={{ backgroundColor: "var(--color-qna)" }}
          />
        )}
        {showTransitionWarning && (
          <span aria-hidden className="shrink-0 text-[9px]">
            ⚠
          </span>
        )}
        {isPlanned && (
          <span className="ml-auto shrink-0 text-[10px]" style={{ color: hasConflict ? "var(--color-danger)" : venue.color }}>
            ✓
          </span>
        )}
        {isLocked && <span className="ml-auto shrink-0 text-[10px]">🔒</span>}
      </span>
      <span className="block truncate text-[11px] leading-tight text-text">
        {screening.title}
        {titleSuffix}
      </span>
    </button>
  );
}
