"use client";

import { Fragment } from "react";
import { usePoster } from "../context";
import { Brackets, Cta, Footer, Masthead, Notch, Shell, Spacer, Stat, T, VDivider, useSize } from "../parts";
import { BRAND, rgba } from "../theme";
import type { TemplateDef } from "../types";

function Layout() {
  const c = usePoster();
  const { compact, tall } = useSize();

  const stats = [
    c.show("when") && <Stat key="when" section="when" icon="calendar" small="whenSmall" big="whenBig" />,
    c.show("mode") && <Stat key="mode" section="mode" icon="crosshair" small="modeSmall" big="modeBig" />,
    c.show("extra") && <Stat key="extra" section="extra" icon="layers" small="extraSmall" big="extraBig" numeric />,
  ].filter(Boolean);

  return (
    <Shell>
      <Masthead size={compact ? 120 : tall ? 240 : 190} />
      <Spacer min={10} />
      <T id="kicker" size={compact ? 34 : 44} weight={700} tracking={60} color={c.accent} style={{ textShadow: `0 0 28px ${rgba(c.accent, 0.6)}` }} />
      <div style={{ height: 6 }} />
      <Brackets>
        <T id="title" size={compact ? 110 : tall ? 150 : 134} italic metal lh={0.96} tracking={1} />
      </Brackets>
      <div style={{ height: 14 }} />
      <T id="description" size={26} weight={500} tracking={4} color={BRAND.silver} style={{ maxWidth: 780 }} />
      <Spacer min={16} />
      <Notch />
      <div style={{ height: compact ? 20 : 32 }} />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
        {stats.map((s, i) => (
          <Fragment key={i}>
            {i > 0 && <VDivider />}
            {s}
          </Fragment>
        ))}
      </div>
      <Spacer min={16} />
      <Cta section="note" icon="clock" label="noteLabel" value="note" />
      <Spacer min={16} />
      <Footer />
    </Shell>
  );
}

export const scrim: TemplateDef = {
  id: "scrim",
  name: "Scrim Announcement",
  blurb: "Date, mode, lobbies and a join reminder.",
  defaultBg: "/posters/bg-ruins.webp",
  sections: [
    { id: "when", label: "When", optional: true },
    { id: "mode", label: "Mode / map", optional: true },
    { id: "extra", label: "Lobbies", optional: true },
    { id: "note", label: "Reminder bar", optional: true },
  ],
  fields: [
    { id: "logo", label: "Logo", kind: "image", default: "/logo-clear.png", shared: true },
    { id: "org", label: "Organization line", kind: "text", default: "GenXio Organization", shared: true },
    { id: "kicker", label: "Kicker", kind: "text", default: "Scrim night" },
    { id: "title", label: "Title", kind: "textarea", default: "Scrim\nSession" },
    { id: "description", label: "Description", kind: "textarea", default: "" },
    { id: "whenSmall", label: "Small text", kind: "text", default: "Tonight", section: "when" },
    { id: "whenBig", label: "Big text", kind: "text", default: "8PM", section: "when" },
    { id: "modeSmall", label: "Small text", kind: "text", default: "Mode:", section: "mode" },
    { id: "modeBig", label: "Big text", kind: "map", default: "Verdansk", section: "mode" },
    { id: "extraBig", label: "Number", kind: "text", default: "3", section: "extra" },
    { id: "extraSmall", label: "Label", kind: "text", default: "Lobbies", section: "extra" },
    { id: "noteLabel", label: "Label", kind: "text", default: "Reminder", section: "note" },
    { id: "note", label: "Message", kind: "text", default: "Join voice 15 min early", section: "note" },
    { id: "tagline", label: "Footer tagline", kind: "text", default: "Play. Evolve. Dominate.", shared: true },
  ],
  Component: Layout,
};
