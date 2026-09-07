import { describe, expect, it } from "vitest";
import { buildPlanIcs } from "./exportPlanIcs";
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

const GENERATED_AT = new Date(Date.UTC(2026, 8, 1, 12, 0));

describe("buildPlanIcs", () => {
  it("wraps events in a valid VCALENDAR envelope", () => {
    const ics = buildPlanIcs([makeScreening({})], GENERATED_AT);
    expect(ics.startsWith("BEGIN:VCALENDAR\r\n")).toBe(true);
    expect(ics.endsWith("END:VCALENDAR\r\n")).toBe(true);
    expect(ics).toContain("BEGIN:VEVENT");
    expect(ics).toContain("END:VEVENT");
  });

  it("converts Bangkok local time (UTC+7) to a UTC DTSTART/DTEND stamp", () => {
    const ics = buildPlanIcs([makeScreening({ date: "2026-09-14", time: "18:00", endTime: "20:00" })], GENERATED_AT);
    expect(ics).toContain("DTSTART:20260914T110000Z");
    expect(ics).toContain("DTEND:20260914T130000Z");
  });

  it("falls back to the start time for DTEND when endTime is null", () => {
    const ics = buildPlanIcs([makeScreening({ time: "18:00", endTime: null })], GENERATED_AT);
    expect(ics).toContain("DTSTART:20260914T110000Z");
    expect(ics).toContain("DTEND:20260914T110000Z");
  });

  it("includes the year in SUMMARY and the venue/theater in LOCATION", () => {
    const ics = buildPlanIcs([makeScreening({ title: "Rose", year: 2023, theater: "Theater 5" })], GENERATED_AT);
    expect(ics).toContain("SUMMARY:Rose (2023)");
    expect(ics).toContain("LOCATION:IconSiam - Icon Cine Conic - Theater 5");
  });

  it("omits the year from SUMMARY when unknown", () => {
    const ics = buildPlanIcs([makeScreening({ title: "Anthology Programme", year: null })], GENERATED_AT);
    expect(ics).toContain("SUMMARY:Anthology Programme");
    expect(ics).not.toContain("SUMMARY:Anthology Programme (");
  });

  it("adds Q&A and note tags to DESCRIPTION, joined by a slash", () => {
    const ics = buildPlanIcs([makeScreening({ qna: true, note: "Opening Ceremony" })], GENERATED_AT);
    expect(ics).toContain("DESCRIPTION:Q&A ผู้กำกับ / Opening Ceremony");
  });

  it("omits DESCRIPTION entirely when there's no Q&A or note", () => {
    const ics = buildPlanIcs([makeScreening({ qna: false, note: null })], GENERATED_AT);
    expect(ics).not.toContain("DESCRIPTION:");
  });

  it("escapes commas, semicolons, and backslashes in TEXT fields", () => {
    const ics = buildPlanIcs([makeScreening({ title: 'A, B; C\\D' })], GENERATED_AT);
    expect(ics).toContain("SUMMARY:A\\, B\\; C\\\\D (2026)");
  });

  it("gives each screening a stable, unique UID derived from its id", () => {
    const ics = buildPlanIcs(
      [makeScreening({ id: "a" }), makeScreening({ id: "b" })],
      GENERATED_AT,
    );
    expect(ics).toContain("UID:a@bkkiff-planner");
    expect(ics).toContain("UID:b@bkkiff-planner");
  });

  it("produces just the empty envelope for an empty plan", () => {
    const ics = buildPlanIcs([], GENERATED_AT);
    expect(ics).not.toContain("VEVENT");
  });
});
