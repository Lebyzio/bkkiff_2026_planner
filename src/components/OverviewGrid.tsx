"use client";

import { formatDateShort } from "@/lib/format";
import { dateLabels, findConflictingPlanned, findTightTransition, SCREENINGS, screeningsFor, VENUES } from "@/lib/schedule";
import { usePlannedScreenings } from "@/lib/usePlan";
import { MiniScreeningChip } from "./MiniScreeningChip";

const CORNER_WIDTH = 148;
const COLUMN_WIDTH = 190;

export function OverviewGrid() {
  const { ids: plannedIds, toggle, conflicts, plannedScreenings } = usePlannedScreenings();
  const dates = dateLabels();

  return (
    <div
      className="hide-vertical-scrollbar overflow-auto rounded-lg border border-border-soft"
      style={{ maxHeight: "calc(100vh - 280px)" }}
    >
      <table className="border-separate border-spacing-0">
        <thead>
          <tr>
            <th
              className="sticky top-0 left-0 z-30 border-b border-r border-border-soft bg-bg px-3 py-2 text-left align-bottom"
              style={{ width: CORNER_WIDTH, minWidth: CORNER_WIDTH }}
            >
              <span className="text-[11px] font-medium text-text-muted">โรง \ วันที่</span>
            </th>
            {dates.map(({ date, dayThai }) => (
              <th
                key={date}
                className="sticky top-0 z-20 border-b border-r border-border-soft bg-bg px-2 py-2 text-center"
                style={{ width: COLUMN_WIDTH, minWidth: COLUMN_WIDTH }}
              >
                <span className="block font-display text-base tracking-wide text-text">
                  {formatDateShort(date)}
                </span>
                <span className="block text-[10px] text-text-muted">{dayThai}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {VENUES.map((venue) => (
            <tr key={venue.id}>
              <th
                scope="row"
                className="sticky left-0 z-10 border-r border-b border-border-soft bg-bg px-3 py-2 text-left align-top"
                style={{ width: CORNER_WIDTH, minWidth: CORNER_WIDTH }}
              >
                <span className="flex items-center gap-1.5 text-xs font-medium text-text">
                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: venue.color }} />
                  {venue.name}
                </span>
              </th>
              {dates.map(({ date }) => {
                const cellScreenings = screeningsFor(SCREENINGS, venue.id, date);
                return (
                  <td
                    key={date}
                    className="border-r border-b border-border-soft bg-bg-elevated/40 p-1 align-top"
                    style={{ width: COLUMN_WIDTH, minWidth: COLUMN_WIDTH }}
                  >
                    {cellScreenings.map((s) => {
                      const isPlanned = plannedIds.has(s.id);
                      return (
                        <MiniScreeningChip
                          key={s.id}
                          screening={s}
                          venue={venue}
                          isPlanned={isPlanned}
                          hasConflict={(conflicts.get(s.id)?.length ?? 0) > 0}
                          onToggle={toggle}
                          lockedBy={isPlanned ? undefined : findConflictingPlanned(s, plannedScreenings)}
                          tightTransition={findTightTransition(s, plannedScreenings)}
                        />
                      );
                    })}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
