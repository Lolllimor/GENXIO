"use client";

const WIDTH = 900;
const HEIGHT = 320;
const PAD_LEFT = 40;
const PAD_RIGHT = 20;
const PAD_TOP = 20;
const PAD_BOTTOM = 36;

export interface ChartPoint {
  id: string;
  date: string;
  position: number;
  label?: string;
}

export default function PositionChart({ points: raw }: { points: ChartPoint[] }) {
  if (raw.length === 0) {
    return (
      <div className="admin-panel flex h-[220px] items-center justify-center text-sm text-text-dim">
        No results logged yet — log a placement from a scrim to see the trend.
      </div>
    );
  }

  const sorted = [...raw].sort((a, b) => a.date.localeCompare(b.date));
  const positions = sorted.map((r) => r.position);
  const minPos = 1;
  const maxPos = Math.max(...positions, 4);

  const plotW = WIDTH - PAD_LEFT - PAD_RIGHT;
  const plotH = HEIGHT - PAD_TOP - PAD_BOTTOM;

  const xFor = (i: number) =>
    sorted.length === 1 ? PAD_LEFT + plotW / 2 : PAD_LEFT + (i / (sorted.length - 1)) * plotW;
  const yFor = (pos: number) =>
    PAD_TOP + ((pos - minPos) / Math.max(maxPos - minPos, 1)) * plotH;

  const points = sorted.map((r, i) => ({ x: xFor(i), y: yFor(r.position), r }));
  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");

  // Y-axis gridlines at nice round positions.
  const gridSteps = 4;
  const yTicks = Array.from({ length: gridSteps + 1 }, (_, i) =>
    Math.round(minPos + ((maxPos - minPos) * i) / gridSteps)
  );

  // Avoid crowding the x-axis: show at most ~8 date labels.
  const labelEvery = Math.max(1, Math.ceil(sorted.length / 8));

  return (
    <div className="admin-panel overflow-x-auto">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full min-w-[560px]" role="img" aria-label="Match placement over time">
        {yTicks.map((pos) => (
          <g key={pos}>
            <line
              x1={PAD_LEFT}
              x2={WIDTH - PAD_RIGHT}
              y1={yFor(pos)}
              y2={yFor(pos)}
              style={{ stroke: "var(--line)" }}
              strokeWidth={1}
            />
            <text x={PAD_LEFT - 8} y={yFor(pos) + 3} textAnchor="end" fontSize="10" style={{ fill: "var(--text-dim)" }}>
              #{pos}
            </text>
          </g>
        ))}

        {sorted.map((r, i) =>
          i % labelEvery === 0 || i === sorted.length - 1 ? (
            <text
              key={r.id}
              x={xFor(i)}
              y={HEIGHT - PAD_BOTTOM + 18}
              textAnchor="middle"
              fontSize="9.5"
              style={{ fill: "var(--text-dim)" }}
            >
              {new Date(r.date + "T00:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric" })}
            </text>
          ) : null
        )}

        <path d={linePath} fill="none" style={{ stroke: "var(--purple)" }} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />

        {points.map((p, i) => (
          <g key={i}>
            <circle
              cx={p.x}
              cy={p.y}
              r={p.r.position === minPos ? 5 : 3.5}
              style={{
                fill: p.r.position === 1 ? "var(--amber)" : "var(--purple)",
                filter: p.r.position === 1 ? "drop-shadow(0 0 4px var(--amber))" : undefined,
              }}
            />
            <title>
              {new Date(p.r.date + "T00:00:00").toLocaleDateString(undefined, {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
              {" — #"}
              {p.r.position}
              {p.r.label ? ` vs ${p.r.label}` : ""}
            </title>
          </g>
        ))}
      </svg>
    </div>
  );
}
