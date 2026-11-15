"use client";

import { Fragment } from "react";
import { usePoster } from "../context";
import { Emblem, Footer, Masthead, Pic, Shell, Spacer, T, VDivider, useSize } from "../parts";
import { BRAND, rgba, shade } from "../theme";
import type { TemplateDef } from "../types";

const POLY = "polygon(14% 0,100% 0,100% 86%,86% 100%,0 100%,0 14%)";

function Layout() {
  const c = usePoster();
  const { compact, tall } = useSize();
  const pw = compact ? 300 : tall ? 520 : 400;
  const ph = compact ? 300 : tall ? 600 : 440;

  const stats = ["s1", "s2", "s3"].filter((s) => c.val(`${s}Value`).trim() && c.show("stats"));

  return (
    <Shell>
      <Masthead size={compact ? 100 : 140} />
      <Spacer min={10} />
      <T id="kicker" size={compact ? 34 : 44} weight={700} tracking={60} color={c.accent} style={{ textShadow: `0 0 28px ${rgba(c.accent, 0.6)}` }} />
      <div style={{ height: 6 }} />
      <T id="title" size={28} weight={600} tracking={30} color={BRAND.silver} />
      <Spacer min={14} />

      <div style={{ position: "relative", width: pw, height: ph }}>
        <div style={{ position: "absolute", inset: -8, background: `linear-gradient(135deg,${c.accent},${shade(c.accent, 0.6)})`, clipPath: POLY, filter: `drop-shadow(0 0 30px ${rgba(c.accent, 0.5)})` }} />
        <div style={{ position: "absolute", inset: 0, background: "#08080c", clipPath: POLY }} />
        <div style={{ position: "absolute", inset: 0, clipPath: POLY }}>
          <Pic id="photo" w={pw} h={ph} fit="cover" fallback={<div style={{ width: "100%", height: "100%", padding: 60 }}><Emblem name="G" tag={c.val("clanTag")} /></div>} />
        </div>
      </div>

      <div style={{ height: 18 }} />
      <T id="player" size={compact ? 90 : tall ? 130 : 112} italic metal lh={0.96} tracking={1} />
      <div style={{ height: 6 }} />
      <T id="team" size={30} weight={600} tracking={40} color={c.accent} />
      <Spacer min={14} />

      {stats.length > 0 && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-around", width: "100%" }}>
          {stats.map((s, i) => (
            <Fragment key={s}>
              {i > 0 && <VDivider h={80} />}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                <T id={`${s}Value`} size={compact ? 60 : 72} weight={700} lh={0.95} />
                <T id={`${s}Label`} size={22} weight={600} tracking={30} color={BRAND.silverDim} />
              </div>
            </Fragment>
          ))}
        </div>
      )}

      <Spacer min={14} />
      <Footer />
    </Shell>
  );
}

export const mvp: TemplateDef = {
  id: "mvp",
  name: "MVP Announcement",
  blurb: "Player photo, name and key stats.",
  defaultBg: "/hero-bg.webp",
  defaultDim: 0.4,
  sections: [{ id: "stats", label: "Stats", optional: true }],
  fields: [
    { id: "logo", label: "Logo", kind: "image", default: "/logo-clear.png", shared: true },
    { id: "org", label: "Organization line", kind: "text", default: "GenXio Organization", shared: true },
    { id: "clanTag", label: "Clan tag (placeholder logos)", kind: "text", default: "G¹", shared: true },
    { id: "kicker", label: "Kicker", kind: "text", default: "Tournament MVP" },
    { id: "title", label: "Event name", kind: "text", default: "Inners Tournament" },
    { id: "photo", label: "Player photo", kind: "image", default: "" },
    { id: "player", label: "Player", kind: "text", default: "Player One" },
    { id: "team", label: "Team", kind: "text", default: "Team Phantom" },
    { id: "s1Value", label: "Stat 1 value", kind: "text", default: "31", section: "stats" },
    { id: "s1Label", label: "Stat 1 label", kind: "text", default: "Kills", section: "stats" },
    { id: "s2Value", label: "Stat 2 value", kind: "text", default: "2.4", section: "stats" },
    { id: "s2Label", label: "Stat 2 label", kind: "text", default: "K/D", section: "stats" },
    { id: "s3Value", label: "Stat 3 value", kind: "text", default: "1st", section: "stats" },
    { id: "s3Label", label: "Stat 3 label", kind: "text", default: "Placement", section: "stats" },
    { id: "tagline", label: "Footer tagline", kind: "text", default: "Play. Evolve. Dominate.", shared: true },
  ],
  Component: Layout,
};
