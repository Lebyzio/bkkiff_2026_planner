import { titleWithYear } from "./format";
import { VENUE_BY_ID } from "./schedule";
import type { Screening } from "./types";

const BANGKOK_UTC_OFFSET_HOURS = 7;

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** Formats an absolute instant as an RFC 5545 UTC timestamp, e.g. "20260913T133000Z". */
function formatUtcStamp(instant: Date): string {
  return `${instant.getUTCFullYear()}${pad(instant.getUTCMonth() + 1)}${pad(instant.getUTCDate())}T${pad(instant.getUTCHours())}${pad(instant.getUTCMinutes())}${pad(instant.getUTCSeconds())}Z`;
}

/** "2026-09-13" + "20:30" (Bangkok local) -> "20260913T133000Z" (Bangkok has no DST, so a flat UTC+7 offset is safe). */
function toUtcStamp(date: string, time: string): string {
  const [y, m, d] = date.split("-").map(Number);
  const [h, min] = time.split(":").map(Number);
  return formatUtcStamp(new Date(Date.UTC(y, m - 1, d, h - BANGKOK_UTC_OFFSET_HOURS, min)));
}

/** Escapes TEXT-type values per RFC 5545 (backslash, comma, semicolon, newline). */
function escapeIcsText(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/,/g, "\\,").replace(/;/g, "\\;").replace(/\n/g, "\\n");
}

/** Builds an RFC 5545 .ics calendar (one VEVENT per screening) from the given plan. */
export function buildPlanIcs(screenings: Screening[], generatedAt: Date): string {
  const stamp = formatUtcStamp(generatedAt);

  const lines: string[] = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//BKKIFF Planner//TH", "CALSCALE:GREGORIAN"];

  for (const s of screenings) {
    const venue = VENUE_BY_ID[s.venueId];
    const location = venue.fullName + (s.theater ? ` - ${s.theater}` : "");
    const descriptionParts: string[] = [];
    if (s.qna) descriptionParts.push("Q&A ผู้กำกับ");
    if (s.note) descriptionParts.push(s.note);

    lines.push(
      "BEGIN:VEVENT",
      `UID:${s.id}@bkkiff-planner`,
      `DTSTAMP:${stamp}`,
      `DTSTART:${toUtcStamp(s.date, s.time)}`,
      `DTEND:${toUtcStamp(s.date, s.endTime ?? s.time)}`,
      `SUMMARY:${escapeIcsText(titleWithYear(s.title, s.year))}`,
      `LOCATION:${escapeIcsText(location)}`,
    );
    if (descriptionParts.length > 0) {
      lines.push(`DESCRIPTION:${escapeIcsText(descriptionParts.join(" / "))}`);
    }
    lines.push("END:VEVENT");
  }

  lines.push("END:VCALENDAR");
  return lines.join("\r\n") + "\r\n";
}

/** Builds the plan's .ics file and triggers a browser download. */
export function downloadPlanIcs(screenings: Screening[]) {
  const ics = buildPlanIcs(screenings, new Date());
  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "bkkiff-my-plan.ics";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
