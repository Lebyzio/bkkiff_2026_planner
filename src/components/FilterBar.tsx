"use client";

import { DAY_TYPE_LABEL, TIME_OF_DAY_LABEL, TIME_OF_DAY_RANGE, theatersForVenue, VENUES } from "@/lib/schedule";
import type { DayType, Filters, TimeOfDay, VenueId } from "@/lib/types";
import { MovieFilterCombobox } from "./MovieFilterCombobox";

const TIME_OPTIONS: TimeOfDay[] = ["morning", "afternoon", "evening", "late"];
const DAY_TYPE_OPTIONS: DayType[] = ["weekday", "weekend"];

interface FilterBarProps {
  filters: Filters;
  setFilters: (next: Filters | ((prev: Filters) => Filters)) => void;
  allTitles: string[];
  resultCount: number;
  onReset: () => void;
}

function toggleInArray<T>(arr: T[], value: T): T[] {
  return arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
}

export function FilterBar({ filters, setFilters, allTitles, resultCount, onReset }: FilterBarProps) {
  const theaterFilterCount = Object.values(filters.theatersByVenue).reduce(
    (sum, list) => sum + (list?.length ?? 0),
    0,
  );
  const activeCount =
    filters.venueIds.length +
    theaterFilterCount +
    filters.timesOfDay.length +
    filters.dayTypes.length +
    filters.wantedTitles.length +
    (filters.onlyPlanned ? 1 : 0);

  function toggleVenue(id: VenueId) {
    setFilters((prev) => {
      const venueIds = toggleInArray(prev.venueIds, id);
      // Deselecting a venue drops its now-hidden theater sub-filter too.
      const theatersByVenue = { ...prev.theatersByVenue };
      if (!venueIds.includes(id)) delete theatersByVenue[id];
      return { ...prev, venueIds, theatersByVenue };
    });
  }

  function toggleTheater(venueId: VenueId, theater: string) {
    setFilters((prev) => ({
      ...prev,
      theatersByVenue: {
        ...prev.theatersByVenue,
        [venueId]: toggleInArray(prev.theatersByVenue[venueId] ?? [], theater),
      },
    }));
  }

  function toggleTime(t: TimeOfDay) {
    setFilters((prev) => ({ ...prev, timesOfDay: toggleInArray(prev.timesOfDay, t) }));
  }

  function toggleDayType(d: DayType) {
    setFilters((prev) => ({ ...prev, dayTypes: toggleInArray(prev.dayTypes, d) }));
  }

  return (
    <div className="border-b border-border-soft bg-bg-elevated/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 sm:px-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <p className="mb-1.5 text-xs font-medium text-text-muted">โรงหนัง</p>
            <div className="flex flex-wrap gap-1.5">
              {VENUES.map((venue) => {
                const active = filters.venueIds.includes(venue.id);
                return (
                  <button
                    key={venue.id}
                    type="button"
                    onClick={() => toggleVenue(venue.id)}
                    aria-pressed={active}
                    className="transition-standard rounded-full border px-3 py-1.5 text-xs font-medium"
                    style={{
                      borderColor: active ? venue.color : "var(--color-border)",
                      backgroundColor: active ? `${venue.color}26` : "transparent",
                      color: active ? "var(--color-text)" : "var(--color-text-muted)",
                    }}
                  >
                    <span
                      className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full align-middle"
                      style={{ backgroundColor: venue.color }}
                    />
                    {venue.name}
                  </button>
                );
              })}
            </div>

            {filters.venueIds.map((venueId) => {
              const theaters = theatersForVenue(venueId);
              if (theaters.length < 2) return null;
              const venue = VENUES.find((v) => v.id === venueId)!;
              const selected = filters.theatersByVenue[venueId] ?? [];
              return (
                <div
                  key={venueId}
                  className="mt-1.5 flex flex-wrap items-center gap-1.5 border-l-2 py-0.5 pl-2"
                  style={{ borderColor: venue.color }}
                >
                  <span className="text-[11px] text-text-muted">{venue.name}:</span>
                  {theaters.map((theater) => {
                    const active = selected.includes(theater);
                    return (
                      <button
                        key={theater}
                        type="button"
                        onClick={() => toggleTheater(venueId, theater)}
                        aria-pressed={active}
                        className="transition-standard rounded-full border px-2 py-1 text-[11px] font-medium"
                        style={{
                          borderColor: active ? venue.color : "var(--color-border)",
                          backgroundColor: active ? `${venue.color}26` : "transparent",
                          color: active ? "var(--color-text)" : "var(--color-text-muted)",
                        }}
                      >
                        {theater}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>

          <div>
            <p className="mb-1.5 text-xs font-medium text-text-muted">เวลาที่สะดวก</p>
            <div className="flex flex-wrap gap-1.5">
              {TIME_OPTIONS.map((t) => {
                const active = filters.timesOfDay.includes(t);
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => toggleTime(t)}
                    aria-pressed={active}
                    title={TIME_OF_DAY_RANGE[t]}
                    className="transition-standard rounded-full border px-3 py-1.5 text-xs font-medium"
                    style={{
                      borderColor: active ? "var(--color-accent)" : "var(--color-border)",
                      backgroundColor: active ? "color-mix(in srgb, var(--color-accent) 18%, transparent)" : "transparent",
                      color: active ? "var(--color-text)" : "var(--color-text-muted)",
                    }}
                  >
                    {TIME_OF_DAY_LABEL[t]}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <p className="mb-1.5 text-xs font-medium text-text-muted">วัน</p>
            <div className="flex flex-wrap gap-1.5">
              {DAY_TYPE_OPTIONS.map((d) => {
                const active = filters.dayTypes.includes(d);
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => toggleDayType(d)}
                    aria-pressed={active}
                    className="transition-standard rounded-full border px-3 py-1.5 text-xs font-medium"
                    style={{
                      borderColor: active ? "var(--color-accent)" : "var(--color-border)",
                      backgroundColor: active ? "color-mix(in srgb, var(--color-accent) 18%, transparent)" : "transparent",
                      color: active ? "var(--color-text)" : "var(--color-text-muted)",
                    }}
                  >
                    {DAY_TYPE_LABEL[d]}
                  </button>
                );
              })}
            </div>
          </div>

          <MovieFilterCombobox
            allTitles={allTitles}
            selected={filters.wantedTitles}
            onChange={(wantedTitles) => setFilters((prev) => ({ ...prev, wantedTitles }))}
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border-soft pt-3 text-xs text-text-muted">
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={filters.onlyPlanned}
              onChange={(e) => setFilters((prev) => ({ ...prev, onlyPlanned: e.target.checked }))}
              className="h-3.5 w-3.5 accent-[var(--color-accent)]"
            />
            แสดงเฉพาะรอบที่อยู่ในแผนของฉัน
          </label>
          <div className="flex items-center gap-3">
            <span>
              พบ <span className="font-mono text-text">{resultCount}</span> รอบฉาย
            </span>
            {activeCount > 0 && (
              <button type="button" onClick={onReset} className="text-accent hover:underline">
                ล้างตัวกรอง ({activeCount})
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
