import { formatDateHeading, formatDuration, titleWithYear } from "./format";
import { findDuplicateTitle, findTightTransition, groupByDate, isSingleScreening, VENUE_BY_ID } from "./schedule";
import type { Screening } from "./types";

function tagsFor(screening: Screening, allPlanned: Screening[], hasConflict: boolean): string[] {
  const tags: string[] = [];
  if (screening.note) tags.push(screening.note === "Opening Ceremony" ? "พิธีเปิด" : "พิธีปิด");
  if (screening.qna) tags.push("Q&A ผู้กำกับ");
  if (isSingleScreening(screening.title)) tags.push("รอบเดียว");
  if (hasConflict) tags.push("เวลาซ้อนกัน");
  const transition = findTightTransition(screening, allPlanned);
  if (transition) tags.push(`เปลี่ยนโรงกระชั้นชิด (${transition.gapMinutes} นาที)`);
  if (findDuplicateTitle(screening, allPlanned)) tags.push("หนังซ้ำในแผน");
  return tags;
}

/** Builds a plain-text summary of the plan, meant for pasting into a chat app. */
export function buildPlanText(screenings: Screening[], conflicts: Map<string, string[]>): string {
  const totalMinutes = screenings.reduce((sum, s) => sum + (s.durationMin ?? 0), 0);
  const lines: string[] = [
    `แผนดูหนัง BKKIFF Planner ของฉัน (${screenings.length} รอบฉาย · รวม ${formatDuration(totalMinutes)})`,
  ];

  for (const group of groupByDate(screenings)) {
    lines.push("", formatDateHeading(group.date, group.screenings[0].dayThai));
    for (const s of group.screenings) {
      const venue = VENUE_BY_ID[s.venueId];
      const hasConflict = (conflicts.get(s.id)?.length ?? 0) > 0;
      const tags = tagsFor(s, screenings, hasConflict);
      const timeRange = s.endTime ? `${s.time}-${s.endTime}` : s.time;
      const venuePart = `${venue.name}${s.theater ? ` · ${s.theater}` : ""}`;
      const tagPart = tags.length > 0 ? ` [${tags.join(", ")}]` : "";
      lines.push(`${timeRange} ${titleWithYear(s.title, s.year)} — ${venuePart} (${formatDuration(s.durationMin)})${tagPart}`);
    }
  }

  return lines.join("\n");
}
