"use client";

export interface WheelSegment {
  id: string;
  ign: string;
  color: string;
  /** Start / end angle in degrees, clockwise from the top. Animated by the page when someone is picked. */
  a0: number;
  a1: number;
}

export const WHEEL_COLORS = ["#8b5cf6", "#22d3ee", "#f59e0b", "#ec4899", "#34d399", "#6366f1", "#ef4444", "#a855f7"];

/** Equal segments for a list of players. */
export function evenLayout(list: { id: string; ign: string }[], colorOf: (id: string) => string): WheelSegment[] {
  const seg = list.length > 0 ? 360 / list.length : 0;
  return list.map((p, i) => ({ id: p.id, ign: p.ign, color: colorOf(p.id), a0: i * seg, a1: (i + 1) * seg }));
}

const R = 220;

/** Point on the wheel, angle measured clockwise from the top. */
const pt = (r: number, deg: number): [number, number] => {
  const a = (deg * Math.PI) / 180;
  return [r * Math.sin(a), -r * Math.cos(a)];
};

const clip = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1) + "…" : s);

function slice(r: number, a0: number, a1: number) {
  const [x0, y0] = pt(r, a0);
  const [x1, y1] = pt(r, a1);
  return `M0 0 L${x0.toFixed(2)} ${y0.toFixed(2)} A${r} ${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${x1.toFixed(2)} ${y1.toFixed(2)} Z`;
}

export default function Wheel({
  segments,
  highlightId,
  rotation,
  animate,
  ms,
  centerLabel,
}: {
  segments: WheelSegment[];
  highlightId: string | null;
  rotation: number;
  animate: boolean;
  ms: number;
  centerLabel: string;
}) {
  const live = segments.filter((s) => s.a1 - s.a0 > 0.05);

  return (
    <svg viewBox="-250 -250 500 500" className="mx-auto block w-full max-w-[460px] select-none" role="img" aria-label="Spinning wheel of players">
      <defs>
        <radialGradient id="wheel-glow" cx="50%" cy="50%" r="50%">
          <stop offset="80%" stopColor="rgba(139,92,246,0)" />
          <stop offset="100%" stopColor="rgba(139,92,246,0.55)" />
        </radialGradient>
        <filter id="pointer-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* outer ring */}
      <circle r={R + 18} fill="url(#wheel-glow)" />
      <circle r={R + 10} fill="#0b0b11" stroke="#2a2a35" strokeWidth="2" />

      <g style={{ transform: `rotate(${rotation}deg)`, transformOrigin: "0px 0px", transition: animate ? `transform ${ms}ms cubic-bezier(0.12, 0.72, 0.08, 1)` : "none" }}>
        <circle r={R} fill="#14141c" stroke="#2a2a35" />
        {live.map((s) =>
          s.a1 - s.a0 >= 359.9 ? (
            <circle key={s.id} r={R} fill={s.color} opacity={0.92} />
          ) : (
            <path key={s.id} d={slice(R, s.a0, s.a1)} fill={s.color} stroke="#0b0b11" strokeWidth="1.5" opacity={0.92} />
          ),
        )}
        {highlightId &&
          live
            .filter((s) => s.id === highlightId && s.a1 - s.a0 < 359.9)
            .map((s) => <path key={`h-${s.id}`} d={slice(R - 2, s.a0, s.a1)} fill="rgba(255,255,255,0.18)" stroke="#fff" strokeWidth="4" />)}
        {live.map((s) => {
          const width = s.a1 - s.a0;
          if (width < 3.5) return null; // too thin to label (e.g. while collapsing)
          const center = (s.a0 + s.a1) / 2;
          const fontSize = Math.max(7, Math.min(17, 0.45 * 150 * ((width * Math.PI) / 180)));
          return (
            <text
              key={`t-${s.id}`}
              transform={`rotate(${center - 90}) translate(${R - 14},0)`}
              textAnchor="end"
              dominantBaseline="central"
              fontSize={fontSize}
              fontWeight="700"
              fill="#fff"
              style={{ fontFamily: "var(--font-display)", textTransform: "uppercase", letterSpacing: "0.04em", paintOrder: "stroke", stroke: "rgba(0,0,0,0.45)", strokeWidth: 2.5 }}
            >
              {clip(s.ign, width < 12 ? 9 : 13)}
            </text>
          );
        })}
      </g>

      {/* hub */}
      <circle r="52" fill="#0b0b11" stroke="#8b5cf6" strokeWidth="3" />
      <circle r="44" fill="#14141c" />
      <text textAnchor="middle" dominantBaseline="central" fontSize={centerLabel.length > 9 ? 13 : 17} fontWeight="700" fill="#fff" style={{ fontFamily: "var(--font-display)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
        {clip(centerLabel, 11)}
      </text>

      {/* pointer */}
      <polygon points="-16,-258 16,-258 0,-218" fill="#ff9a1f" stroke="#0b0b11" strokeWidth="3" filter="url(#pointer-glow)" />
    </svg>
  );
}
