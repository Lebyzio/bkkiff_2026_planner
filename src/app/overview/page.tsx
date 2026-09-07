import { OverviewGrid } from "@/components/OverviewGrid";

export default function OverviewSchedulePage() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-6 sm:px-6">
      <div>
        <h1 className="font-display text-2xl tracking-wide text-text sm:text-3xl">
          ตารางฉายทั้งเทศกาล
        </h1>
        <p className="mt-1 text-xs text-text-muted sm:text-sm">
          โรงหนัง × วันที่ — เลื่อนดูตารางได้ทั้งแนวตั้งแนวนอน กดที่รอบฉายเพื่อเพิ่มเข้าแผนของฉัน
        </p>
      </div>
      <OverviewGrid />
    </main>
  );
}
