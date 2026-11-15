"use client";
/* eslint-disable @next/next/no-img-element */

import { useRef, type CSSProperties, type ReactNode } from "react";
import { FORMATS } from "./formats";
import { NO_ADJUST, usePoster } from "./context";
import { BRAND, FONT_DISPLAY, METAL, rgba, shade } from "./theme";

/* ---------- editable block: selectable, draggable, hideable ---------- */

export function Block({ id, children, style }: { id: string; children: ReactNode; style?: CSSProperties }) {
  const c = usePoster();
  const k = c.key(id);
  const adj = c.doc.adjust[k] ?? NO_ADJUST;
  const selected = c.selected === id && !c.exporting;
  const drag = useRef<{ x: number; y: number; dx: number; dy: number } | null>(null);

  if (c.doc.hidden[k]) return null;

  function onDown(e: React.PointerEvent) {
    if (!c.interactive) return;
    e.stopPropagation();
    c.select(id);
    drag.current = { x: e.clientX, y: e.clientY, dx: adj.dx, dy: adj.dy };
    const move = (ev: PointerEvent) => {
      const s = drag.current;
      if (!s) return;
      c.setAdjust(id, {
        dx: Math.round(s.dx + (ev.clientX - s.x) / c.scale),
        dy: Math.round(s.dy + (ev.clientY - s.y) / c.scale),
      });
    };
    const up = () => {
      drag.current = null;
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }

  return (
    <div
      data-block={id}
      onPointerDown={onDown}
      style={{
        transform: `translate(${adj.dx}px,${adj.dy}px)`,
        outline: selected ? `2px dashed ${c.accent}` : "none",
        outlineOffset: 8,
        cursor: c.interactive ? "move" : undefined,
        touchAction: "none",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/* ---------- text ---------- */

interface TProps {
  id: string;
  size: number;
  weight?: number;
  italic?: boolean;
  color?: string;
  tracking?: number; // em ×100
  upper?: boolean;
  lh?: number;
  metal?: boolean;
  align?: CSSProperties["textAlign"];
  style?: CSSProperties;
}

export function T({ id, size, weight = 700, italic, color = "#fff", tracking = 0, upper = true, lh = 1.04, metal, align = "center", style }: TProps) {
  const c = usePoster();
  const text = c.val(id);
  const adj = c.doc.adjust[c.key(id)] ?? NO_ADJUST;
  if (!text.trim()) return null;

  const base: CSSProperties = {
    fontFamily: FONT_DISPLAY,
    fontSize: size * adj.scale,
    fontWeight: weight,
    fontStyle: italic ? "italic" : "normal",
    letterSpacing: `${tracking / 100}em`,
    paddingLeft: tracking > 20 ? `${tracking / 100}em` : undefined,
    textTransform: upper ? "uppercase" : "none",
    lineHeight: lh,
    whiteSpace: "pre-line",
    textAlign: align,
    ...(italic ? { transform: "skewX(-8deg)", padding: "0 0.12em" } : {}),
    ...(metal
      ? {
          background: METAL,
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          color: "transparent",
          filter: "drop-shadow(0 6px 20px rgba(0,0,0,0.75))",
        }
      : { color }),
    ...style,
  };

  return (
    <Block id={id}>
      <div style={base}>{text}</div>
    </Block>
  );
}

/* ---------- images ---------- */

export function Pic({ id, w, h, fit = "contain", fallback, style }: { id: string; w: number; h: number; fit?: "contain" | "cover"; fallback?: ReactNode; style?: CSSProperties }) {
  const c = usePoster();
  const src = c.img(id);
  const adj = c.doc.adjust[c.key(id)] ?? NO_ADJUST;
  if (!src && !fallback) return null;
  const W = w * adj.scale;
  const H = h * adj.scale;
  return (
    <Block id={id}>
      {src ? (
        <img src={src} alt="" style={{ width: W, height: H, objectFit: fit, display: "block", ...style }} />
      ) : (
        <div style={{ width: W, height: H }}>{fallback}</div>
      )}
    </Block>
  );
}

/** First letter of the team name + "¹" (Team Alpha → T¹), unless an explicit tag is given. */
export function teamTag(name: string, tag?: string) {
  const t = tag?.trim();
  if (t) return t;
  const first = name.trim().charAt(0).toUpperCase();
  return first ? `${first}¹` : "G¹";
}

/** Hexagon placeholder shown until a team logo is uploaded. */
export function Emblem({ name = "", tag }: { name?: string; tag?: string }) {
  const c = usePoster();
  const text = teamTag(name, tag);
  const size = text.length > 2 ? 26 : text.length > 1 ? 36 : 44;
  return (
    <svg viewBox="0 0 100 100" width="100%" height="100%">
      <polygon points="50,4 92,27 92,73 50,96 8,73 8,27" fill={rgba(c.accent, 0.12)} stroke={c.accent} strokeWidth="2.5" />
      <text x="50" y={50 + size * 0.34} textAnchor="middle" fontSize={size} fontWeight="700" fill="#fff" fontFamily="inherit" fontStyle="italic">
        {text}
      </text>
    </svg>
  );
}

/* ---------- canvas shell: backdrop, shards, padding ---------- */

export function Shell({ children, shards = true }: { children: ReactNode; shards?: boolean }) {
  const c = usePoster();
  const { w, h } = FORMATS[c.doc.format];
  const bg = c.doc.bg;
  const accent = c.accent;
  const deep = shade(accent, 0.55);

  return (
    <div
      onPointerDown={() => c.interactive && c.select(null)}
      style={{
        width: w,
        height: h,
        position: "relative",
        overflow: "hidden",
        background: `radial-gradient(ellipse at 50% 28%, ${BRAND.steel} 0%, ${BRAND.charcoal} 48%, ${BRAND.black} 100%)`,
        fontFamily: FONT_DISPLAY,
        color: "#fff",
      }}
    >
      {bg.src && (
        <img
          src={bg.src}
          alt=""
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: `${bg.x}% ${bg.y}%`,
            transform: `scale(${bg.zoom})`,
            transformOrigin: `${bg.x}% ${bg.y}%`,
            filter: bg.grayscale ? "grayscale(1) contrast(1.1)" : "none",
          }}
        />
      )}
      <div style={{ position: "absolute", inset: 0, background: `rgba(5,5,7,${bg.dim})` }} />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg,rgba(5,5,7,0.6) 0%,rgba(5,5,7,0.08) 28%,rgba(5,5,7,0.0) 52%,rgba(5,5,7,0.88) 100%)" }} />

      {shards && (
        <>
      {/* soft central darkening so text stays readable on any photo */}
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 75% 45% at 50% 38%, rgba(5,5,7,0.5), transparent 70%)" }} />

      {/* corner shards */}
      <div style={{ position: "absolute", top: 0, left: 0, width: 300, height: 300, background: `linear-gradient(135deg,${accent},${deep})`, clipPath: "polygon(0 0,100% 0,0 100%)", opacity: 0.9 }} />
      <div style={{ position: "absolute", top: 0, left: 0, width: 190, height: 190, background: "rgba(5,5,8,0.92)", clipPath: "polygon(0 0,100% 0,0 100%)" }} />
      <div style={{ position: "absolute", bottom: 0, right: 0, width: 260, height: 260, background: `linear-gradient(315deg,${accent},${deep})`, clipPath: "polygon(100% 0,100% 100%,0 100%)", opacity: 0.92 }} />
      <div style={{ position: "absolute", bottom: 0, right: 0, width: 156, height: 156, background: "rgba(5,5,8,0.9)", clipPath: "polygon(100% 0,100% 100%,0 100%)" }} />
        </>
      )}

      <div style={{ position: "absolute", inset: 0, padding: "54px 64px 50px", display: "flex", flexDirection: "column", alignItems: "center" }}>
        {children}
      </div>
    </div>
  );
}

export const Spacer = ({ min = 16 }: { min?: number }) => <div style={{ flex: 1, minHeight: min }} />;

/* ---------- decorative pieces ---------- */

export function Brackets({ children }: { children: ReactNode }) {
  const c = usePoster();
  const line = `3px solid ${c.accent}`;
  return (
    <div style={{ position: "relative", padding: "6px 56px", width: "100%" }}>
      <div style={{ position: "absolute", left: 6, top: 0, width: 74, height: 130, borderLeft: line, borderTop: line }} />
      <div style={{ position: "absolute", right: 6, bottom: 0, width: 74, height: 130, borderRight: line, borderBottom: line }} />
      {children}
    </div>
  );
}

export function Notch({ width = 400 }: { width?: number }) {
  const c = usePoster();
  const m = width / 2;
  return (
    <svg width={width} height={24} viewBox={`0 0 ${width} 24`} fill="none" style={{ display: "block" }}>
      <path d={`M0 6H${m - 30}L${m} 22L${m + 30} 6H${width}`} stroke={c.accent} strokeWidth="2" />
    </svg>
  );
}

export function VDivider({ h = 92 }: { h?: number }) {
  const c = usePoster();
  return <div style={{ width: 2, height: h, background: `linear-gradient(180deg,transparent,${rgba(c.accent, 0.75)},transparent)` }} />;
}

export function Footer() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 22, justifyContent: "center", width: "100%" }}>
      <div style={{ width: 120, height: 2, background: "linear-gradient(90deg,transparent,#6b6b80)" }} />
      <T id="tagline" size={22} weight={500} tracking={55} color={BRAND.silverDim} style={{ whiteSpace: "nowrap" }} />
      <div style={{ width: 120, height: 2, background: "linear-gradient(270deg,transparent,#6b6b80)" }} />
    </div>
  );
}

/* ---------- icons ---------- */

const ICON_PATHS: Record<string, ReactNode> = {
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </>
  ),
  crosshair: (
    <>
      <circle cx="12" cy="12" r="6.5" />
      <circle cx="12" cy="12" r="1.2" />
      <path d="M12 2v5M12 17v5M2 12h5M17 12h5" />
    </>
  ),
  layers: (
    <>
      <path d="m12 3 9 5-9 5-9-5 9-5Z" />
      <path d="m3 12 9 5 9-5" />
      <path d="m3 16 9 5 9-5" />
    </>
  ),
  trophy: (
    <>
      <path d="M7 4h10v5a5 5 0 0 1-10 0V4Z" />
      <path d="M17 5h3a2 2 0 0 1-2 4M7 5H4a2 2 0 0 0 2 4M12 14v4M8 21h8" />
    </>
  ),
  signal: (
    <>
      <circle cx="12" cy="12" r="2" />
      <path d="M7.8 7.8a6 6 0 0 0 0 8.4M16.2 7.8a6 6 0 0 1 0 8.4M4.9 4.9a10 10 0 0 0 0 14.2M19.1 4.9a10 10 0 0 1 0 14.2" />
    </>
  ),
  check: <path d="M4 12.5l5 5L20 6.5" />,
  users: (
    <>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
      <path d="M16 5.2a3.2 3.2 0 0 1 0 5.6M18 14.3c2 .8 3.4 2.8 3.4 5.2" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" />
    </>
  ),
  bolt: <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" />,
  megaphone: (
    <>
      <path d="M3 10v4h4l8 5V5L7 10H3Z" />
      <path d="M18.5 9a4 4 0 0 1 0 6" />
    </>
  ),
  star: <path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9L12 3Z" />,
};

export function Icon({ name, size = 62 }: { name: keyof typeof ICON_PATHS | string; size?: number }) {
  const c = usePoster();
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c.accent} strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, filter: `drop-shadow(0 0 8px ${rgba(c.accent, 0.5)})` }}>
      {ICON_PATHS[name]}
    </svg>
  );
}

/* ---------- info stat: icon + two lines ---------- */

export function Stat({ section, icon, small, big, numeric }: { section: string; icon: string; small: string; big: string; numeric?: boolean }) {
  const c = usePoster();
  if (!c.show(section)) return null;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
      <Icon name={icon} />
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
        {numeric ? (
          <>
            <T id={big} size={64} weight={700} align="left" lh={0.95} />
            <T id={small} size={34} weight={700} align="left" tracking={5} lh={1} />
          </>
        ) : (
          <>
            <T id={small} size={30} weight={500} align="left" tracking={6} color="#c9c9d6" lh={1} />
            <T id={big} size={50} weight={700} italic align="left" lh={1} />
          </>
        )}
      </div>
    </div>
  );
}

/* ---------- shared template helpers ---------- */

export const lines = (text: string) => text.split("\n").map((l) => l.trim()).filter(Boolean);
export const cols = (line: string) => line.split("|").map((x) => x.trim());

export function useSize() {
  const c = usePoster();
  const { h } = FORMATS[c.doc.format];
  return { h, compact: h <= 1080, tall: h > 1500 };
}

export function Masthead({ size, orgSize = 22 }: { size: number; orgSize?: number }) {
  return (
    <>
      <Pic id="logo" w={size} h={size} />
      <div style={{ height: 12 }} />
      <T id="org" size={orgSize} weight={500} tracking={60} color={BRAND.silver} />
    </>
  );
}

export function Cta({ section, icon = "signal", label, value }: { section: string; icon?: string; label: string; value: string }) {
  const c = usePoster();
  if (!c.show(section)) return null;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 18, padding: "12px 30px", border: `1px solid ${rgba(c.accent, 0.55)}`, background: rgba(c.accent, 0.12) }}>
      <Icon name={icon} size={38} />
      <T id={label} size={24} weight={600} tracking={30} color={BRAND.silver} />
      <T id={value} size={30} weight={700} tracking={8} color="#fff" upper={false} />
    </div>
  );
}
