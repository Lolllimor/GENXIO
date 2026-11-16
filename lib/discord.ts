import type { SupabaseClient } from "@supabase/supabase-js";
import type { TeamResult } from "./tournaments";

/**
 * Discord integration is switched off for now. To turn it on later:
 *   1. run supabase/add_discord_alerts.sql in the Supabase SQL editor
 *   2. set this to true
 *   3. add the webhook URL under Settings → Discord alerts
 */
export const DISCORD_ENABLED = false;

export const WEBHOOK_KEY = "discord_webhook_url";
export const NOTIFY_APPLICATIONS_KEY = "discord_notify_applications";

const WEBHOOK_RE = /^https:\/\/(canary\.|ptb\.)?(discord|discordapp)\.com\/api\/webhooks\//;
export const isDiscordWebhook = (url: string) => WEBHOOK_RE.test(url.trim());

/** The saved webhook URL (admin-only table), or null if none is set. */
export async function getDiscordWebhook(supabase: SupabaseClient): Promise<string | null> {
  const { data } = await supabase.from("admin_settings").select("value").eq("key", WEBHOOK_KEY).maybeSingle();
  const url = (data?.value as string | undefined)?.trim();
  return url && isDiscordWebhook(url) ? url : null;
}

/** Post to a Discord webhook. Returns an error message, or null on success. Mentions are always disabled. */
export async function sendDiscord(url: string, payload: Record<string, unknown>): Promise<string | null> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "GenXio Admin", allowed_mentions: { parse: [] }, ...payload }),
    });
    if (res.ok) return null;
    return res.status === 404 ? "Discord says that webhook doesn't exist — check the URL." : `Discord rejected the message (${res.status}).`;
  } catch {
    return "Couldn't reach Discord. Check your connection and the webhook URL.";
  }
}

const PURPLE = 0x8b5cf6;
const clip = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1) + "…" : s);

export function tournamentEmbed(name: string, results: TeamResult[], board: { ign: string; kills: number }[]) {
  const medals = ["🥇", "🥈", "🥉"];
  const standings = results
    .map((r, i) => `${medals[i] ?? `**${r.placement}.**`} **${r.name}** — ${r.kills} kill${r.kills === 1 ? "" : "s"}${r.players.length ? ` (${r.players.map((p) => `${p.ign} ${p.kills}`).join(", ")})` : ""}`)
    .join("\n");
  const top = board.slice(0, 5).map((p, i) => `${i + 1}. **${p.ign}** — ${p.kills}`).join("\n");
  return {
    embeds: [
      {
        title: `🏆 ${clip(name || "Tournament", 200)} — results`,
        description: clip(standings || "No teams yet.", 3500),
        color: PURPLE,
        fields: top ? [{ name: "Top players", value: clip(top, 1000) }] : [],
        footer: { text: "GenXio Esports · Play. Evolve. Dominate." },
      },
    ],
  };
}

export const messageContent = (text: string) => ({ content: clip(text, 1990) });
