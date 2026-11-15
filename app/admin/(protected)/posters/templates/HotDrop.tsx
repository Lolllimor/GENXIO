"use client";

import { usePoster } from "../context";
import { Block, Footer, Icon, Masthead, Notch, Shell, Spacer, T, cols, lines, useSize } from "../parts";
import { BRAND, FONT_DISPLAY, rgba } from "../theme";
import type { TemplateDef } from "../types";

function Layout() {
  const c = usePoster();
  const { compact, tall } = useSize();
  const rotation = lines(c.val("rotation")).slice(0, 8).map(cols);

  return (
    <Shell>
      <Masthead size={compact ? 100 : 140} />
      <Spacer min={12} />
      <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
        <Icon name="crosshair" size={compact ? 50 : 64} />
        <T id="kicker" size={compact ? 36 : 46} weight={700} tracking={60} color={c.accent} style={{ textShadow: `0 0 28px ${rgba(c.accent, 0.6)}` }} />
      </div>
      <div style={{ height: 10 }} />
      <T id="map" size={compact ? 34 : 42} weight={600} tracking={45} color={BRAND.silver} />
      <div style={{ height: 8 }} />
      <T id="hotdrop" size={compact ? 120 : tall ? 190 : 160} italic metal lh={0.94} tracking={1} style={{ maxWidth: 940 }} />
      <div style={{ height: 10 }} />
      <T id="title" size={28} weight={600} tracking={30} color={BRAND.silver} />
      <T id="description" size={24} weight={500} tracking={4} color={BRAND.silverDim} style={{ maxWidth: 760, marginTop: 10 }} />
      <Spacer min={14} />
      <Notch />

      {c.show("rotation") && rotation.length > 0 && (
        <>
          <div style={{ height: 18 }} />
          <T id="rotationLabel" size={22} weight={600} tracking={45} color={BRAND.silverDim} />
          <div style={{ height: 12 }} />
          <Block id="rotation">
            <div style={{ width: 940, display: "grid", gridTemplateColumns: rotation.length > 3 ? "1fr 1fr" : "1fr", gap: 10, fontFamily: FONT_DISPLAY }}>
              {rotation.map((r, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px", background: "rgba(255,255,255,0.05)", borderLeft: `4px solid ${c.accent}` }}>
                  <span style={{ fontSize: 24, fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: BRAND.silverDim }}>{r[0]}</span>
                  <span style={{ fontSize: 34, fontWeight: 700, fontStyle: "italic", textTransform: "uppercase", color: "#fff" }}>{r[1] ?? ""}</span>
                </div>
              ))}
            </div>
          </Block>
        </>
      )}

      <Spacer min={14} />
      <Footer />
    </Shell>
  );
}

export const hotdrop: TemplateDef = {
  id: "hotdrop",
  name: "Hot Drop / Map Rotation",
  blurb: "Featured hot drop plus per-lobby rotation.",
  defaultBg: "/posters/bg-helicopter.webp",
  defaultDim: 0.55,
  sections: [{ id: "rotation", label: "Rotation", optional: true }],
  fields: [
    { id: "logo", label: "Logo", kind: "image", default: "/logo-clear.png", shared: true },
    { id: "org", label: "Organization line", kind: "text", default: "GenXio Organization", shared: true },
    { id: "kicker", label: "Kicker", kind: "text", default: "Hot drop" },
    { id: "map", label: "Map", kind: "map", default: "Verdansk" },
    { id: "hotdrop", label: "Hot drop", kind: "hotdrop", default: "Airport" },
    { id: "title", label: "Event / subtitle", kind: "text", default: "Inners Tournament" },
    { id: "description", label: "Description", kind: "textarea", default: "" },
    { id: "rotationLabel", label: "Heading", kind: "text", default: "Drop rotation", section: "rotation" },
    { id: "rotation", label: "Rows: lobby | hot drop", kind: "textarea", default: "Lobby 1 | Airport\nLobby 2 | Stadium\nLobby 3 | Downtown\nLobby 4 | Dam", section: "rotation" },
    { id: "tagline", label: "Footer tagline", kind: "text", default: "Play. Evolve. Dominate.", shared: true },
  ],
  Component: Layout,
};
