"use client";

import { Fragment } from "react";
import { FORMATS } from "../formats";
import { usePoster } from "../context";
import { Brackets, Emblem, Footer, Icon, Notch, Pic, Shell, Spacer, Stat, T, VDivider } from "../parts";
import { BRAND, rgba } from "../theme";
import type { TemplateDef } from "../types";

function Team({ logo, name, tag, size }: { logo: string; name: string; tag: string; size: number }) {
  const c = usePoster();
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18, width: 380 }}>
      <Pic id={logo} w={size} h={size} fallback={<Emblem name={c.val(name)} tag={c.val(tag)} />} />
      <T id={name} size={52} weight={700} italic lh={1} />
    </div>
  );
}

function Layout() {
  const c = usePoster();
  const { h } = FORMATS[c.doc.format];
  const compact = h <= 1080;
  const tall = h > 1500;
  const crest = compact ? 170 : tall ? 280 : 230;

  const stats = [
    c.show("when") && <Stat key="when" section="when" icon="calendar" small="whenSmall" big="whenBig" />,
    c.show("where") && <Stat key="where" section="where" icon="crosshair" small="whereSmall" big="whereBig" />,
    c.show("extra") && <Stat key="extra" section="extra" icon="layers" small="extraSmall" big="extraBig" numeric />,
  ].filter(Boolean);

  return (
    <Shell>
      <Pic id="logo" w={compact ? 120 : 170} h={compact ? 120 : 170} />
      <div style={{ height: 14 }} />
      <T id="org" size={22} weight={500} tracking={60} color={BRAND.silver} />
      <Spacer min={14} />

      <T id="kicker" size={compact ? 40 : 52} weight={700} tracking={70} color={c.accent} style={{ textShadow: `0 0 28px ${rgba(c.accent, 0.6)}` }} />
      <div style={{ height: 6 }} />
      <Brackets>
        <T id="title" size={compact ? 92 : tall ? 120 : 108} italic metal lh={0.96} tracking={1} />
      </Brackets>

      <Spacer min={20} />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
        <Team logo="teamALogo" name="teamA" tag="teamATag" size={crest} />
        <T id="vs" size={compact ? 80 : 110} weight={700} italic color={c.accent} style={{ textShadow: `0 0 30px ${rgba(c.accent, 0.7)}` }} />
        <Team logo="teamBLogo" name="teamB" tag="teamBTag" size={crest} />
      </div>

      <Spacer min={20} />
      <Notch />
      <div style={{ height: compact ? 20 : 30 }} />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
        {stats.map((s, i) => (
          <Fragment key={i}>
            {i > 0 && <VDivider />}
            {s}
          </Fragment>
        ))}
      </div>

      {c.show("stream") && (
        <div style={{ marginTop: compact ? 20 : 32, display: "flex", alignItems: "center", gap: 18, padding: "12px 30px", border: `1px solid ${rgba(c.accent, 0.5)}`, background: rgba(c.accent, 0.1) }}>
          <Icon name="signal" size={38} />
          <T id="streamLabel" size={24} weight={600} tracking={30} color={BRAND.silver} />
          <T id="streamValue" size={28} weight={700} tracking={8} color="#fff" upper={false} />
        </div>
      )}

      <Spacer min={20} />
      <Footer />
    </Shell>
  );
}

export const matchday: TemplateDef = {
  id: "matchday",
  name: "Matchday",
  blurb: "Team vs team with logos, time and stream.",
  defaultBg: "/posters/bg-helicopter.webp",
  defaultDim: 0.42,
  sections: [
    { id: "when", label: "When", optional: true },
    { id: "where", label: "Map", optional: true },
    { id: "extra", label: "Format", optional: true },
    { id: "stream", label: "Stream bar", optional: true },
  ],
  fields: [
    { id: "logo", label: "Logo", kind: "image", default: "/logo-clear.png", shared: true },
    { id: "org", label: "Organization line", kind: "text", default: "GenXio Organization", shared: true },
    { id: "kicker", label: "Kicker", kind: "text", default: "Matchday" },
    { id: "title", label: "Round / title", kind: "textarea", default: "Semi-Final" },
    { id: "teamA", label: "Team A", kind: "text", default: "Team Alpha" },
    { id: "teamALogo", label: "Team A logo", kind: "image", default: "" },
    { id: "teamATag", label: "Team A tag (shown until logo is added)", kind: "text", default: "T¹" },
    { id: "vs", label: "Versus text", kind: "text", default: "VS" },
    { id: "teamB", label: "Team B", kind: "text", default: "Team Bravo" },
    { id: "teamBLogo", label: "Team B logo", kind: "image", default: "" },
    { id: "teamBTag", label: "Team B tag (shown until logo is added)", kind: "text", default: "T²" },
    { id: "whenSmall", label: "Small text", kind: "text", default: "Today", section: "when" },
    { id: "whenBig", label: "Big text", kind: "text", default: "8PM", section: "when" },
    { id: "whereSmall", label: "Small text", kind: "text", default: "Map:", section: "where" },
    { id: "whereBig", label: "Map", kind: "map", default: "Verdansk", section: "where" },
    { id: "extraBig", label: "Number", kind: "text", default: "Bo3", section: "extra" },
    { id: "extraSmall", label: "Label", kind: "text", default: "Format", section: "extra" },
    { id: "streamLabel", label: "Label", kind: "text", default: "Watch live", section: "stream" },
    { id: "streamValue", label: "Link / channel", kind: "text", default: "youtube.com/genxio", section: "stream" },
    { id: "tagline", label: "Footer tagline", kind: "text", default: "Play. Evolve. Dominate.", shared: true },
  ],
  Component: Layout,
};
