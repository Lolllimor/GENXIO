"use client";

import { useEffect } from "react";

export default function Modal({
  open,
  onClose,
  title,
  accent = "purple",
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  accent?: "purple" | "amber";
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex animate-[modal-backdrop-in_0.15s_ease-out] justify-center overflow-y-auto bg-bg/80 px-5 py-10 backdrop-blur-sm [align-items:safe_center]"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="admin-panel flex max-h-full w-full max-w-lg shrink-0 animate-[modal-in_0.18s_cubic-bezier(0.16,1,0.3,1)] flex-col !p-0">
        <div
          className={`flex shrink-0 items-center justify-between border-b border-line px-5 py-3.5 font-display text-[11px] uppercase tracking-[0.16em] ${
            accent === "amber" ? "text-amber" : "text-purple"
          }`}
        >
          {title}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-text-dim hover:text-text"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="4" y1="4" x2="20" y2="20" />
              <line x1="20" y1="4" x2="4" y2="20" />
            </svg>
          </button>
        </div>
        <div className="overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}
