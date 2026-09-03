import { supabaseConfigured } from "@/lib/supabase/env";
import { createPublicClient } from "@/lib/supabase/public";
import { parseTikTokVideoId, tiktokWatchUrl, fetchTikTokMeta } from "./tiktok";

export type OrgSocialLink = {
  label: string;
  href: string;
};

export type OrgTikTokEmbed = {
  watchUrl: string;
  videoId: string;
  title: string;
  caption: string;
};

const TIKTOK_FALLBACK_URL = "https://www.tiktok.com/@genioontt/video/7678225405064645906";
const TIKTOK_FALLBACK_ID = "7678225405064645906";

export async function getOrgSocialLinks(): Promise<OrgSocialLink[]> {
  if (!supabaseConfigured) return [];
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("org_settings")
    .select("whatsapp_url, discord_url, tiktok_url")
    .limit(1)
    .maybeSingle();

  if (error || !data) return [];

  const links: OrgSocialLink[] = [
    { label: "WhatsApp", href: data.whatsapp_url ?? "" },
    { label: "Discord", href: data.discord_url ?? "" },
    { label: "TikTok", href: data.tiktok_url ?? "" },
  ];

  return links.filter((s) => Boolean(s.href.trim()));
}

async function embedFromUrl(watchUrl: string, videoId: string): Promise<OrgTikTokEmbed> {
  const meta = await fetchTikTokMeta(watchUrl);
  return { watchUrl, videoId, ...meta };
}

export async function getOrgTikTokEmbed(): Promise<OrgTikTokEmbed | null> {
  if (!supabaseConfigured) {
    return embedFromUrl(TIKTOK_FALLBACK_URL, TIKTOK_FALLBACK_ID);
  }
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("org_settings")
    .select("tiktok_url, tiktok_video_url")
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return embedFromUrl(TIKTOK_FALLBACK_URL, TIKTOK_FALLBACK_ID);
  }

  const raw = (data.tiktok_video_url as string | null)?.trim() ?? "";
  if (!raw) return null;

  const videoId = parseTikTokVideoId(raw);
  if (!videoId) return null;

  const watchUrl = raw.includes("tiktok.com")
    ? raw.split("?")[0]
    : tiktokWatchUrl(videoId, data.tiktok_url);

  return embedFromUrl(watchUrl, videoId);
}
