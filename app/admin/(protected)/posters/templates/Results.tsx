"use client";

import { usePoster } from "../context";
import { Block, Footer, Notch, Shell, Spacer, T, Masthead, cols, lines, useSize } from "../parts";
import { BRAND, FONT_DISPLAY, rgba } from "../theme";
import type { TemplateDef } from "../types";

const RANK_COLORS = ["", "#e9e9f2", "#b9b9c9", "#c08a5a"];

function Layout() {
  const c = usePoster();
  const { h, compact, tall } = useSize();
  const rows = lines(c.val("standings")).slice(0, 12).map(cols);
  const avail = h - (compact ? 560 : 700);
  const rowH = Math.max(42, Math.min(tall ? 96 : 78, Math.floor(avail / (rows.length + 1))));
  const font = Math.round(rowH * 0.5);
  const grid = "74px 1fr 130px 130px";

  return (
    <Shell>
      <Masthead size={compact ? 110 : 160} />
      <Spacer min={12} />
      <T id="kicker" size={compact ? 34 : 44} weight={700} tracking={60} color={c.accent} style={{ textShadow: `0 0 28px ${rgba(c.accent, 0.6)}` }} />
      <div style={{ height: 6 }} />
      <T id="title" size={compact ? 72 : tall ? 104 : 88} italic metal lh={0.96} tracking={1} />
      <Spacer min={14} />
      <Notch />
      <div style={{ height: 18 }} />

      <Block id="standings">
        <div style={{ width: 940, fontFamily: FONT_DISPLAY }}>
          <div style={{ display: "grid", gridTemplateColumns: grid, alignItems: "center", padding: "0 18px 8px", fontSize: 20, fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: BRAND.silverDim }}>
            <span>#</span>
            <span>{c.val("colTeam")}</span>
            <span style={{ textAlign: "right" }}>{c.val("col2")}</span>
            <span style={{ textAlign: "right" }}>{c.val("col3")}</span>
          </div>
          {rows.map((r, i) => {
            const top = i < 3;
            const color = i === 0 ? c.accent : RANK_COLORS[i + 1] || "#fff";
            return (
              <div
                key={i}
                style={{
                  display: "grid",
                  gridTemplateColumns: grid,
                  alignItems: "center",
                  height: rowH,
                  padding: "0 18px",
                  marginBottom: 6,
                  background: top ? `linear-gradient(90deg, ${rgba(i === 0 ? c.accent : "#ffffff", i === 0 ? 0.28 : 0.1)}, transparent 85%)` : "rgba(255,255,255,0.04)",
                  borderLeft: `4px solid ${top ? color : rgba(c.accent, 0.35)}`,
                }}
              >
                <span style={{ fontSize: font + 6, fontWeight: 700, fontStyle: "italic", color: top ? color : BRAND.silverDim }}>{i + 1}</span>
                <span style={{ fontSize: font + 4, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r[0]}</span>
                <span style={{ fontSize: font, fontWeight: 600, textAlign: "right", color: BRAND.silver }}>{r[1] ?? ""}</span>
                <span style={{ fontSize: font + 4, fontWeight: 700, textAlign: "right", color: top ? color : "#fff" }}>{r[2] ?? ""}</span>
              </div>
            );
          })}
        </div>
      </Block>

      <Spacer min={14} />
      <Footer />
    </Shell>
  );
}

export const results: TemplateDef = {
  id: "results",
  name: "Results / Standings",
  blurb: "Ranked table with kills and points.",
  defaultBg: "/posters/bg-corridor.webp",
  defaultDim: 0.3,
  sections: [],
  fields: [
    { id: "logo", label: "Logo", kind: "image", default: "/logo-clear.png", shared: true },
    { id: "org", label: "Organization line", kind: "text", default: "GenXio Organization", shared: true },
    { id: "kicker", label: "Kicker", kind: "text", default: "Final standings" },
    { id: "title", label: "Event name", kind: "textarea", default: "Inners Tournament" },
    { id: "colTeam", label: "Column 1 heading", kind: "text", default: "Team" },
    { id: "col2", label: "Column 2 heading", kind: "text", default: "Kills" },
    { id: "col3", label: "Column 3 heading", kind: "text", default: "Points" },
    { id: "standings", label: "Rows: team | col 2 | col 3", kind: "textarea", default: "Team Phantom | 31 | 48\nTeam Viper | 27 | 41\nTeam Ghost | 24 | 37\nTeam Alpha | 19 | 30\nTeam Bravo | 15 | 22\nTeam Delta | 11 | 17" },
    { id: "tagline", label: "Footer tagline", kind: "text", default: "Play. Evolve. Dominate.", shared: true },
  ],
  Component: Layout,
};
