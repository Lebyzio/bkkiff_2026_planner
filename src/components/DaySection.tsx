import { formatDateHeading } from "@/lib/format";
import { findConflictingPlanned, findDuplicateTitle, findTightTransition, VENUE_BY_ID } from "@/lib/schedule";
import type { Screening } from "@/lib/types";
import { ScreeningTicket } from "./ScreeningTicket";

interface DaySectionProps {
  date: string;
  screenings: Screening[];
  plannedIds: ReadonlySet<string>;
  plannedScreenings: Screening[];
  conflicts: Map<string, string[]>;
  onTogglePlan: (id: string) => void;
}

export function DaySection({
  date,
  screenings,
  plannedIds,
  plannedScreenings,
  conflicts,
  onTogglePlan,
}: DaySectionProps) {
  if (screenings.length === 0) return null;

  return (
    <section aria-label={formatDateHeading(date, screenings[0].dayThai)}>
      <div className="mb-3 flex items-baseline gap-3">
        <h2 className="font-display text-2xl tracking-wide text-text sm:text-3xl">
          {formatDateHeading(date, screenings[0].dayThai)}
        </h2>
        <span className="h-px flex-1 bg-border-soft" />
        <span className="shrink-0 text-xs text-text-muted">{screenings.length} รอบฉาย</span>
      </div>
      <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
        {screenings.map((screening) => {
          const isPlanned = plannedIds.has(screening.id);
          return (
            <ScreeningTicket
              key={screening.id}
              screening={screening}
              venue={VENUE_BY_ID[screening.venueId]}
              isPlanned={isPlanned}
              onTogglePlan={onTogglePlan}
              conflictCount={conflicts.get(screening.id)?.length ?? 0}
              lockedBy={isPlanned ? undefined : findConflictingPlanned(screening, plannedScreenings)}
              tightTransition={findTightTransition(screening, plannedScreenings)}
              duplicateTitle={findDuplicateTitle(screening, plannedScreenings)}
            />
          );
        })}
      </div>
    </section>
  );
}
