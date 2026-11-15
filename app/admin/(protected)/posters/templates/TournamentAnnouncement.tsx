"use client";

import { FORMATS } from "../formats";
import { usePoster } from "../context";
import { Brackets, Footer, Notch, Pic, Shell, Spacer, Stat, T, VDivider } from "../parts";
import { BRAND } from "../theme";
import type { TemplateDef } from "../types";
import { Fragment } from "react";

function Layout() {
  const c = usePoster();
  const { h } = FORMATS[c.doc.format];
  const compact = h <= 1080;
  const tall = h > 1500;
  const logo = compact ? 200 : tall ? 330 : 270;

  const stats = [
    c.show("when") && <Stat key="when" section="when" icon="calendar" small="whenSmall" big="whenBig" />,
    c.show("where") && <Stat key="where" section="where" icon="crosshair" small="map" big="whereBig" />,
    c.show("extra") && <Stat key="extra" section="extra" icon="layers" small="extraSmall" big="extraBig" numeric />,
  ].filter(Boolean);

  return (
    <Shell>
      <Pic id="logo" w={logo} h={logo} />
      <div style={{ height: compact ? 8 : 18 }} />
      <T id="org" size={24} weight={500} tracking={60} color={BRAND.silver} />
      <Spacer />
      <Brackets>
        <T id="title" size={compact ? 124 : tall ? 156 : 146} italic metal lh={0.96} tracking={1} />
      </Brackets>
      <div style={{ height: 22 }} />
      <T id="description" size={26} weight={500} tracking={4} color={BRAND.silver} style={{ maxWidth: 760 }} />
      <Spacer />
      <Notch />
      <div style={{ height: compact ? 22 : 34 }} />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
        {stats.map((s, i) => (
          <Fragment key={i}>
            {i > 0 && <VDivider />}
            {s}
          </Fragment>
        ))}
      </div>
      <Spacer min={compact ? 20 : 34} />
      <Footer />
    </Shell>
  );
}

export const tournamentAnnouncement: TemplateDef = {
  id: "tournament",
  name: "Tournament Announcement",
  blurb: "Title, date, hot drop and lobby count.",
  defaultBg: "/posters/bg-ruins.webp",
  sections: [
    { id: "when", label: "When", optional: true },
    { id: "where", label: "Map & hot drop", optional: true },
    { id: "extra", label: "Third stat", optional: true },
  ],
  fields: [
    { id: "logo", label: "Logo", kind: "image", default: "/logo-clear.png", shared: true },
    { id: "org", label: "Organization line", kind: "text", default: "GenXio Organization", shared: true },
    { id: "title", label: "Title", kind: "textarea", default: "Inners\nTournament" },
    { id: "description", label: "Description", kind: "textarea", default: "" },
    { id: "whenSmall", label: "Small text", kind: "text", default: "Tomorrow", section: "when" },
    { id: "whenBig", label: "Big text", kind: "text", default: "9PM", section: "when" },
    { id: "map", label: "Map", kind: "map", default: "Verdansk", section: "where" },
    { id: "whereBig", label: "Hot drop", kind: "hotdrop", default: "Airport", section: "where" },
    { id: "extraBig", label: "Number", kind: "text", default: "4", section: "extra" },
    { id: "extraSmall", label: "Label", kind: "text", default: "Lobbies", section: "extra" },
    { id: "tagline", label: "Footer tagline", kind: "text", default: "Play. Evolve. Dominate.", shared: true },
  ],
  Component: Layout,
};
