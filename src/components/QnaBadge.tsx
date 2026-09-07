export function QnaBadge({ compact = false }: { compact?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-semibold text-white ${
        compact ? "px-1.5 py-0.5 text-[9px]" : "px-2 py-0.5 text-[11px]"
      }`}
      style={{ backgroundColor: "var(--color-qna)" }}
    >
      Q&A ผู้กำกับ
    </span>
  );
}
