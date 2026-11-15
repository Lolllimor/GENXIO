"use client";

import { useRef, type ReactNode } from "react";

export function PanelSection({ title, children, aside }: { title: string; children: ReactNode; aside?: ReactNode }) {
  return (
    <section className="border-b border-line px-4 py-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-display text-[11px] font-bold uppercase tracking-[0.18em] text-purple">{title}</h3>
        {aside}
      </div>
      {children}
    </section>
  );
}

export function Slider({ label, value, min, max, step = 1, onChange, fmt }: { label: string; value: number; min: number; max: number; step?: number; onChange: (v: number) => void; fmt?: (v: number) => string }) {
  return (
    <label className="mb-2.5 block !normal-case">
      <div className="mb-1 flex justify-between text-[10.5px] uppercase tracking-[0.1em] text-text-dim">
        <span>{label}</span>
        <span className="text-text">{fmt ? fmt(value) : value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="!h-4 !min-h-0 !border-0 !bg-transparent !p-0 accent-[var(--purple)]"
      />
    </label>
  );
}

export function Segmented<T extends string>({ value, options, onChange }: { value: T; options: { id: T; label: string; hint?: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="grid grid-flow-col gap-1.5">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          title={o.hint}
          onClick={() => onChange(o.id)}
          className={`admin-chip justify-center ${value === o.id ? "admin-chip-active" : ""}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function EyeButton({ hidden, onClick, label }: { hidden: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={`shrink-0 ${hidden ? "text-text-dim/50" : "text-text-dim hover:text-text"}`}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
        <circle cx="12" cy="12" r="3" />
        {hidden && <path d="M3 3l18 18" />}
      </svg>
    </button>
  );
}

export function UploadButton({ label, onFile, compact }: { label: string; onFile: (f: File) => void; compact?: boolean }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
          e.target.value = "";
        }}
      />
      <button
        type="button"
        onClick={() => ref.current?.click()}
        className={`btn btn-outline ${compact ? "!px-3 !py-1.5 !text-[10px]" : "w-full !py-2 !text-[10.5px]"}`}
      >
        {label}
      </button>
    </>
  );
}

export function Thumb({ src, active, onClick, label, onRemove }: { src: string; active: boolean; onClick: () => void; label?: string; onRemove?: () => void }) {
  return (
    <div className="group relative">
      <button
        type="button"
        onClick={onClick}
        title={label}
        className={`block aspect-square w-full overflow-hidden border bg-black ${active ? "border-purple shadow-[0_0_12px_rgba(139,92,246,0.6)]" : "border-line hover:border-text-dim"}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={label ?? ""} className="h-full w-full object-cover" />
      </button>
      {onRemove && (
        <button
          type="button"
          aria-label="Remove from library"
          onClick={onRemove}
          className="absolute right-0.5 top-0.5 hidden h-5 w-5 items-center justify-center bg-black/80 text-[11px] text-red group-hover:flex"
        >
          ×
        </button>
      )}
    </div>
  );
}
