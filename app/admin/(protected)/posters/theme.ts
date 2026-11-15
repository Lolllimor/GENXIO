// GenXio poster design system — tokens shared by every template.

export const BRAND = {
  black: "#050507",
  charcoal: "#0d0d13",
  steel: "#1a1a23",
  silver: "#d9d9e3",
  silverDim: "#9a9aab",
  purple: "#8b5cf6",
};

export const FONT_DISPLAY = "var(--font-display)";

/** Brushed-metal text fill. */
export const METAL =
  "linear-gradient(180deg,#ffffff 0%,#ececf4 36%,#a9a9bb 60%,#f6f6fb 100%)";

export const ACCENTS = ["#8b5cf6", "#a855f7", "#6366f1", "#22d3ee", "#f59e0b", "#ef4444", "#22c55e", "#e5e7eb"];

function parse(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(full, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function rgba(hex: string, a: number) {
  const [r, g, b] = parse(hex);
  return `rgba(${r},${g},${b},${a})`;
}

/** Darken toward black by factor 0–1. */
export function shade(hex: string, factor: number) {
  const [r, g, b] = parse(hex).map((v) => Math.round(v * (1 - factor)));
  return `rgb(${r},${g},${b})`;
}
