"use client";

import { useMemo, useRef, useState } from "react";

interface MovieFilterComboboxProps {
  allTitles: string[];
  selected: string[];
  onChange: (titles: string[]) => void;
}

export function MovieFilterCombobox({ allTitles, selected, onChange }: MovieFilterComboboxProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const suggestions = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return allTitles.filter((t) => !selected.includes(t) && t.toLowerCase().includes(q)).slice(0, 8);
  }, [allTitles, query, selected]);

  function addTitle(title: string) {
    onChange([...selected, title]);
    setQuery("");
    inputRef.current?.focus();
  }

  function removeTitle(title: string) {
    onChange(selected.filter((t) => t !== title));
  }

  return (
    <div className="relative">
      <label htmlFor="movie-search" className="mb-1.5 block text-xs font-medium text-text-muted">
        หนังที่อยากดู
      </label>
      <input
        id="movie-search"
        ref={inputRef}
        type="text"
        value={query}
        placeholder="พิมพ์ชื่อหนังเพื่อค้นหา…"
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        className="w-full rounded-md border border-border bg-bg-elevated px-3 py-2 text-sm text-text placeholder:text-text-muted focus:border-accent focus:outline-none"
      />
      {open && suggestions.length > 0 && (
        <ul className="absolute z-20 mt-1 w-full overflow-hidden rounded-md border border-border bg-bg-elevated shadow-lg">
          {suggestions.map((title) => (
            <li key={title}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => addTitle(title)}
                className="block w-full truncate px-3 py-2 text-left text-sm text-text hover:bg-bg-ticket"
              >
                {title}
              </button>
            </li>
          ))}
        </ul>
      )}
      {selected.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {selected.map((title) => (
            <span
              key={title}
              className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-accent/40 bg-accent/10 px-2.5 py-1 text-xs text-text"
            >
              <span className="truncate">{title}</span>
              <button
                type="button"
                onClick={() => removeTitle(title)}
                aria-label={`เอา ${title} ออกจากตัวกรอง`}
                className="text-text-muted hover:text-text"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
