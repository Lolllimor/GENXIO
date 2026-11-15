"use client";

import { Fragment } from "react";
import { FORMATS } from "../formats";
import { Block, Emblem, Footer, Icon, Notch, Pic, Shell, Spacer, T, VDivider } from "../parts";
import { usePoster } from "../context";
import { BRAND, FONT_DISPLAY, rgba } from "../theme";
import type { TemplateDef } from "../types";

function PlacePair({ label, name, size }: { label: string; name: string; size: number }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, minWidth: 280 }}>
      <T id={label} size={24} weight={600} tracking={35} color={BRAND.silverDim} />
      <T id={name} size={size} weight={700} italic />
    </div>
  );
}

function Layout() {
  const c = usePoster();
  const { h } = FORMATS[c.doc.format];
  const compact = h <= 1080;
  const tall = h > 1500;
  const players = c.val("players").split("\n").map((p) => p.trim()).filter(Boolean);

  const extras = [
    c.show("prize") && (
      <div key="prize" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
        <T id="prizeLabel" size={22} weight={600} tracking={35} color={BRAND.silverDim} />
        <T id="prize" size={compact ? 46 : 60} weight={700} italic color={c.accent} style={{ textShadow: `0 0 26px ${rgba(c.accent, 0.6)}` }} />
      </div>
    ),
    c.show("mvp") && (
      <div key="mvp" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
        <T id="mvpLabel" size={22} weight={600} tracking={35} color={BRAND.silverDim} />
        <T id="mvp" size={compact ? 42 : 52} weight={700} italic />
      </div>
    ),
  ].filter(Boolean);

  return (
    <Shell>
      <Pic id="logo" w={compact ? 120 : 170} h={compact ? 120 : 170} />
      <div style={{ height: 14 }} />
      <T id="org" size={22} weight={500} tracking={60} color={BRAND.silver} />
      <Spacer min={10} />

      <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
        <Icon name="trophy" size={56} />
        <T id="kicker" size={34} weight={700} tracking={55} color={c.accent} />
        <Icon name="trophy" size={56} />
      </div>
      <div style={{ height: 8 }} />
      <T id="title" size={34} weight={600} tracking={30} color={BRAND.silver} />
      <Spacer min={14} />

      <Pic
        id="winnerLogo"
        w={compact ? 130 : tall ? 340 : 220}
        h={compact ? 130 : tall ? 340 : 220}
        fallback={<Emblem name={c.val("winner")} tag={c.val("winnerTag")} />}
      />
      <div style={{ height: 16 }} />
      <T id="winner" size={compact ? 104 : tall ? 150 : 128} italic metal lh={0.95} tracking={1} style={{ maxWidth: 940 }} />
      <div style={{ height: 22 }} />

      <Block id="players">
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", alignItems: "center", gap: "8px 18px", maxWidth: 900, fontFamily: FONT_DISPLAY }}>
          {players.map((p, i) => (
            <span
              key={i}
              style={{
                fontSize: compact ? 28 : 32,
                fontWeight: 600,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "#fff",
                padding: "4px 16px",
                borderLeft: `3px solid ${c.accent}`,
                background: rgba(c.accent, 0.12),
              }}
            >
              {p}
            </span>
          ))}
        </div>
      </Block>

      <Spacer min={18} />
      <Notch />
      <div style={{ height: compact ? 18 : 30 }} />

      {c.show("runners") && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-around", width: "100%" }}>
          <PlacePair label="secondLabel" name="second" size={compact ? 42 : 52} />
          <VDivider h={84} />
          <PlacePair label="thirdLabel" name="third" size={compact ? 42 : 52} />
        </div>
      )}
      {extras.length > 0 && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-around", width: "100%", marginTop: compact ? 10 : 26 }}>
          {extras.map((e, i) => (
            <Fragment key={i}>
              {i > 0 && <VDivider h={84} />}
              {e}
            </Fragment>
          ))}
        </div>
      )}

      <Spacer min={20} />
      <Footer />
    </Shell>
  );
}

export const winnersAnnouncement: TemplateDef = {
  id: "winners",
  name: "Winners Announcement",
  blurb: "Champions, runners-up, prize and MVP.",
  defaultBg: "/posters/bg-corridor.webp",
  sections: [
    { id: "runners", label: "Runners-up", optional: true },
    { id: "prize", label: "Prize pool", optional: true },
    { id: "mvp", label: "Tournament MVP", optional: true },
  ],
  fields: [
    { id: "logo", label: "Logo", kind: "image", default: "/logo-clear.png", shared: true },
    { id: "org", label: "Organization line", kind: "text", default: "GenXio Organization", shared: true },
    { id: "kicker", label: "Kicker", kind: "text", default: "Champions" },
    { id: "title", label: "Event name", kind: "text", default: "Inners Tournament" },
    { id: "winnerLogo", label: "Winner team logo", kind: "image", default: "" },
    { id: "winner", label: "Winning team", kind: "text", default: "Team Phantom" },
    { id: "winnerTag", label: "Placeholder tag (auto: T¹)", kind: "text", default: "" },
    { id: "players", label: "Players (one per line)", kind: "textarea", default: "Player One\nPlayer Two\nPlayer Three\nPlayer Four" },
    { id: "secondLabel", label: "Label", kind: "text", default: "2nd place", section: "runners" },
    { id: "second", label: "Team", kind: "text", default: "Team Viper", section: "runners" },
    { id: "thirdLabel", label: "Label", kind: "text", default: "3rd place", section: "runners" },
    { id: "third", label: "Team", kind: "text", default: "Team Ghost", section: "runners" },
    { id: "prizeLabel", label: "Label", kind: "text", default: "Prize pool", section: "prize" },
    { id: "prize", label: "Amount", kind: "text", default: "₦100,000", section: "prize" },
    { id: "mvpLabel", label: "Label", kind: "text", default: "Tournament MVP", section: "mvp" },
    { id: "mvp", label: "Player", kind: "text", default: "Player One", section: "mvp" },
    { id: "tagline", label: "Footer tagline", kind: "text", default: "Play. Evolve. Dominate.", shared: true },
  ],
  Component: Layout,
};
