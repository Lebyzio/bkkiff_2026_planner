"use client";

import { formatDuration } from "@/lib/format";
import type { TightTransition } from "@/lib/schedule";
import type { Screening, Venue } from "@/lib/types";
import { QnaBadge } from "./QnaBadge";
import { TransitionWarningBadge } from "./TransitionWarningBadge";

interface ScreeningTicketProps {
  screening: Screening;
  venue: Venue;
  isPlanned: boolean;
  onTogglePlan: (id: string) => void;
  conflictCount?: number;
  /** Set when this (unplanned) screening overlaps something already in the plan — blocks selection. */
  lockedBy?: Screening;
  /** Set when picking/keeping this screening leaves little time to reach another venue — a warning, not a block. */
  tightTransition?: TightTransition;
}

export function ScreeningTicket({
  screening,
  venue,
  isPlanned,
  onTogglePlan,
  conflictCount = 0,
  lockedBy,
  tightTransition,
}: ScreeningTicketProps) {
  const hasConflict = isPlanned && conflictCount > 0;
  const isLocked = !isPlanned && Boolean(lockedBy);

  return (
    <div
      className="transition-standard flex min-w-0 overflow-hidden rounded-lg border bg-bg-ticket"
      style={{
        borderColor: hasConflict ? "var(--color-danger)" : isPlanned ? venue.color : "var(--color-border-soft)",
        boxShadow: isPlanned ? `0 0 0 1px ${hasConflict ? "var(--color-danger)" : venue.color}` : undefined,
        opacity: isLocked ? 0.55 : 1,
      }}
    >
      {/* Time stub */}
      <div
        className="flex w-20 shrink-0 flex-col items-center justify-center gap-0.5 py-3"
        style={{ backgroundColor: `${venue.color}1a` }}
      >
        <span className="font-mono text-lg font-medium tabular-nums text-text">{screening.time}</span>
        {screening.endTime && (
          <span className="font-mono text-[11px] text-text-muted tabular-nums">
            –{screening.endTime}
          </span>
        )}
      </div>

      <div className="ticket-perforation flex flex-1 items-center justify-between gap-3 px-4 py-3">
        <div className="min-w-0">
          <p className="line-clamp-2 min-h-[3.5rem] font-display text-xl leading-7 tracking-wide text-text">
            {screening.title}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-text-muted">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: venue.color }} />
              {venue.name}
            </span>
            {screening.theater && <span>· {screening.theater}</span>}
            <span>· {formatDuration(screening.durationMin)}</span>
          </div>
          {(screening.qna || screening.note || hasConflict || (!isLocked && tightTransition)) && (
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {screening.note && (
                <span className="rounded-full bg-accent px-2 py-0.5 text-[11px] font-medium text-accent-ink">
                  {screening.note === "Opening Ceremony" ? "พิธีเปิด" : "พิธีปิด"}
                </span>
              )}
              {screening.qna && <QnaBadge />}
              {hasConflict && (
                <span
                  className="rounded-full px-2 py-0.5 text-[11px] font-medium"
                  style={{ backgroundColor: "var(--color-danger)", color: "#1c0805" }}
                >
                  เวลาซ้อนกัน
                </span>
              )}
              {!isLocked && tightTransition && <TransitionWarningBadge transition={tightTransition} />}
            </div>
          )}
          {isLocked && lockedBy && (
            <p className="mt-1.5 text-[11px] text-text-muted">
              ทับเวลากับ “{lockedBy.title}” ({lockedBy.time}) ที่เลือกไว้แล้ว
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={() => onTogglePlan(screening.id)}
          disabled={isLocked}
          aria-pressed={isPlanned}
          aria-label={
            isPlanned
              ? `นำ ${screening.title} ออกจากแผน`
              : isLocked
                ? `เลือกไม่ได้ ${screening.title} ทับเวลากับ ${lockedBy?.title}`
                : `เพิ่ม ${screening.title} เข้าแผน`
          }
          title={isLocked ? `ทับเวลากับ "${lockedBy?.title}" ที่เลือกไว้แล้ว` : undefined}
          className="transition-standard flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed"
          style={{
            borderColor: isPlanned ? "var(--color-accent)" : "var(--color-border)",
            backgroundColor: isPlanned ? "var(--color-accent)" : "transparent",
            color: isPlanned ? "var(--color-accent-ink)" : "var(--color-text-muted)",
          }}
        >
          {isPlanned ? "✓" : isLocked ? "🔒" : "+"}
        </button>
      </div>
    </div>
  );
}
