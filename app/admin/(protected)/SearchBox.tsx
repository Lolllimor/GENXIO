"use client";

import { useEffect, useRef } from "react";

export default function SearchBox({
  value,
  onChange,
  placeholder = "Search…",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const t = e.target as HTMLElement | null;
      const typing = t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT");
      if (e.key === "/" && !typing) {
        e.preventDefault();
        ref.current?.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="relative w-full max-w-xs">
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-dim"
      >
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </svg>
      <input
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === "Escape" && (onChange(""), ref.current?.blur())}
        placeholder={placeholder}
        className="!pl-9 !pr-9"
      />
      <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 border border-line px-1.5 text-[10px] text-text-dim">
        /
      </kbd>
    </div>
  );
}
