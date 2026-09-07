// Regenerates src/data/screenings.json from the festival's source spreadsheet.
// Run with: npm run generate:data
import * as XLSX from "xlsx";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SOURCE = path.join(
  __dirname,
  "..",
  "BKKIFF_Schedule",
  "BKKIFF_2026_Schedule_V2.xlsx",
);
const OUTPUT = path.join(__dirname, "..", "src", "data", "screenings.json");
const SHEET_NAME = "รายการฉายทั้งหมด";

// Maps the full venue name used in the spreadsheet to a stable id + display
// metadata used throughout the app. Update here if the festival adds venues.
const VENUES = [
  {
    id: "iconsiam",
    match: "IconSiam - Icon Cine Conic",
    name: "IconSiam",
    fullName: "IconSiam - Icon Cine Conic",
    color: "#E8B84B",
  },
  {
    id: "cloud11",
    match: "Cloud 11 - Doc Club & Friends",
    name: "Cloud 11",
    fullName: "Cloud 11 - Doc Club & Friends",
    color: "#45A399",
  },
  {
    id: "samyan",
    match: "Samyan Mitrtown - House Samyan",
    name: "Samyan Mitrtown",
    fullName: "Samyan Mitrtown - House Samyan",
    color: "#9B7FD4",
  },
  {
    id: "paragon",
    match: "Siam Paragon - Paragon Cineplex",
    name: "Siam Paragon",
    fullName: "Siam Paragon - Paragon Cineplex",
    color: "#5AA9E6",
  },
  {
    id: "centralworld",
    match: "CentralWorld - SF World Cinema",
    name: "CentralWorld",
    fullName: "CentralWorld - SF World Cinema",
    color: "#E0729A",
  },
];

function venueByFullName(fullName) {
  const venue = VENUES.find((v) => v.match === fullName);
  if (!venue) {
    throw new Error(`Unknown venue in spreadsheet: "${fullName}"`);
  }
  return venue;
}

function excelSerialToISODate(serial) {
  // Excel's day-0 epoch is 1899-12-30 (accounts for the historical leap-year bug).
  const epoch = Date.UTC(1899, 11, 30);
  const ms = epoch + serial * 86400000;
  return new Date(ms).toISOString().slice(0, 10);
}

function addMinutesToTime(time, minutes) {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + minutes;
  const wrapped = ((total % 1440) + 1440) % 1440;
  const endH = Math.floor(wrapped / 60);
  const endM = wrapped % 60;
  return `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`;
}

function slugify(text) {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function main() {
  const buf = readFileSync(SOURCE);
  const workbook = XLSX.read(buf, { type: "buffer", cellDates: false });
  const sheet = workbook.Sheets[SHEET_NAME];
  if (!sheet) {
    throw new Error(`Sheet "${SHEET_NAME}" not found in workbook`);
  }
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: true });

  const screenings = [];
  const idCounts = new Map();

  for (const row of rows.slice(1)) {
    const [dateSerial, dayThai, time, title, year, venueFullName, theater, duration, qna, note] = row;
    if (dateSerial == null || !title || typeof dateSerial !== "number") continue;

    const date = excelSerialToISODate(dateSerial);
    const venue = venueByFullName(venueFullName);
    const durationMin = typeof duration === "number" ? duration : null;

    const baseId = slugify(`${date}-${time}-${venue.id}-${title}`);
    const count = idCounts.get(baseId) ?? 0;
    idCounts.set(baseId, count + 1);
    const id = count === 0 ? baseId : `${baseId}-${count}`;

    screenings.push({
      id,
      date,
      dayThai,
      time,
      endTime: durationMin != null ? addMinutesToTime(time, durationMin) : null,
      title,
      year: typeof year === "number" ? year : null,
      venueId: venue.id,
      theater: theater && theater !== "-" ? theater : null,
      durationMin,
      qna: qna === "Q&A",
      note: note || null,
    });
  }

  screenings.sort((a, b) =>
    a.date === b.date ? a.time.localeCompare(b.time) : a.date.localeCompare(b.date),
  );

  const venues = VENUES.map((v) => ({ id: v.id, name: v.name, fullName: v.fullName, color: v.color }));
  const output = { venues, screenings };
  writeFileSync(OUTPUT, JSON.stringify(output, null, 2) + "\n");
  console.log(`Wrote ${screenings.length} screenings to ${path.relative(process.cwd(), OUTPUT)}`);
}

main();
