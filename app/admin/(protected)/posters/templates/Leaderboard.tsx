"use client";

import { usePoster } from "../context";
import { Block, Footer, Pic, Shell, Spacer, T, cols, lines, useSize } from "../parts";
import { BRAND, FONT_DISPLAY, rgba } from "../theme";
import type { TemplateDef } from "../types";

const PODIUM = [
  { bg: "linear-gradient(135deg,#8a6508 0%,#f5b014 55%,#a87a0c 100%)", text: "#f7b81c" },
  { bg: "linear-gradient(135deg,#6f6f7a 0%,#d6d6df 55%,#8b8b96 100%)", text: "#d9d9e2" },
  { bg: "linear-gradient(135deg,#9a4a0b 0%,#f08a24 55%,#b35a12 100%)", text: "#f59a3c" },
];

function Crown({ color }: { color: string }) {
  return (
    <svg width="30" height="26" viewBox="0 0 24 20" fill={color} style={{ filter: "drop-shadow(0 1px 4px rgba(0,0,0,0.5))" }}>
      <path d="M2 17h20l1.2-11-6 4.6L12 2 6.8 10.6 .8 6 2 17Z" />
    </svg>
  );
}

function Decor() {
  const c = usePoster();
  const line = `3px solid ${rgba(c.accent, 0.85)}`;
  const bracket = { position: "absolute" as const, width: 50, height: 50, opacity: 0.9 };
  const stripe = (style: React.CSSProperties) => (
    <div style={{ position: "absolute", height: 16, background: `linear-gradient(90deg, transparent, ${rgba(c.accent, 0.7)})`, transform: "rotate(-38deg)", ...style }} />
  );
  const logo = c.img("logo");
  return (
    <>
      {logo && c.show("watermark") && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logo} alt="" style={{ position: "absolute", left: "50%", top: "50%", width: 560, height: 560, marginLeft: -280, marginTop: -280, objectFit: "contain", opacity: 0.06, filter: "grayscale(0.6)", pointerEvents: "none" }} />
      )}
      {stripe({ left: -120, bottom: 230, width: 420 })}
      {stripe({ left: -150, bottom: 190, width: 420, height: 8, opacity: 0.7 })}
      {stripe({ right: -140, top: 520, width: 420 })}
      {stripe({ right: -160, bottom: 140, width: 480, height: 22 })}
      <div style={{ ...bracket, left: 26, top: 26, borderLeft: line, borderTop: line }} />
      <div style={{ ...bracket, right: 26, top: 26, borderRight: line, borderTop: line }} />
      <div style={{ ...bracket, left: 26, bottom: 26, borderLeft: line, borderBottom: line }} />
      <div style={{ ...bracket, right: 26, bottom: 26, borderRight: line, borderBottom: line }} />
    </>
  );
}

function Layout() {
  const c = usePoster();
  const { h, compact } = useSize();
  const rows = lines(c.val("rows")).slice(0, 24).map(cols);
  const unit = c.val("unit");
  const gap = 6;
  const headH = 52;
  const top = compact ? 330 : 370;
  const avail = h - top - 190;
  const rowH = Math.max(34, Math.min(72, Math.floor((avail - headH - gap) / Math.max(rows.length, 1)) - gap));
  const f = Math.round(rowH * 0.5);
  const grid = "150px 1fr 250px";
  const edge = `1px solid ${rgba(c.accent, 0.55)}`;

  return (
    <Shell shards={false}>
      <Decor />

      <div style={{ display: "flex", justifyContent: "space-between", width: "100%", marginTop: -10 }}>
        <T id="org" size={18} weight={500} tracking={30} color={BRAND.silver} align="left" style={{ maxWidth: 300 }} />
        <T id="event" size={18} weight={500} tracking={30} color={BRAND.silver} align="right" style={{ maxWidth: 300 }} />
      </div>

      <div style={{ marginTop: -34 }}>
        <Pic id="logo" w={compact ? 120 : 150} h={compact ? 120 : 150} />
      </div>
      <div style={{ display: "flex", gap: 26, alignItems: "baseline", marginTop: -6 }}>
        <T id="titleA" size={compact ? 98 : 112} italic metal lh={0.95} />
        <T id="titleB" size={compact ? 98 : 112} italic color={c.accent} lh={0.95} style={{ textShadow: `0 0 34px ${rgba(c.accent, 0.7)}` }} />
      </div>
      <T id="subtitle" size={22} weight={500} tracking={45} color={BRAND.silver} />
      <div style={{ display: "flex", alignItems: "center", gap: 16, width: "100%", margin: "14px 0 16px" }}>
        <div style={{ flex: 1, height: 2, background: `linear-gradient(90deg, transparent, ${c.accent})` }} />
        <div style={{ width: 12, height: 12, background: c.accent, transform: "rotate(45deg)", boxShadow: `0 0 14px ${c.accent}` }} />
        <div style={{ flex: 1, height: 2, background: `linear-gradient(270deg, transparent, ${c.accent})` }} />
      </div>

      <Block id="rows">
        <div style={{ width: 960, fontFamily: FONT_DISPLAY }}>
          <div style={{ display: "grid", gridTemplateColumns: grid, alignItems: "center", height: headH, marginBottom: gap + 4, border: edge, borderRadius: 8, background: rgba(c.accent, 0.1), fontSize: 24, fontWeight: 700, fontStyle: "italic", letterSpacing: "0.12em", textTransform: "uppercase", color: c.accent }}>
            <span style={{ textAlign: "center" }}>{c.val("headRank")}</span>
            <span style={{ paddingLeft: 28 }}>{c.val("headPlayer")}</span>
            <span style={{ textAlign: "center" }}>{c.val("headValue")}</span>
          </div>
          {rows.map((r, i) => {
            const podium = PODIUM[i];
            return (
              <div key={i} style={{ display: "grid", gridTemplateColumns: grid, height: rowH, marginBottom: gap, border: edge, borderRadius: 6, overflow: "hidden", background: "rgba(255,255,255,0.02)" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, background: podium?.bg ?? "transparent", borderRight: podium ? "none" : edge, color: podium ? "#fff" : c.accent, textShadow: podium ? "0 1px 6px rgba(0,0,0,0.55)" : `0 0 14px ${rgba(c.accent, 0.5)}` }}>
                  <span style={{ fontSize: f + 8, fontWeight: 700, fontStyle: "italic", lineHeight: 1 }}>{i + 1}</span>
                  {podium && <Crown color="#fff" />}
                </div>
                <div style={{ display: "flex", alignItems: "center", paddingLeft: 28, minWidth: 0, fontSize: f + 2, fontWeight: 700, fontStyle: "italic", textTransform: "uppercase", letterSpacing: "0.03em", color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {r[0]}
                </div>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "flex-end", gap: 12, paddingRight: 26 }}>
                  <span style={{ fontSize: f + 14, fontWeight: 700, fontStyle: "italic", lineHeight: 1, color: podium?.text ?? c.accent, textShadow: `0 0 18px ${rgba(podium?.text ?? c.accent, 0.4)}` }}>{r[1] ?? ""}</span>
                  {unit && <span style={{ fontSize: Math.round(f * 0.62), fontWeight: 600, fontStyle: "italic", textTransform: "uppercase", letterSpacing: "0.04em", color: "#d6d6e2" }}>{unit}</span>}
                </div>
              </div>
            );
          })}
        </div>
      </Block>

      <Spacer min={10} />
      <T id="brand" size={46} weight={700} tracking={40} metal />
      <div style={{ height: 6 }} />
      <Footer />
    </Shell>
  );
}

export const leaderboard: TemplateDef = {
  id: "leaderboard",
  name: "Player Leaderboard",
  blurb: "Ranked players with podium, crowns and kills.",
  defaultBg: "",
  sections: [{ id: "watermark", label: "Logo watermark", optional: true }],
  fields: [
    { id: "logo", label: "Logo", kind: "image", default: "/logo-clear.png", shared: true },
    { id: "org", label: "Top-left text", kind: "text", default: "GenXio Organization", shared: true },
    { id: "event", label: "Top-right text", kind: "text", default: "Inners Tournament" },
    { id: "titleA", label: "Title (white word)", kind: "text", default: "Player" },
    { id: "titleB", label: "Title (colored word)", kind: "text", default: "Rankings" },
    { id: "subtitle", label: "Subtitle", kind: "text", default: "Of GenXio Organization" },
    { id: "headRank", label: "Rank heading", kind: "text", default: "Rank" },
    { id: "headPlayer", label: "Player heading", kind: "text", default: "Player" },
    { id: "headValue", label: "Value heading", kind: "text", default: "Kills" },
    { id: "unit", label: "Unit after each number", kind: "text", default: "Kills" },
    { id: "rows", label: "Rows: player | number (best first)", kind: "textarea", default: "25th | 56\nKlaus | 43\nDesaad | 42\nFemoshe | 38\nMide | 34\nPain | 25\nMajesty | 24\nF8tal | 23\nProsper | 20\nAssassin | 16\nNum1 | 13\nMadara | 12", fill: "kills" },
    { id: "brand", label: "Wordmark", kind: "text", default: "GenXio", shared: true },
    { id: "tagline", label: "Footer tagline", kind: "text", default: "Play. Evolve. Dominate.", shared: true },
  ],
  Component: Layout,
};
