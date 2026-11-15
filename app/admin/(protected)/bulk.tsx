"use client";

import { useState, type ReactNode } from "react";
import Modal from "./Modal";

/** Row selection for a list of ids. Selection is always filtered to the ids currently shown. */
export function useSelection(ids: string[]) {
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const selected = ids.filter((id) => picked.has(id));
  const allSelected = ids.length > 0 && selected.length === ids.length;

  return {
    selected,
    count: selected.length,
    allSelected,
    someSelected: selected.length > 0 && !allSelected,
    has: (id: string) => picked.has(id),
    toggle: (id: string) =>
      setPicked((s) => {
        const next = new Set(s);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      }),
    toggleAll: () =>
      setPicked((s) => {
        const next = new Set(s);
        if (ids.length > 0 && ids.every((id) => s.has(id))) ids.forEach((id) => next.delete(id));
        else ids.forEach((id) => next.add(id));
        return next;
      }),
    clear: () => setPicked(new Set()),
  };
}

export type Selection = ReturnType<typeof useSelection>;

export function Check({ checked, indeterminate, onChange, label }: { checked: boolean; indeterminate?: boolean; onChange: () => void; label: string }) {
  return (
    <input
      type="checkbox"
      aria-label={label}
      className="admin-check"
      checked={checked}
      ref={(el) => {
        if (el) el.indeterminate = !!indeterminate;
      }}
      onChange={onChange}
      onClick={(e) => e.stopPropagation()}
    />
  );
}

/** Floating action bar that appears while anything is selected. */
export function BulkBar({ count, noun, onClear, children }: { count: number; noun: string; onClear: () => void; children: ReactNode }) {
  if (count === 0) return null;
  return (
    <div className="admin-bulkbar" role="toolbar" aria-label="Bulk actions">
      <div className="flex items-center gap-2.5 pr-3">
        <span className="admin-bulkbar-count">{count}</span>
        <span className="font-display text-[12px] font-bold uppercase tracking-[0.12em] text-text">
          {noun}
          {count === 1 ? "" : "s"} selected
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-2">{children}</div>
      <button type="button" onClick={onClear} className="ml-1 px-2 text-[11px] font-semibold uppercase tracking-wide text-text-dim hover:text-text">
        Clear
      </button>
    </div>
  );
}

export function BulkButton({ onClick, tone = "default", disabled, children }: { onClick: () => void; tone?: "default" | "danger" | "good"; disabled?: boolean; children: ReactNode }) {
  const color = tone === "danger" ? "border-red/60 text-red hover:bg-red/10" : tone === "good" ? "border-green/60 text-green hover:bg-green/10" : "border-line text-text hover:border-purple hover:text-purple";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`border bg-white/[0.03] px-3 py-1.5 font-display text-[11px] font-bold uppercase tracking-[0.1em] transition-colors disabled:opacity-40 ${color}`}
    >
      {children}
    </button>
  );
}

export function BulkConfirm({ open, title, message, confirmLabel, busy, onConfirm, onClose }: { open: boolean; title: string; message: ReactNode; confirmLabel: string; busy: boolean; onConfirm: () => void; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title={title} accent="amber">
      <div>
        <p className="text-sm text-text-dim">{message}</p>
        <div className="mt-5 flex gap-3">
          <button type="button" onClick={onConfirm} disabled={busy} className="btn btn-primary flex-1 !bg-red !shadow-none">
            {busy ? "Working…" : confirmLabel}
          </button>
          <button type="button" onClick={onClose} className="btn btn-outline flex-1">
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  );
}
