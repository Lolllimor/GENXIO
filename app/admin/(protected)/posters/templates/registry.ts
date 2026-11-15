import type { BgState, PosterDoc, TemplateDef } from "../types";
import { hotdrop } from "./HotDrop";
import { leaderboard } from "./Leaderboard";
import { lineup } from "./Lineup";
import { matchday } from "./Matchday";
import { mvp } from "./Mvp";
import { recruitment } from "./Recruitment";
import { registration } from "./Registration";
import { results } from "./Results";
import { scrim } from "./Scrim";
import { tournamentAnnouncement } from "./TournamentAnnouncement";
import { winnersAnnouncement } from "./WinnersAnnouncement";

export const TEMPLATES: TemplateDef[] = [
  tournamentAnnouncement,
  winnersAnnouncement,
  matchday,
  results,
  leaderboard,
  lineup,
  mvp,
  hotdrop,
  recruitment,
  scrim,
  registration,
];

/** Templates planned next — listed in the picker. Empty now that all ten exist. */
export const UPCOMING: string[] = [];

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
