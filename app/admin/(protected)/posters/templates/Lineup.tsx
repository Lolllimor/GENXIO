"use client";

import { Fragment } from "react";
import { usePoster } from "../context";
import { Block, Emblem, Footer, Masthead, Notch, Pic, Shell, Spacer, T, cols, lines, useSize } from "../parts";
import { BRAND, FONT_DISPLAY, rgba } from "../theme";
import type { TemplateDef } from "../types";

function PlayerCard({ n, name, role, big }: { n: number; name: string; role?: string; big: boolean }) {
  const c = usePoster();
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16, padding: big ? "14px 20px" : "10px 16px", background: "rgba(255,255,255,0.05)", borderLeft: `4px solid ${c.accent}`, minWidth: 0 }}>
      <span style={{ fontSize: big ? 46 : 36, fontWeight: 700, fontStyle: "italic", color: c.accent, minWidth: 44 }}>{String(n).padStart(2, "0")}</span>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: big ? 40 : 32, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", lineHeight: 1.05 }}>{name}</div>
        {role && <div style={{ fontSize: big ? 22 : 19, fontWeight: 500, letterSpacing: "0.22em", textTransform: "uppercase", color: BRAND.silverDim, marginTop: 2 }}>{role}</div>}
      </div>
    </div>
  );
}

function Layout() {
  const c = usePoster();
  const { compact, tall } = useSize();
  const players = lines(c.val("roster")).slice(0, 8).map(cols);
  const subs = lines(c.val("subs"));
  const single = players.length <= 4 && !compact;

  return (
    <Shell>
      <Masthead size={compact ? 100 : 140} />
      <Spacer min={10} />
      <T id="kicker" size={compact ? 30 : 38} weight={700} tracking={60} color={c.accent} style={{ textShadow: `0 0 28px ${rgba(c.accent, 0.6)}` }} />
      <div style={{ height: 14 }} />
      <Pic id="teamLogo" w={compact ? 120 : tall ? 260 : 190} h={compact ? 120 : tall ? 260 : 190} fallback={<Emblem name={c.val("team")} tag={c.val("teamTag")} />} />
      <div style={{ height: 10 }} />
      <T id="team" size={compact ? 84 : tall ? 120 : 102} italic metal lh={0.96} tracking={1} />
      <Spacer min={12} />
      <Notch />
      <div style={{ height: 20 }} />

      <Block id="roster">
        <div style={{ width: 940, fontFamily: FONT_DISPLAY, display: "grid", gridTemplateColumns: single ? "1fr" : "1fr 1fr", gap: 10 }}>
          {players.map((p, i) => (
            <PlayerCard key={i} n={i + 1} name={p[0]} role={p[1]} big={single} />
          ))}
        </div>
      </Block>

      {c.show("subs") && subs.length > 0 && (
        <div style={{ marginTop: 18, display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", justifyContent: "center", maxWidth: 940 }}>
          <T id="subsLabel" size={22} weight={600} tracking={30} color={BRAND.silverDim} />
          {subs.map((s, i) => (
            <Fragment key={i}>
              {i > 0 && <span style={{ width: 8, height: 8, background: c.accent, transform: "rotate(45deg)" }} />}
              <span style={{ fontSize: 28, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "#fff" }}>{s}</span>
            </Fragment>
          ))}
        </div>
      )}

      <Spacer min={14} />
      <Footer />
    </Shell>
  );
}

export const lineup: TemplateDef = {
  id: "lineup",
  name: "Team Lineup",
  blurb: "Roster reveal with roles and subs.",
  defaultBg: "/posters/bg-ruins.webp",
  sections: [{ id: "subs", label: "Substitutes", optional: true }],
  fields: [
    { id: "logo", label: "Logo", kind: "image", default: "/logo-clear.png", shared: true },
    { id: "org", label: "Organization line", kind: "text", default: "GenXio Organization", shared: true },
    { id: "kicker", label: "Kicker", kind: "text", default: "Lineup reveal" },
    { id: "teamLogo", label: "Team logo", kind: "image", default: "" },
    { id: "team", label: "Team name", kind: "text", default: "GenXio E-Sport" },
    { id: "teamTag", label: "Placeholder tag (auto: G¹)", kind: "text", default: "" },
    { id: "roster", label: "Players: IGN | role (one per line)", kind: "textarea", default: "Player One | Slayer\nPlayer Two | Anchor\nPlayer Three | Support\nPlayer Four | IGL" },
    { id: "subsLabel", label: "Label", kind: "text", default: "Subs", section: "subs" },
    { id: "subs", label: "Substitutes (one per line)", kind: "textarea", default: "Player Five\nPlayer Six", section: "subs" },
    { id: "tagline", label: "Footer tagline", kind: "text", default: "Play. Evolve. Dominate.", shared: true },
  ],
  Component: Layout,
};
