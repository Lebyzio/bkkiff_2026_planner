import type { TightTransition } from "@/lib/schedule";

export function TransitionWarningBadge({
  transition,
  compact = false,
}: {
  transition: TightTransition;
  compact?: boolean;
}) {
  return (
    <span
      title={`เหลือเวลาเปลี่ยนโรงแค่ ${transition.gapMinutes} นาที ก่อน/หลัง "${transition.screening.title}" (${transition.screening.time})`}
      className={`inline-flex items-center gap-1 rounded-full font-semibold ${
        compact ? "px-1.5 py-0.5 text-[9px]" : "px-2 py-0.5 text-[11px]"
      }`}
      style={{ backgroundColor: "var(--color-warning)", color: "var(--color-warning-ink)" }}
    >
      ⚠ เปลี่ยนโรงกระชั้นชิด ({transition.gapMinutes} นาที)
    </span>
  );
}
