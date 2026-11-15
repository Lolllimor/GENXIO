"use client";

import { usePoster } from "../context";
import { Block, Brackets, Cta, Footer, Icon, Masthead, Notch, Shell, Spacer, T, lines, useSize } from "../parts";
import { BRAND, FONT_DISPLAY, rgba } from "../theme";
import type { TemplateDef } from "../types";

function Layout() {
  const c = usePoster();
  const { compact, tall } = useSize();
  const roles = lines(c.val("roles")).slice(0, 8);
  const reqs = lines(c.val("requirements")).slice(0, 6);

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

      {c.show("roles") && roles.length > 0 && (
        <>
          <T id="rolesLabel" size={22} weight={600} tracking={45} color={BRAND.silverDim} />
          <div style={{ height: 12 }} />
          <Block id="roles">
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 12, maxWidth: 940, fontFamily: FONT_DISPLAY }}>
              {roles.map((r, i) => (
                <span key={i} style={{ fontSize: 30, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", padding: "8px 22px", border: `1px solid ${rgba(c.accent, 0.7)}`, background: rgba(c.accent, 0.14), color: "#fff" }}>
                  {r}
                </span>
              ))}
            </div>
          </Block>
        </>
      )}

      {c.show("requirements") && reqs.length > 0 && (
        <>
          <div style={{ height: 24 }} />
          <T id="reqLabel" size={22} weight={600} tracking={45} color={BRAND.silverDim} />
          <div style={{ height: 12 }} />
          <Block id="requirements">
            <div style={{ display: "grid", gridTemplateColumns: reqs.length > 3 && !compact ? "1fr 1fr" : "1fr", gap: "10px 40px", width: 900, fontFamily: FONT_DISPLAY }}>
              {reqs.map((r, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <Icon name="check" size={32} />
                  <span style={{ fontSize: 28, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", color: "#fff" }}>{r}</span>
                </div>
              ))}
            </div>
          </Block>
        </>
      )}

      <Spacer min={16} />
      <Cta section="cta" icon="megaphone" label="ctaLabel" value="ctaValue" />
      <Spacer min={16} />
      <Footer />
    </Shell>
  );
}

export const recruitment: TemplateDef = {
  id: "recruitment",
  name: "Recruitment",
  blurb: "Open roles, requirements and how to apply.",
  defaultBg: "/hero-bg.webp",
  defaultDim: 0.45,
  sections: [
    { id: "roles", label: "Roles", optional: true },
    { id: "requirements", label: "Requirements", optional: true },
    { id: "cta", label: "Apply bar", optional: true },
  ],
  fields: [
    { id: "logo", label: "Logo", kind: "image", default: "/logo-clear.png", shared: true },
    { id: "org", label: "Organization line", kind: "text", default: "GenXio Organization", shared: true },
    { id: "kicker", label: "Kicker", kind: "text", default: "Now recruiting" },
    { id: "title", label: "Title", kind: "textarea", default: "Join\nGenXio" },
    { id: "description", label: "Description", kind: "textarea", default: "Competitive Call of Duty Mobile clan built on discipline, skill and unity." },
    { id: "rolesLabel", label: "Heading", kind: "text", default: "Open roles", section: "roles" },
    { id: "roles", label: "Roles (one per line)", kind: "textarea", default: "MP Slayer\nBR Strategist\nSniper\nSupport", section: "roles" },
    { id: "reqLabel", label: "Heading", kind: "text", default: "Requirements", section: "requirements" },
    { id: "requirements", label: "Requirements (one per line)", kind: "textarea", default: "Active daily\nMic & good comms\nScrim availability\nTeam player attitude", section: "requirements" },
    { id: "ctaLabel", label: "Label", kind: "text", default: "Apply now", section: "cta" },
    { id: "ctaValue", label: "Link / contact", kind: "text", default: "genxio.com/apply", section: "cta" },
    { id: "tagline", label: "Footer tagline", kind: "text", default: "Play. Evolve. Dominate.", shared: true },
  ],
  Component: Layout,
};
