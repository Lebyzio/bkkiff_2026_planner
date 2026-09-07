const THAI_MONTHS_SHORT = [
  "ม.ค.",
  "ก.พ.",
  "มี.ค.",
  "เม.ย.",
  "พ.ค.",
  "มิ.ย.",
  "ก.ค.",
  "ส.ค.",
  "ก.ย.",
  "ต.ค.",
  "พ.ย.",
  "ธ.ค.",
];

/** "2026-09-13" -> "13 ก.ย." */
export function formatDateShort(iso: string): string {
  const [, month, day] = iso.split("-").map(Number);
  return `${day} ${THAI_MONTHS_SHORT[month - 1]}`;
}

/** "2026-09-13" + "อาทิตย์" -> "วันอาทิตย์ที่ 13 ก.ย." */
export function formatDateHeading(iso: string, dayThai: string): string {
  return `วัน${dayThai}ที่ ${formatDateShort(iso)}`;
}

/** 140 -> "2 ชม. 20 นาที"; 45 -> "45 นาที" */
export function formatDuration(minutes: number | null): string {
  if (minutes == null) return "ไม่ระบุความยาว";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} นาที`;
  if (m === 0) return `${h} ชม.`;
  return `${h} ชม. ${m} นาที`;
}

/** "Rose" + 2023 -> "Rose (2023)"; falls back to the bare title when the year is unknown (e.g. anthology programmes). */
export function titleWithYear(title: string, year: number | null): string {
  return year != null ? `${title} (${year})` : title;
}
