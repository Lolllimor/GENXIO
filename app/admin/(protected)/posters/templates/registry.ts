import type { BgState, PosterDoc, TemplateDef } from "../types";
import { matchday } from "./Matchday";
import { tournamentAnnouncement } from "./TournamentAnnouncement";
import { winnersAnnouncement } from "./WinnersAnnouncement";

export const TEMPLATES: TemplateDef[] = [tournamentAnnouncement, winnersAnnouncement, matchday];

/** Planned next — listed in the picker so the roadmap is visible. */
export const UPCOMING = [
  "Tournament Results / Standings",
  "Team Lineup / Roster Reveal",
  "MVP Announcement",
  "Hot Drop / Map Rotation",
  "Recruitment Poster",
  "Scrim Announcement",
  "Tournament Registration",
];

export function getTemplate(id: string): TemplateDef {
  return TEMPLATES.find((t) => t.id === id) ?? TEMPLATES[0];
}

export function defaultBg(src: string | null, dim = 0.04): BgState {
  return { src, grayscale: false, dim, zoom: 1, x: 50, y: 50 };
}

export function makeDoc(templateId: string): PosterDoc {
  const tpl = getTemplate(templateId);
  return {
    templateId: tpl.id,
    format: "portrait",
    accent: "#8b5cf6",
    bg: defaultBg(tpl.defaultBg, tpl.defaultDim),
    values: {},
    images: {},
    hidden: {},
    adjust: {},
  };
}
