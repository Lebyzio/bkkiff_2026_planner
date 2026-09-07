export function SingleScreeningBadge({ compact = false }: { compact?: boolean }) {
  return (
    <span
      title="หนังเรื่องนี้มีรอบฉายเดียวในเทศกาล พลาดแล้วพลาดเลย"
      className={`inline-flex items-center gap-1 rounded-full font-semibold ${
        compact ? "px-1.5 py-0.5 text-[9px]" : "px-2 py-0.5 text-[11px]"
      }`}
      style={{ backgroundColor: "var(--color-rare)", color: "var(--color-rare-ink)" }}
    >
      ★ รอบเดียว
    </span>
  );
}
