import { formatDateShort } from "@/lib/format";
import type { Screening } from "@/lib/types";

export function DuplicateTitleBadge({
  duplicate,
  compact = false,
}: {
  duplicate: Screening;
  compact?: boolean;
}) {
  return (
    <span
      title={`"${duplicate.title}" อยู่ในแผนแล้ว (${formatDateShort(duplicate.date)} ${duplicate.time})`}
      className={`inline-flex items-center gap-1 rounded-full font-semibold ${
        compact ? "px-1.5 py-0.5 text-[9px]" : "px-2 py-0.5 text-[11px]"
      }`}
      style={{ backgroundColor: "var(--color-warning)", color: "var(--color-warning-ink)" }}
    >
      ⚠ หนังซ้ำในแผน
    </span>
  );
}
