"use client";

interface HeaderProps {
  plannedCount: number;
  onOpenPlan: () => void;
}

const VERSION = "1.0.1"; // Updated on 07/09/2026 23:00

export function Header({ plannedCount, onOpenPlan }: HeaderProps) {
  return (
    <header className="border-b border-accent/30 bg-bg">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <div>
          <h1 className="flex items-baseline gap-2 font-display leading-none tracking-wide text-text">
            <span className="text-3xl text-accent sm:text-4xl">BKKIFF</span>
            <span className="text-lg text-text-muted sm:text-xl">PLANNER {VERSION}</span>
          </h1>
          <p className="mt-1 text-xs text-text-muted sm:text-sm">
            Bangkok International Film Festival 2026 · 13 - 27 กันยายน
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenPlan}
          className="transition-standard flex shrink-0 items-center gap-2 rounded-full border border-accent bg-accent/10 px-4 py-2 text-sm font-medium text-accent hover:bg-accent/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          <span>แผนของฉัน</span>
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 font-mono text-xs text-accent-ink">
            {plannedCount}
          </span>
        </button>
      </div>
    </header>
  );
}
