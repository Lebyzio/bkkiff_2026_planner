import { describe, expect, it } from "vitest";
import {
  EMPTY_FILTERS,
  SCREENINGS,
  VENUES,
  allDates,
  allMovieTitles,
  dateLabels,
  dayType,
  filterScreenings,
  findConflictingPlanned,
  findConflicts,
  findDuplicateTitle,
  findTightTransition,
  groupByDate,
  isSingleScreening,
  matchesFilters,
  overlaps,
  screeningsFor,
  theatersForVenue,
  timeOfDay,
  toMinutes,
  transitionGapMinutes,
  TIGHT_TRANSITION_MINUTES,
} from "./schedule";
import type { Screening } from "./types";

function makeScreening(overrides: Partial<Screening>): Screening {
  return {
    id: "test-id",
    date: "2026-09-14",
    dayThai: "จันทร์",
    time: "18:00",
    endTime: "20:00",
    title: "Test Movie",
    year: 2026,
    venueId: "iconsiam",
    theater: "Theater 5",
    durationMin: 120,
    qna: false,
    note: null,
    ...overrides,
  };
}

describe("real dataset sanity", () => {
  it("loads a non-trivial number of screenings and venues", () => {
    expect(VENUES.length).toBe(5);
    expect(SCREENINGS.length).toBeGreaterThan(150);
  });

  it("every screening references a known venue", () => {
    const ids = new Set(VENUES.map((v) => v.id));
    for (const s of SCREENINGS) {
      expect(ids.has(s.venueId)).toBe(true);
    }
  });

  it("has no duplicate screening ids", () => {
    const ids = SCREENINGS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("toMinutes / timeOfDay", () => {
  it("converts HH:MM to minutes since midnight", () => {
    expect(toMinutes("00:00")).toBe(0);
    expect(toMinutes("09:30")).toBe(570);
    expect(toMinutes("23:59")).toBe(1439);
  });

  it("buckets times into the correct part of day", () => {
    expect(timeOfDay("09:00")).toBe("morning");
    expect(timeOfDay("11:59")).toBe("morning");
    expect(timeOfDay("12:00")).toBe("afternoon");
    expect(timeOfDay("16:59")).toBe("afternoon");
    expect(timeOfDay("17:00")).toBe("evening");
    expect(timeOfDay("19:59")).toBe("evening");
    expect(timeOfDay("20:00")).toBe("late");
    expect(timeOfDay("23:30")).toBe("late");
  });
});

describe("dayType", () => {
  it("classifies Saturday and Sunday as weekend", () => {
    expect(dayType("2026-09-13")).toBe("weekend"); // Sunday
    expect(dayType("2026-09-19")).toBe("weekend"); // Saturday
  });

  it("classifies Monday through Friday as weekday", () => {
    expect(dayType("2026-09-14")).toBe("weekday"); // Monday
    expect(dayType("2026-09-18")).toBe("weekday"); // Friday
  });
});

describe("allMovieTitles / allDates", () => {
  it("returns unique, sorted titles", () => {
    const titles = allMovieTitles();
    expect(new Set(titles).size).toBe(titles.length);
    expect(titles).toEqual([...titles].sort((a, b) => a.localeCompare(b, "th")));
  });

  it("returns unique, chronologically sorted dates", () => {
    const dates = allDates();
    expect(new Set(dates).size).toBe(dates.length);
    expect(dates).toEqual([...dates].sort());
    expect(dates[0]).toBe("2026-09-13");
    expect(dates[dates.length - 1]).toBe("2026-09-27");
  });
});

describe("matchesFilters", () => {
  const screening = makeScreening({ id: "a", venueId: "iconsiam", time: "18:00", title: "Foo" });
  const planned = new Set<string>();

  it("matches everything when filters are empty", () => {
    expect(matchesFilters(screening, EMPTY_FILTERS, planned)).toBe(true);
  });

  it("filters by venue", () => {
    expect(matchesFilters(screening, { ...EMPTY_FILTERS, venueIds: ["iconsiam"] }, planned)).toBe(
      true,
    );
    expect(matchesFilters(screening, { ...EMPTY_FILTERS, venueIds: ["cloud11"] }, planned)).toBe(
      false,
    );
  });

  it("filters by time of day", () => {
    expect(
      matchesFilters(screening, { ...EMPTY_FILTERS, timesOfDay: ["evening"] }, planned),
    ).toBe(true);
    expect(
      matchesFilters(screening, { ...EMPTY_FILTERS, timesOfDay: ["morning"] }, planned),
    ).toBe(false);
  });

  it("filters by weekday/weekend", () => {
    const weekdayScreening = makeScreening({ id: "a", date: "2026-09-14" }); // Monday
    const weekendScreening = makeScreening({ id: "b", date: "2026-09-13" }); // Sunday
    expect(
      matchesFilters(weekdayScreening, { ...EMPTY_FILTERS, dayTypes: ["weekday"] }, planned),
    ).toBe(true);
    expect(
      matchesFilters(weekendScreening, { ...EMPTY_FILTERS, dayTypes: ["weekday"] }, planned),
    ).toBe(false);
    expect(
      matchesFilters(weekendScreening, { ...EMPTY_FILTERS, dayTypes: ["weekend"] }, planned),
    ).toBe(true);
  });

  it("filters by wanted movie titles", () => {
    expect(
      matchesFilters(screening, { ...EMPTY_FILTERS, wantedTitles: ["Foo"] }, planned),
    ).toBe(true);
    expect(
      matchesFilters(screening, { ...EMPTY_FILTERS, wantedTitles: ["Bar"] }, planned),
    ).toBe(false);
  });

  it("filters to only planned screenings", () => {
    const plannedWithA = new Set(["a"]);
    expect(matchesFilters(screening, { ...EMPTY_FILTERS, onlyPlanned: true }, planned)).toBe(
      false,
    );
    expect(
      matchesFilters(screening, { ...EMPTY_FILTERS, onlyPlanned: true }, plannedWithA),
    ).toBe(true);
  });
});

describe("filterScreenings", () => {
  it("combines all filter dimensions", () => {
    const list = [
      makeScreening({ id: "a", venueId: "iconsiam", time: "18:00", title: "Foo" }),
      makeScreening({ id: "b", venueId: "cloud11", time: "18:00", title: "Foo" }),
      makeScreening({ id: "c", venueId: "iconsiam", time: "09:00", title: "Foo" }),
    ];
    const result = filterScreenings(
      list,
      { ...EMPTY_FILTERS, venueIds: ["iconsiam"], timesOfDay: ["evening"] },
      new Set(),
    );
    expect(result.map((s) => s.id)).toEqual(["a"]);
  });
});

describe("groupByDate", () => {
  it("groups and sorts by date then time", () => {
    const list = [
      makeScreening({ id: "a", date: "2026-09-15", time: "20:00" }),
      makeScreening({ id: "b", date: "2026-09-14", time: "18:00" }),
      makeScreening({ id: "c", date: "2026-09-14", time: "10:00" }),
    ];
    const groups = groupByDate(list);
    expect(groups.map((g) => g.date)).toEqual(["2026-09-14", "2026-09-15"]);
    expect(groups[0].screenings.map((s) => s.id)).toEqual(["c", "b"]);
  });
});

describe("overlaps", () => {
  it("detects overlapping time ranges on the same day", () => {
    const a = makeScreening({ id: "a", date: "2026-09-14", time: "18:00", endTime: "20:00" });
    const b = makeScreening({ id: "b", date: "2026-09-14", time: "19:00", endTime: "21:00" });
    expect(overlaps(a, b)).toBe(true);
  });

  it("does not flag back-to-back screenings as overlapping", () => {
    const a = makeScreening({ id: "a", date: "2026-09-14", time: "18:00", endTime: "20:00" });
    const b = makeScreening({ id: "b", date: "2026-09-14", time: "20:00", endTime: "22:00" });
    expect(overlaps(a, b)).toBe(false);
  });

  it("ignores screenings on different days", () => {
    const a = makeScreening({ id: "a", date: "2026-09-14", time: "18:00", endTime: "23:00" });
    const b = makeScreening({ id: "b", date: "2026-09-15", time: "18:00", endTime: "23:00" });
    expect(overlaps(a, b)).toBe(false);
  });

  it("never overlaps a screening with itself", () => {
    const a = makeScreening({ id: "a" });
    expect(overlaps(a, a)).toBe(false);
  });

  it("treats a missing duration as a 1-minute slot", () => {
    const a = makeScreening({ id: "a", time: "18:00", endTime: null });
    const b = makeScreening({ id: "b", time: "18:30", endTime: "19:00" });
    expect(overlaps(a, b)).toBe(false);
  });
});

describe("findConflicts", () => {
  it("flags each side of a clash and leaves non-conflicting plans alone", () => {
    const a = makeScreening({ id: "a", date: "2026-09-14", time: "18:00", endTime: "20:00" });
    const b = makeScreening({ id: "b", date: "2026-09-14", time: "19:00", endTime: "21:00" });
    const c = makeScreening({ id: "c", date: "2026-09-15", time: "18:00", endTime: "20:00" });
    const conflicts = findConflicts([a, b, c]);
    expect(conflicts.get("a")).toEqual(["b"]);
    expect(conflicts.get("b")).toEqual(["a"]);
    expect(conflicts.has("c")).toBe(false);
  });
});

describe("dateLabels", () => {
  it("pairs every date with its Thai day name, matching allDates order", () => {
    const labels = dateLabels();
    expect(labels.map((l) => l.date)).toEqual(allDates());
    expect(labels[0]).toEqual({ date: "2026-09-13", dayThai: "อาทิตย์" });
    expect(labels.every((l) => l.dayThai.length > 0)).toBe(true);
  });
});

describe("screeningsFor", () => {
  it("returns only the matching venue+date, sorted by time", () => {
    const list = [
      makeScreening({ id: "a", venueId: "iconsiam", date: "2026-09-14", time: "20:00" }),
      makeScreening({ id: "b", venueId: "iconsiam", date: "2026-09-14", time: "17:00" }),
      makeScreening({ id: "c", venueId: "cloud11", date: "2026-09-14", time: "18:00" }),
      makeScreening({ id: "d", venueId: "iconsiam", date: "2026-09-15", time: "18:00" }),
    ];
    const result = screeningsFor(list, "iconsiam", "2026-09-14");
    expect(result.map((s) => s.id)).toEqual(["b", "a"]);
  });
});

describe("theatersForVenue", () => {
  it("sorts numerically, not lexicographically (Theater 6 before Theater 14)", () => {
    expect(theatersForVenue("paragon")).toEqual(["Theater 6", "Theater 14"]);
  });

  it("returns an empty list for a single-screen venue", () => {
    expect(theatersForVenue("cloud11")).toEqual([]);
  });

  it("includes every distinct theater a venue uses", () => {
    expect(theatersForVenue("iconsiam")).toEqual(
      expect.arrayContaining(["Theater 2/5/6", "Theater 5", "Theater IMAX"]),
    );
  });
});

describe("matchesFilters (theater sub-filter)", () => {
  const screening = makeScreening({ id: "a", venueId: "samyan", theater: "Theater 3" });
  const planned = new Set<string>();

  it("passes through when no theater sub-filter is set for the venue", () => {
    expect(matchesFilters(screening, { ...EMPTY_FILTERS, venueIds: ["samyan"] }, planned)).toBe(
      true,
    );
  });

  it("filters to only the selected theater within that venue", () => {
    const filters = { ...EMPTY_FILTERS, theatersByVenue: { samyan: ["Theater 4"] } };
    expect(matchesFilters(screening, filters, planned)).toBe(false);
    expect(
      matchesFilters({ ...screening, theater: "Theater 4" }, filters, planned),
    ).toBe(true);
  });

  it("only constrains the venue it's scoped to, not other venues", () => {
    const other = makeScreening({ id: "b", venueId: "iconsiam", theater: "Theater 5" });
    const filters = { ...EMPTY_FILTERS, theatersByVenue: { samyan: ["Theater 4"] } };
    expect(matchesFilters(other, filters, planned)).toBe(true);
  });
});

describe("findConflictingPlanned", () => {
  it("returns the planned screening that overlaps a candidate", () => {
    const planned = [
      makeScreening({ id: "p1", date: "2026-09-14", time: "18:00", endTime: "20:00" }),
    ];
    const candidate = makeScreening({ id: "c1", date: "2026-09-14", time: "19:00", endTime: "21:00" });
    expect(findConflictingPlanned(candidate, planned)?.id).toBe("p1");
  });

  it("returns undefined when nothing planned overlaps", () => {
    const planned = [
      makeScreening({ id: "p1", date: "2026-09-14", time: "18:00", endTime: "20:00" }),
    ];
    const candidate = makeScreening({ id: "c1", date: "2026-09-14", time: "20:00", endTime: "22:00" });
    expect(findConflictingPlanned(candidate, planned)).toBeUndefined();
  });

  it("ignores itself when the candidate is already in the planned list", () => {
    const p1 = makeScreening({ id: "p1", date: "2026-09-14", time: "18:00", endTime: "20:00" });
    expect(findConflictingPlanned(p1, [p1])).toBeUndefined();
  });
});

describe("findDuplicateTitle", () => {
  it("returns the other planned screening with the same title", () => {
    const planned = [makeScreening({ id: "p1", title: "Rose", date: "2026-09-14", time: "18:00" })];
    const candidate = makeScreening({ id: "c1", title: "Rose", date: "2026-09-20", time: "20:00" });
    expect(findDuplicateTitle(candidate, planned)?.id).toBe("p1");
  });

  it("returns undefined when no planned screening shares the title", () => {
    const planned = [makeScreening({ id: "p1", title: "Rose" })];
    const candidate = makeScreening({ id: "c1", title: "Blaise" });
    expect(findDuplicateTitle(candidate, planned)).toBeUndefined();
  });

  it("ignores itself when the candidate is already in the planned list", () => {
    const p1 = makeScreening({ id: "p1", title: "Rose" });
    expect(findDuplicateTitle(p1, [p1])).toBeUndefined();
  });
});

describe("isSingleScreening", () => {
  it("is true for a title that appears exactly once in the real dataset", () => {
    const counts = new Map<string, number>();
    for (const s of SCREENINGS) counts.set(s.title, (counts.get(s.title) ?? 0) + 1);
    const [singleTitle] = [...counts.entries()].find(([, count]) => count === 1)!;
    const [repeatedTitle] = [...counts.entries()].find(([, count]) => count > 1)!;
    expect(isSingleScreening(singleTitle)).toBe(true);
    expect(isSingleScreening(repeatedTitle)).toBe(false);
  });

  it("is false for a title that doesn't exist at all", () => {
    expect(isSingleScreening("Not A Real Movie")).toBe(false);
  });
});

describe("transitionGapMinutes", () => {
  it("measures the gap between two same-day, non-overlapping screenings", () => {
    const a = makeScreening({ id: "a", date: "2026-09-14", time: "18:00", endTime: "20:00" });
    const b = makeScreening({ id: "b", date: "2026-09-14", time: "20:30", endTime: "22:00" });
    expect(transitionGapMinutes(a, b)).toBe(30);
    expect(transitionGapMinutes(b, a)).toBe(30);
  });

  it("returns null for screenings that overlap (that's a conflict, not a transition)", () => {
    const a = makeScreening({ id: "a", date: "2026-09-14", time: "18:00", endTime: "20:00" });
    const b = makeScreening({ id: "b", date: "2026-09-14", time: "19:00", endTime: "21:00" });
    expect(transitionGapMinutes(a, b)).toBeNull();
  });

  it("returns null across different days", () => {
    const a = makeScreening({ id: "a", date: "2026-09-14", time: "22:00", endTime: "23:30" });
    const b = makeScreening({ id: "b", date: "2026-09-15", time: "10:00", endTime: "12:00" });
    expect(transitionGapMinutes(a, b)).toBeNull();
  });

  it("treats back-to-back with zero gap as zero, not null", () => {
    const a = makeScreening({ id: "a", date: "2026-09-14", time: "18:00", endTime: "20:00" });
    const b = makeScreening({ id: "b", date: "2026-09-14", time: "20:00", endTime: "22:00" });
    expect(transitionGapMinutes(a, b)).toBe(0);
  });
});

describe("findTightTransition", () => {
  it("flags a different-venue gap under the threshold", () => {
    const candidate = makeScreening({ id: "c", venueId: "iconsiam", date: "2026-09-14", time: "20:00", endTime: "22:00" });
    const planned = [
      makeScreening({ id: "p", venueId: "cloud11", date: "2026-09-14", time: "22:20", endTime: "23:50" }),
    ];
    const result = findTightTransition(candidate, planned);
    expect(result?.screening.id).toBe("p");
    expect(result?.gapMinutes).toBe(20);
  });

  it("does not flag a gap at or above the threshold", () => {
    const candidate = makeScreening({ id: "c", venueId: "iconsiam", date: "2026-09-14", time: "20:00", endTime: "22:00" });
    const planned = [
      makeScreening({
        id: "p",
        venueId: "cloud11",
        date: "2026-09-14",
        time: "22:45",
        endTime: "23:50",
      }),
    ];
    expect(transitionGapMinutes(candidate, planned[0])).toBe(TIGHT_TRANSITION_MINUTES);
    expect(findTightTransition(candidate, planned)).toBeUndefined();
  });

  it("never flags a same-venue back-to-back, however tight", () => {
    const candidate = makeScreening({ id: "c", venueId: "iconsiam", date: "2026-09-14", time: "20:00", endTime: "22:00" });
    const planned = [
      makeScreening({ id: "p", venueId: "iconsiam", date: "2026-09-14", time: "22:05", endTime: "23:00" }),
    ];
    expect(findTightTransition(candidate, planned)).toBeUndefined();
  });

  it("ignores itself when the screening is already in the planned list", () => {
    const p1 = makeScreening({ id: "p1", venueId: "iconsiam", date: "2026-09-14", time: "18:00", endTime: "20:00" });
    expect(findTightTransition(p1, [p1])).toBeUndefined();
  });

  it("picks the tightest gap when multiple planned screenings qualify", () => {
    const candidate = makeScreening({ id: "c", venueId: "iconsiam", date: "2026-09-14", time: "20:00", endTime: "22:00" });
    const planned = [
      makeScreening({ id: "p1", venueId: "cloud11", date: "2026-09-14", time: "22:30", endTime: "23:50" }),
      makeScreening({ id: "p2", venueId: "samyan", date: "2026-09-14", time: "22:15", endTime: "23:50" }),
    ];
    expect(findTightTransition(candidate, planned)?.screening.id).toBe("p2");
  });
});
