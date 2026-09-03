export const MP_OPERATORS = [
  "Purifier", "Annihilator", "Death Machine", "Gravity Vortex Gun", "Equalizer",
  "Ballista EM3", "Ballistic Shield", "Barricade", "Bull Charge", "Claw",
  "Control Field", "H.I.V.E.", "Havoc", "K9-Unit", "Kinetic Armor",
  "Misdirection Device", "Munitions Box", "Reactor Core", "Scythe", "Shadow Blade",
  "Sparrow", "Tac-Deploy", "TAK-5", "Tempest", "Transform Shield", "War Machine", "Other",
];

export const BR_CLASSES = [
  "Ninja", "Medic", "Scout", "Mechanic", "Defender", "Airborne", "Clown", "Trickster",
  "Shockwave", "Spotter", "Toxic Overload", "Desperado", "Rewind", "Jet Boost",
  "Tactical Mirror", "Smoke Bomber", "Trap Master", "Pumped", "Quick Strike", "Other",
];

export const ACTIVITY_LEVELS = ["Low", "Average", "High"] as const;

export const CLAN_TEAMS = [
  { id: "e-sport", label: "E-Sport", rank: 1, hint: "Best" },
  { id: "elites", label: "Elites", rank: 2, hint: "Second" },
  { id: "underdog", label: "Underdog", rank: 3, hint: "Last" },
] as const;

export const CLAN_TEAM_STYLE: Record<(typeof CLAN_TEAMS)[number]["id"], string> = {
  "e-sport": "border-amber bg-amber/10 text-amber",
  elites: "border-purple bg-purple/10 text-purple",
  underdog: "border-line bg-panel-2 text-text-dim",
};

export function clanTeamMeta(id: string | null | undefined) {
  return CLAN_TEAMS.find((t) => t.id === id) ?? null;
}
