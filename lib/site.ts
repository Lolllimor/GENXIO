// Single source of truth for SEO: set NEXT_PUBLIC_SITE_URL (e.g. https://yourdomain.com) in production.

const raw =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "") ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "") ||
  "http://localhost:3000";

export const SITE_URL = raw.replace(/\/+$/, "");
export const SITE_NAME = "GenXio Esports";
export const SITE_TAGLINE = "Play. Evolve. Dominate.";
export const SITE_DESCRIPTION =
  "GenXio is a competitive Call of Duty Mobile (CODM) esports clan. Scrims, ranked pushes and tournaments — now recruiting MP and BR players.";
