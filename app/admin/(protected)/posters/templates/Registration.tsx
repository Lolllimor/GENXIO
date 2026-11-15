"use client";

import { usePoster } from "../context";
import { Block, Brackets, Cta, Footer, Icon, Masthead, Notch, Shell, Spacer, T, cols, lines, useSize } from "../parts";
import { BRAND, FONT_DISPLAY, rgba } from "../theme";
import type { TemplateDef } from "../types";

const ICON_CYCLE = ["layers", "users", "trophy", "bolt", "star", "crosshair"];

function Layout() {
  const c = usePoster();
  const { compact, tall } = useSize();
  const details = lines(c.val("details")).slice(0, 6).map(cols);

  return (
    <Shell>
      <Masthead size={compact ? 100 : 150} />
      <Spacer min={10} />
      <T id="kicker" size={compact ? 34 : 44} weight={700} tracking={60} color={c.accent} style={{ textShadow: `0 0 28px ${rgba(c.accent, 0.6)}` }} />
      <div style={{ height: 6 }} />
      <Brackets>
        <T id="title" size={compact ? 100 : tall ? 140 : 124} italic metal lh={0.96} tracking={1} />
      </Brackets>
      <div style={{ height: 14 }} />
      <T id="description" size={26} weight={500} tracking={4} color={BRAND.silver} style={{ maxWidth: 780 }} />
      <Spacer min={14} />
      <Notch />
      <div style={{ height: 20 }} />

      {c.show("details") && details.length > 0 && (
        <Block id="details">
          <div style={{ display: "grid", gridTemplateColumns: details.length > 2 && !compact ? "1fr 1fr" : "1fr", gap: 12, width: 940, fontFamily: FONT_DISPLAY }}>
            {details.map((d, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 18, padding: "14px 20px", background: "rgba(255,255,255,0.05)", borderLeft: `4px solid ${c.accent}` }}>
                <Icon name={ICON_CYCLE[i % ICON_CYCLE.length]} size={44} />
                <div>
                  <div style={{ fontSize: 20, fontWeight: 600, letterSpacing: "0.25em", textTransform: "uppercase", color: BRAND.silverDim }}>{d[0]}</div>
                  <div style={{ fontSize: 36, fontWeight: 700, fontStyle: "italic", textTransform: "uppercase", color: "#fff", lineHeight: 1.05 }}>{d[1] ?? ""}</div>
                </div>
              </div>
            ))}
          </div>
        </Block>
      )}

      {c.show("deadline") && (
        <div style={{ marginTop: 20, display: "flex", alignItems: "center", gap: 20 }}>
          <T id="deadlineLabel" size={24} weight={600} tracking={40} color={BRAND.silverDim} />
          <T id="deadline" size={compact ? 48 : 58} weight={700} italic color={c.accent} style={{ textShadow: `0 0 26px ${rgba(c.accent, 0.6)}` }} />
        </div>
      )}

      <Spacer min={14} />
      <Cta section="cta" icon="megaphone" label="ctaLabel" value="ctaValue" />
      <Spacer min={14} />
      <Footer />
    </Shell>
  );
}

export const registration: TemplateDef = {
  id: "registration",
  name: "Tournament Registration",
  blurb: "Format, slots, entry, deadline and sign-up link.",
  defaultBg: "/posters/bg-corridor.webp",
  defaultDim: 0.3,
  sections: [
    { id: "details", label: "Details", optional: true },
    { id: "deadline", label: "Deadline", optional: true },
    { id: "cta", label: "Register bar", optional: true },
  ],
  fields: [
    { id: "logo", label: "Logo", kind: "image", default: "/logo-clear.png", shared: true },
    { id: "org", label: "Organization line", kind: "text", default: "GenXio Organization", shared: true },
    { id: "kicker", label: "Kicker", kind: "text", default: "Registrations open" },
    { id: "title", label: "Title", kind: "textarea", default: "Inners\nTournament" },
    { id: "description", label: "Description", kind: "textarea", default: "" },
    { id: "details", label: "Rows: label | value", kind: "textarea", default: "Format | Squads (4v4)\nSlots | 16 teams\nEntry | Free\nPrize | ₦100,000", section: "details" },
    { id: "deadlineLabel", label: "Label", kind: "text", default: "Closes", section: "deadline" },
    { id: "deadline", label: "Date", kind: "text", default: "Fri 9PM", section: "deadline" },
    { id: "ctaLabel", label: "Label", kind: "text", default: "Register", section: "cta" },
    { id: "ctaValue", label: "Link / contact", kind: "text", default: "genxio.com/apply", section: "cta" },
    { id: "tagline", label: "Footer tagline", kind: "text", default: "Play. Evolve. Dominate.", shared: true },
  ],
  Component: Layout,
};
