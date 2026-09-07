import rawData from "@/data/screenings.json";
import type { DayType, Filters, Screening, ScheduleData, TimeOfDay, Venue, VenueId } from "./types";

const data = rawData as ScheduleData;

export const VENUES: Venue[] = data.venues;
export const SCREENINGS: Screening[] = data.screenings;

export const VENUE_BY_ID: Record<VenueId, Venue> = Object.fromEntries(
  VENUES.map((v) => [v.id, v]),
) as Record<VenueId, Venue>;

const SCREENING_COUNT_BY_TITLE: Map<string, number> = (() => {
  const counts = new Map<string, number>();
  for (const s of SCREENINGS) counts.set(s.title, (counts.get(s.title) ?? 0) + 1);
  return counts;
})();

/** True when a movie has exactly one screening in the whole festival — miss it, miss it for good. */
export function isSingleScreening(title: string): boolean {
  return SCREENING_COUNT_BY_TITLE.get(title) === 1;
}

export const TIME_OF_DAY_LABEL: Record<TimeOfDay, string> = {
  morning: "เช้า",
  afternoon: "บ่าย",
  evening: "เย็น",
  late: "ค่ำ",
};

export const TIME_OF_DAY_RANGE: Record<TimeOfDay, string> = {
  morning: "ก่อน 12:00",
  afternoon: "12:00–16:59",
  evening: "17:00–19:59",
  late: "ตั้งแต่ 20:00",
};

/** Converts "HH:MM" into minutes since midnight for comparisons. */
export function toMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

export function timeOfDay(time: string): TimeOfDay {
  const minutes = toMinutes(time);
  if (minutes < 12 * 60) return "morning";
  if (minutes < 17 * 60) return "afternoon";
  if (minutes < 20 * 60) return "evening";
  return "late";
}

export const DAY_TYPE_LABEL: Record<DayType, string> = {
  weekday: "วันธรรมดา",
  weekend: "เสาร์-อาทิตย์",
};

/** Sat/Sun -> "weekend", else "weekday". Parses the ISO date as local calendar fields to avoid UTC-shift bugs. */
export function dayType(date: string): DayType {
  const [y, m, d] = date.split("-").map(Number);
  const weekday = new Date(y, m - 1, d).getDay();
  return weekday === 0 || weekday === 6 ? "weekend" : "weekday";
}

/** All distinct movie titles, sorted alphabetically (locale-aware for Thai + Latin). */
export function allMovieTitles(): string[] {
  return Array.from(new Set(SCREENINGS.map((s) => s.title))).sort((a, b) =>
    a.localeCompare(b, "th"),
  );
}

/** All distinct festival dates, in chronological order. */
export function allDates(): string[] {
  return Array.from(new Set(SCREENINGS.map((s) => s.date))).sort();
}

/** All distinct festival dates paired with their Thai day name, in chronological order. */
export function dateLabels(): { date: string; dayThai: string }[] {
  const dayThaiByDate = new Map<string, string>();
  for (const s of SCREENINGS) {
    if (!dayThaiByDate.has(s.date)) dayThaiByDate.set(s.date, s.dayThai);
  }
  return allDates().map((date) => ({ date, dayThai: dayThaiByDate.get(date)! }));
}

/** Screenings for one venue on one date, sorted by time. */
export function screeningsFor(screenings: Screening[], venueId: VenueId, date: string): Screening[] {
  return screenings
    .filter((s) => s.venueId === venueId && s.date === date)
    .sort((a, b) => a.time.localeCompare(b.time));
}

/** Sorts "Theater 6" before "Theater 14" (numeric, not lexicographic); names with no number sort last. */
function theaterSortKey(theater: string): number {
  const match = theater.match(/\d+/);
  return match ? Number(match[0]) : Infinity;
}

/** Distinct theaters/halls a venue uses, in reading order. Empty for single-screen venues. */
export function theatersForVenue(venueId: VenueId): string[] {
  const theaters = new Set<string>();
  for (const s of SCREENINGS) {
    if (s.venueId === venueId && s.theater) theaters.add(s.theater);
  }
  return Array.from(theaters).sort((a, b) => theaterSortKey(a) - theaterSortKey(b) || a.localeCompare(b));
}

export const EMPTY_FILTERS: Filters = {
  venueIds: [],
  theatersByVenue: {},
  timesOfDay: [],
  dayTypes: [],
  wantedTitles: [],
  onlyPlanned: false,
};

export function matchesFilters(
  screening: Screening,
  filters: Filters,
  plannedIds: ReadonlySet<string>,
): boolean {
  if (filters.venueIds.length > 0 && !filters.venueIds.includes(screening.venueId)) {
    return false;
  }
  const theaterSubset = filters.theatersByVenue[screening.venueId];
  if (theaterSubset && theaterSubset.length > 0 && !theaterSubset.includes(screening.theater ?? "")) {
    return false;
  }
  if (filters.timesOfDay.length > 0 && !filters.timesOfDay.includes(timeOfDay(screening.time))) {
    return false;
  }
  if (filters.dayTypes.length > 0 && !filters.dayTypes.includes(dayType(screening.date))) {
    return false;
  }
  if (filters.wantedTitles.length > 0 && !filters.wantedTitles.includes(screening.title)) {
    return false;
  }
  if (filters.onlyPlanned && !plannedIds.has(screening.id)) {
    return false;
  }
  return true;
}

export function filterScreenings(
  screenings: Screening[],
  filters: Filters,
  plannedIds: ReadonlySet<string>,
): Screening[] {
  return screenings.filter((s) => matchesFilters(s, filters, plannedIds));
}

export interface DateGroup {
  date: string;
  screenings: Screening[];
}

/** Groups screenings by date (chronological), each day's list sorted by time. */
export function groupByDate(screenings: Screening[]): DateGroup[] {
  const map = new Map<string, Screening[]>();
  for (const s of screenings) {
    const list = map.get(s.date);
    if (list) list.push(s);
    else map.set(s.date, [s]);
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, list]) => ({
      date,
      screenings: [...list].sort((a, b) => a.time.localeCompare(b.time)),
    }));
}

/** Two screenings clash if they're the same day and their time ranges overlap. */
export function overlaps(a: Screening, b: Screening): boolean {
  if (a.date !== b.date || a.id === b.id) return false;
  const aStart = toMinutes(a.time);
  const aEnd = a.endTime ? toMinutes(a.endTime) : aStart + 1;
  const bStart = toMinutes(b.time);
  const bEnd = b.endTime ? toMinutes(b.endTime) : bStart + 1;
  // Overnight-safe isn't needed here (festival screenings don't cross midnight),
  // but guard against an endTime that wrapped past 00:00 in the source data.
  const aEndAdj = aEnd <= aStart ? aEnd + 24 * 60 : aEnd;
  const bEndAdj = bEnd <= bStart ? bEnd + 24 * 60 : bEnd;
  return aStart < bEndAdj && bStart < aEndAdj;
}

/** For each screening in `plan`, returns the ids of other planned screenings it clashes with. */
export function findConflicts(plan: Screening[]): Map<string, string[]> {
  const conflicts = new Map<string, string[]>();
  for (let i = 0; i < plan.length; i++) {
    for (let j = i + 1; j < plan.length; j++) {
      if (overlaps(plan[i], plan[j])) {
        conflicts.set(plan[i].id, [...(conflicts.get(plan[i].id) ?? []), plan[j].id]);
        conflicts.set(plan[j].id, [...(conflicts.get(plan[j].id) ?? []), plan[i].id]);
      }
    }
  }
  return conflicts;
}

/**
 * The first already-planned screening that would clash with `candidate` if it were
 * added too — used to lock out selection rather than just warn after the fact.
 * Returns undefined if `candidate` is itself already planned (nothing new to block).
 */
export function findConflictingPlanned(
  candidate: Screening,
  planned: Screening[],
): Screening | undefined {
  return planned.find((p) => overlaps(candidate, p));
}

/**
 * The first already-planned screening of the same movie as `candidate`, ignoring
 * itself — a soft warning (not a block), since re-watching a film or catching it
 * at a second Q&A can be intentional, unlike a hard time conflict.
 */
export function findDuplicateTitle(candidate: Screening, planned: Screening[]): Screening | undefined {
  return planned.find((p) => p.id !== candidate.id && p.title === candidate.title);
}

/**
 * Minutes below which switching venues is considered a tight transition — a rough
 * rule of thumb (exit + travel + entry), not real transit-time data for any
 * specific pair of venues. Same-venue back-to-back screenings are never flagged.
 */
export const TIGHT_TRANSITION_MINUTES = 45;

/**
 * Minutes of gap between two same-day screenings (whichever comes first ends
 * before the other starts). Returns null if they're on different days or if
 * their times actually overlap (that's a conflict, not a transition).
 */
export function transitionGapMinutes(a: Screening, b: Screening): number | null {
  if (a.date !== b.date || a.id === b.id) return null;
  const aStart = toMinutes(a.time);
  const aEnd = a.endTime ? toMinutes(a.endTime) : aStart + 1;
  const bStart = toMinutes(b.time);
  const bEnd = b.endTime ? toMinutes(b.endTime) : bStart + 1;
  if (aEnd <= bStart) return bStart - aEnd;
  if (bEnd <= aStart) return aStart - bEnd;
  return null;
}

export interface TightTransition {
  screening: Screening;
  gapMinutes: number;
}

/**
 * The tightest same-day, different-venue gap between `screening` and anything in
 * `planned` that's under TIGHT_TRANSITION_MINUTES — a soft warning, not a block,
 * so it's computed the same way whether `screening` is itself already planned or
 * is just a candidate being previewed (it never matches against itself).
 */
export function findTightTransition(screening: Screening, planned: Screening[]): TightTransition | undefined {
  let worst: TightTransition | undefined;
  for (const p of planned) {
    if (p.id === screening.id || p.venueId === screening.venueId) continue;
    const gapMinutes = transitionGapMinutes(screening, p);
    if (gapMinutes !== null && gapMinutes < TIGHT_TRANSITION_MINUTES && (!worst || gapMinutes < worst.gapMinutes)) {
      worst = { screening: p, gapMinutes };
    }
  }
  return worst;
}
