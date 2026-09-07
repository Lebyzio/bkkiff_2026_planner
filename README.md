# BKKIFF Planner

เว็บแอปสำหรับวางแผนดูหนังเทศกาล Bangkok International Film Festival

- **Create Plan** — ดูตารางฉายแบบรายวัน กรองตามโรงหนัง เวลาที่สะดวก วันธรรมดา/เสาร์-อาทิตย์ และหนังที่อยากดู แล้วเลือกรอบที่จะไปดูเก็บไว้เป็น "แผนของฉัน"
- **Overview Schedule** — ตารางภาพรวมทั้งเทศกาล (โรงหนัง × วันที่) แบบเดียวกับ Tab "ปฏิทินรายวัน" ในไฟล์ Excel ต้นฉบับ กดที่รอบฉายในตารางเพื่อเพิ่ม/เอาออกจากแผนได้เลย
- ชื่อหนังแสดงปี ค.ศ. ต่อท้าย (เช่น "Rose (2023)") ทั้งสองหน้า, ในแผนของฉัน, และใน PDF ที่ export
- เลือกโรงหนังในตัวกรองแล้วจะมีตัวกรองย่อยของโรง/ห้องฉาย (เช่น Samyan Mitrtown → Theater 3, Theater 4) ให้กรองละเอียดขึ้นอีกชั้น
- หนังที่มีรอบฉายเดียวในเทศกาลจะมี badge "★ รอบเดียว" เตือนไว้ ทั้งในตั๋ว, overview grid, แผนของฉัน และ PDF
- รอบฉายที่ทับเวลากับรอบที่เลือกไว้แล้ว **จะถูกล็อกไม่ให้เลือกซ้ำ** ทันที (ไม่ใช่แค่เตือนทีหลัง) พร้อมบอกว่าไปทับกับรอบไหน
- ถ้าเปลี่ยนโรงระหว่างสองรอบที่เลือกไว้ในเวลาไม่ถึง 45 นาที ระบบจะ**เตือน** (ไม่บล็อก) ว่าเปลี่ยนโรงกระชั้นชิดเกินไป — ยังเลือกได้ตามปกติ
- ถ้าเลือกหนังเรื่องเดียวกันซ้ำ (คนละรอบ) ระบบจะ**เตือน** (ไม่บล็อก) ด้วย badge "⚠ หนังซ้ำในแผน" — เผื่อเป็นการดูซ้ำโดยตั้งใจ (เช่น อยากไป Q&A สองรอบ)
- **ดาวน์โหลดแผนเป็น PDF** ได้ (จัดกลุ่มตามวันที่ ไฮไลต์แถวสีส้มเมื่อเปลี่ยนโรงกระชั้นชิดหรือดูหนังซ้ำ)

Built with Next.js (App Router) + TypeScript + Tailwind CSS v4. No backend — the schedule is static data generated at build time from the festival's spreadsheet, and your plan/filters are saved to `localStorage` in your own browser.

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm test` | Run the unit test suite (Vitest) |
| `npm run generate:data` | Re-parse `BKKIFF_Schedule/BKKIFF_2026_Schedule.xlsx` into `src/data/screenings.json` |
| `npm run generate:pdf-font` | Re-encode `assets/fonts/NotoSansThai-Regular.ttf` into `src/lib/pdfFont.generated.ts` |

## Updating the schedule

The source of truth is `BKKIFF_Schedule/BKKIFF_2026_Schedule_V2.xlsx`, sheet "รายการฉายทั้งหมด" (columns: date, day, time, title, year, venue, theater, duration, Q&A, note). If the festival publishes an updated spreadsheet with the same columns, drop it in that path (update `SOURCE` in `scripts/generate-schedule.mjs` if the filename changes) and run:

```bash
npm run generate:data
```

This regenerates `src/data/screenings.json`, which the app imports directly (no runtime fetch). If a new venue appears in the sheet, add it to the `VENUES` list in `scripts/generate-schedule.mjs` first — the script throws if it finds a venue it doesn't recognize.

## How it's organized

- `src/lib/schedule.ts` — pure functions: filtering (venue, per-venue theater, time-of-day, weekday/weekend via `dayType`, movie), grouping by date, venue×date lookups, hard-conflict detection (`overlaps`, `findConflicts` for already-planned pairs, `findConflictingPlanned` used to lock out a new selection before it's made), the soft tight-transition warning (`transitionGapMinutes`, `findTightTransition`, `TIGHT_TRANSITION_MINUTES`), the soft duplicate-movie warning (`findDuplicateTitle`), and single-screening detection (`isSingleScreening`). Covered by `src/lib/schedule.test.ts`.
- `src/lib/format.ts` — display formatting, including `titleWithYear` (appends "(2026)" after a title when the source data has a year).
- `src/lib/usePlan.ts`, `src/lib/useFilters.ts` — localStorage-backed state (your selected screenings and filter selections), built on a small `useSyncExternalStore` store so every component stays in sync without prop drilling — this is also what lets the Overview grid, the Create Plan tickets, and the plan drawer all reflect the same plan instantly.
- `src/lib/exportPlanPdf.ts` — builds the "My Plan" PDF client-side with jsPDF + jspdf-autotable, embedding a vendored Thai font (see `assets/fonts/NOTICE.md`) since jsPDF's built-in fonts can't render Thai text.
- `src/components/` — `AppShell` (header + tab nav + plan drawer, shared by every route), `Header`, `TabNav`, `FilterBar` (+ `MovieFilterCombobox`), `DaySection`, `ScreeningTicket`, `OverviewGrid` (+ `MiniScreeningChip`), `PlanDrawer`, `QnaBadge`, `TransitionWarningBadge`, `DuplicateTitleBadge`, `SingleScreeningBadge`.
- `src/app/page.tsx` — Create Plan (`/`). `src/app/overview/page.tsx` — Overview Schedule (`/overview`). Both share the `AppShell` layout in `src/app/layout.tsx`.

## Design notes

Dark cinema-marquee theme: gold accent, one accent color per venue (used consistently across filter chips, ticket cards, and the overview grid), and screenings rendered as perforated ticket stubs. A ticket's border turns venue-colored once added to your plan. The "Q&A ผู้กำกับ" badge is a solid red pill everywhere it appears, so director Q&A sessions stand out at a glance. A blue "★ รอบเดียว" pill marks movies with only one screening in the whole festival.

Conflict handling is prevention-first: as soon as a screening is in your plan, anything else that overlaps it in time — at any venue, since you can only be in one place — is disabled (🔒, dimmed, with a tooltip naming what it clashes with) rather than merely flagged after you pick it. The red "เวลาซ้อนกัน" badge/border still exists as a fallback for a plan that already contains a clash (e.g. from data saved before this behavior existed), but the normal flow no longer lets you create one.

Switching venues is a softer call — `TIGHT_TRANSITION_MINUTES` (45, in `schedule.ts`) is a flat rule-of-thumb buffer, not real transit-time data for any specific pair of venues. Below it, the screening gets an amber "⚠ เปลี่ยนโรงกระชั้นชิด" warning (ticket badge, mini-chip icon, plan-drawer banner, and a highlighted PDF row) but stays fully selectable — same-venue back-to-backs are never flagged, since there's no travel involved.

Picking a second screening of a movie already in your plan is treated the same way — a soft, non-blocking amber "⚠ หนังซ้ำในแผน" warning, since re-watching a film or catching a second Q&A can be intentional.
