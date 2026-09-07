"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "CREATE PLAN" },
  { href: "/overview", label: "OVERVIEW SCHEDULE" },
] as const;

export function TabNav() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-border-soft bg-bg">
      <div className="mx-auto flex max-w-6xl gap-1 px-4 sm:px-6">
        {TABS.map((tab) => {
          const active = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? "page" : undefined}
              className="transition-standard relative px-4 py-3 font-display text-sm tracking-wider sm:text-base"
              style={{ color: active ? "var(--color-accent)" : "var(--color-text-muted)" }}
            >
              {tab.label}
              {active && <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-accent" />}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
