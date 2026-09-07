import { formatDateHeading, formatDuration, titleWithYear } from "./format";
import { NOTO_SANS_THAI_REGULAR_BASE64 } from "./pdfFont.generated";
import { findDuplicateTitle, findTightTransition, groupByDate, isSingleScreening, VENUE_BY_ID } from "./schedule";
import type { TightTransition } from "./schedule";
import type { Screening } from "./types";

const FONT_FILE = "NotoSansThai-Regular.ttf";
const FONT_NAME = "NotoSansThai";

const INK = "#171412";
const MUTED = "#6b6470";
const RULE = "#ddd6de";
const CONFLICT_BG: [number, number, number] = [255, 232, 227];
const CONFLICT_TEXT = "#a02f1c";
const WARNING_BG: [number, number, number] = [253, 229, 205];
const WARNING_TEXT = "#8a4a10";

function registerThaiFont(doc: import("jspdf").jsPDF) {
  doc.addFileToVFS(FONT_FILE, NOTO_SANS_THAI_REGULAR_BASE64);
  doc.addFont(FONT_FILE, FONT_NAME, "normal");
  doc.setFont(FONT_NAME, "normal");
}

function badgeText(
  screening: Screening,
  transition: TightTransition | undefined,
  duplicate: Screening | undefined,
): string {
  const tags: string[] = [];
  if (screening.note) tags.push(screening.note === "Opening Ceremony" ? "พิธีเปิด" : "พิธีปิด");
  if (screening.qna) tags.push("Q&A ผู้กำกับ");
  if (isSingleScreening(screening.title)) tags.push("รอบเดียว");
  if (transition) {
    tags.push(`เปลี่ยนโรงกระชั้นชิด (${transition.gapMinutes} นาที ก่อน/หลัง "${transition.screening.title}")`);
  }
  if (duplicate) tags.push(`หนังซ้ำในแผน (${duplicate.time})`);
  return tags.join(" · ");
}

function venueCell(screening: Screening): string {
  const name = VENUE_BY_ID[screening.venueId].name;
  return screening.theater ? `${name}\n${screening.theater}` : name;
}

/** Builds and downloads a PDF of the given screenings, grouped by date. */
export async function exportPlanPdf(screenings: Screening[], conflicts: Map<string, string[]>) {
  const { jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const doc = new jsPDF({ unit: "mm", format: "a4" });
  registerThaiFont(doc);

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;

  doc.setFontSize(20);
  doc.setTextColor(INK);
  doc.text("BKKIFF PLANNER", margin, 18);
  doc.setFontSize(12);
  doc.text("แผนของฉัน", margin, 26);

  doc.setFontSize(9);
  doc.setTextColor(MUTED);
  const totalMinutes = screenings.reduce((sum, s) => sum + (s.durationMin ?? 0), 0);
  const generatedAt = new Date().toLocaleString("th-TH", { dateStyle: "long", timeStyle: "short" });
  doc.text(
    `${screenings.length} รอบฉาย · รวม ${formatDuration(totalMinutes)} · สร้างเมื่อ ${generatedAt}`,
    margin,
    32,
  );

  const hasAnyTightTransition = screenings.some((s) => findTightTransition(s, screenings));
  const hasAnyDuplicate = screenings.some((s) => findDuplicateTitle(s, screenings));
  if (hasAnyTightTransition || hasAnyDuplicate) {
    doc.text(
      "สีส้ม = เปลี่ยนโรงในเวลากระชั้นชิด (ต่ำกว่า 45 นาที) และ/หรือ หนังเรื่องเดียวกันซ้ำในแผน",
      margin,
      37,
    );
  }

  let cursorY = hasAnyTightTransition || hasAnyDuplicate ? 44 : 40;

  for (const group of groupByDate(screenings)) {
    if (cursorY > pageHeight - 30) {
      doc.addPage();
      cursorY = 20;
    }

    doc.setFontSize(12);
    doc.setTextColor(INK);
    doc.setFont(FONT_NAME, "normal");
    doc.text(formatDateHeading(group.date, group.screenings[0].dayThai), margin, cursorY);
    doc.setDrawColor(RULE);
    doc.line(margin, cursorY + 2, pageWidth - margin, cursorY + 2);

    const conflictFlags = group.screenings.map((s) => (conflicts.get(s.id)?.length ?? 0) > 0);
    const transitions = group.screenings.map((s) => findTightTransition(s, screenings));
    const duplicates = group.screenings.map((s) => findDuplicateTitle(s, screenings));

    autoTable(doc, {
      startY: cursorY + 6,
      margin: { left: margin, right: margin },
      styles: {
        font: FONT_NAME,
        fontStyle: "normal",
        fontSize: 9,
        textColor: INK,
        cellPadding: 2.2,
        lineColor: RULE,
        lineWidth: 0.1,
      },
      headStyles: {
        font: FONT_NAME,
        fontStyle: "normal",
        fillColor: [232, 184, 75],
        textColor: "#1c1509",
        fontSize: 9,
      },
      columnStyles: {
        0: { cellWidth: 24 },
        2: { cellWidth: 34 },
        3: { cellWidth: 24 },
        4: { cellWidth: 40 },
      },
      head: [["เวลา", "เรื่อง", "โรงหนัง", "ความยาว", "หมายเหตุ"]],
      body: group.screenings.map((s, i) => [
        s.endTime ? `${s.time}-${s.endTime}` : s.time,
        titleWithYear(s.title, s.year),
        venueCell(s),
        formatDuration(s.durationMin),
        badgeText(s, transitions[i], duplicates[i]),
      ]),
      didParseCell(data) {
        if (data.section !== "body") return;
        if (conflictFlags[data.row.index]) {
          data.cell.styles.fillColor = CONFLICT_BG;
          data.cell.styles.textColor = CONFLICT_TEXT;
        } else if (transitions[data.row.index] || duplicates[data.row.index]) {
          data.cell.styles.fillColor = WARNING_BG;
          data.cell.styles.textColor = WARNING_TEXT;
        }
      },
    });

    // jspdf-autotable attaches this property to the doc instance at runtime; no public type for it.
    cursorY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  }

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(MUTED);
    doc.text(`หน้า ${i}/${pageCount}`, pageWidth - margin, pageHeight - 8, { align: "right" });
  }

  doc.save("bkkiff-my-plan.pdf");
}
