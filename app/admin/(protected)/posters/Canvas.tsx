"use client";

import { useEffect, useRef, useState, type Ref } from "react";
import { FORMATS } from "./formats";
import PosterView from "./PosterView";
import type { Adjust, PosterDoc } from "./types";

export default function Canvas({
  doc,
  selected,
  select,
  setAdjust,
  innerRef,
}: {
  doc: PosterDoc;
  selected: string | null;
  select: (id: string | null) => void;
  setAdjust: (id: string, patch: Partial<Adjust>) => void;
  innerRef: Ref<HTMLDivElement>;
}) {
  const box = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 600, h: 700 });
  const { w, h } = FORMATS[doc.format];

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const pad = 40;
  const scale = Math.max(0.1, Math.min((size.w - pad) / w, (size.h - pad) / h, 1));

  return (
    <div
      ref={box}
      className="relative flex h-full min-h-[420px] items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_50%_40%,#17131f,#09090d)]"
      style={{ backgroundImage: "radial-gradient(circle at 50% 40%, #17131f, #09090d), linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)", backgroundSize: "auto, 32px 32px, 32px 32px" }}
      onPointerDown={() => select(null)}
    >
      <div style={{ width: w * scale, height: h * scale }} className="shrink-0 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.9)] ring-1 ring-white/10">
        <div style={{ width: w, height: h, transform: `scale(${scale})`, transformOrigin: "top left" }}>
          <PosterView doc={doc} innerRef={innerRef} selected={selected} interactive scale={scale} select={select} setAdjust={setAdjust} />
        </div>
      </div>
      <div className="pointer-events-none absolute bottom-3 left-4 text-[10.5px] uppercase tracking-[0.12em] text-text-dim">
        {w}×{h} · {Math.round(scale * 100)}% · click to select, drag to move
      </div>
    </div>
  );
}
