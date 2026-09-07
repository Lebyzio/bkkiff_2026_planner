import { describe, expect, it } from "vitest";
import { buildPlanText } from "./exportPlanText";
import { findConflicts, SCREENINGS } from "./schedule";
import type { Screening } from "./types";

function realSingleScreeningTitle(): string {
  const counts = new Map<string, number>();
  for (const s of SCREENINGS) counts.set(s.title, (counts.get(s.title) ?? 0) + 1);
  const [title] = [...counts.entries()].find(([, count]) => count === 1)!;
  return title;
}

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

describe("buildPlanText", () => {
  it("includes a header with the total count and duration", () => {
    const screenings = [makeScreening({ durationMin: 90 })];
    const text = buildPlanText(screenings, new Map());
    expect(text).toContain("1 รอบฉาย · รวม 1 ชม. 30 นาที");
  });

  it("groups screenings under a Thai date heading, in order", () => {
    const screenings = [
      makeScreening({ id: "a", date: "2026-09-15", dayThai: "อังคาร", time: "20:00" }),
      makeScreening({ id: "b", date: "2026-09-14", dayThai: "จันทร์", time: "18:00" }),
    ];
    const text = buildPlanText(screenings, new Map());
    const mondayIndex = text.indexOf("วันจันทร์ที่ 14 ก.ย.");
    const tuesdayIndex = text.indexOf("วันอังคารที่ 15 ก.ย.");
    expect(mondayIndex).toBeGreaterThan(-1);
    expect(tuesdayIndex).toBeGreaterThan(mondayIndex);
  });

  it("includes the year, time range, venue, theater, and duration per line", () => {
    const screenings = [makeScreening({ title: "Rose", year: 2023, time: "18:00", endTime: "20:00" })];
    const text = buildPlanText(screenings, new Map());
    expect(text).toContain("18:00-20:00 Rose (2023) — IconSiam · Theater 5 (2 ชม.)");
  });

  it("tags Q&A, single-screening, and conflict on the same line", () => {
    const a = makeScreening({ id: "a", title: realSingleScreeningTitle(), qna: true, time: "18:00", endTime: "20:00" });
    const b = makeScreening({ id: "b", title: "Other Movie", time: "19:00", endTime: "21:00" });
    const conflicts = findConflicts([a, b]);
    const text = buildPlanText([a, b], conflicts);
    expect(text).toContain("Q&A ผู้กำกับ");
    expect(text).toContain("รอบเดียว");
    expect(text).toContain("เวลาซ้อนกัน");
  });

  it("tags a tight transition and a duplicate title", () => {
    const a = makeScreening({
      id: "a",
      venueId: "iconsiam",
      title: "Movie A",
      date: "2026-09-14",
      time: "18:00",
      endTime: "20:00",
    });
    const b = makeScreening({
      id: "b",
      venueId: "cloud11",
      title: "Movie A",
      date: "2026-09-14",
      time: "20:20",
      endTime: "22:00",
    });
    const text = buildPlanText([a, b], new Map());
    expect(text).toContain("เปลี่ยนโรงกระชั้นชิด (20 นาที)");
    expect(text).toContain("หนังซ้ำในแผน");
  });

  it("omits the year and tag brackets when there's nothing to show", () => {
    const text = buildPlanText([makeScreening({ title: "Anthology", year: null, qna: false, note: null })], new Map());
    expect(text).toContain("Anthology —");
    expect(text).not.toContain("[");
  });
});
