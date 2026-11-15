import type { MetadataRoute } from "next";
import { supabaseConfigured } from "@/lib/supabase/env";
import { createPublicClient } from "@/lib/supabase/public";
import { SITE_URL } from "@/lib/site";

export const revalidate = 3600;

/** News and achievements only appear once they have published content (otherwise they're "coming soon" pages). */
async function hasPublished(table: "news_posts" | "achievements") {
  if (!supabaseConfigured) return false;
  const { count } = await createPublicClient().from(table).select("id", { count: "exact", head: true }).eq("published", true);
  return (count ?? 0) > 0;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const pages: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/apply`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
  ];
  if (await hasPublished("news_posts")) pages.push({ url: `${SITE_URL}/news`, lastModified: now, changeFrequency: "weekly", priority: 0.6 });
  if (await hasPublished("achievements")) pages.push({ url: `${SITE_URL}/achievements`, lastModified: now, changeFrequency: "weekly", priority: 0.6 });
  return pages;
}
