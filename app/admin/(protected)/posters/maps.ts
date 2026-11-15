// Call of Duty: Mobile battle-royale maps and their hot drops.
// Starter lists only — they're editable per map in the studio and saved in the browser.

export const MAPS = ["Isolated", "Resurgence", "Verdansk", "Blackout"];

export const DEFAULT_DROPS: Record<string, string[]> = {
  Isolated: [],
  Resurgence: [],
  Verdansk: [
    "Airport", "Stadium", "Downtown", "Dam", "Superstore", "Farmland", "Hospital",
    "Military Base", "Prison", "Lumber", "Quarry", "Train Station", "Hills", "Port", "Storage Town",
  ],
  Blackout: [
    "Nuketown Island", "Array", "Cargo Docks", "Turbine", "Hydro Dam", "Asylum", "Mines",
    "Ruins", "Estate", "Construction", "Lighthouse", "Power Plant", "Tank Factory",
  ],
};

export type MapPresets = Record<string, string[]>;

export function dropsFor(presets: MapPresets, mapName: string): string[] {
  const hit = Object.keys(presets).find((k) => k.toLowerCase() === mapName.trim().toLowerCase());
  return hit ? presets[hit] : [];
}
