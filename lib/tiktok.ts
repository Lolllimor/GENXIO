export function parseTikTokVideoId(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const match =
    trimmed.match(/\/video\/(\d+)/) ||
    trimmed.match(/player\/v1\/(\d+)/) ||
    trimmed.match(/^(\d{8,})$/);
  return match?.[1] ?? null;
}

export function tiktokWatchUrl(videoId: string, profileUrl?: string | null) {
  const handle = profileUrl?.match(/tiktok\.com\/(@[\w.]+)/)?.[1];
  if (handle) return `https://www.tiktok.com/${handle}/video/${videoId}`;
  return `https://www.tiktok.com/video/${videoId}`;
}

export function tiktokPlayerSrc(videoId: string) {
  return (
    `https://www.tiktok.com/player/v1/${videoId}` +
    "?controls=1&progress_bar=1&play_button=1&volume_control=1&fullscreen_button=1&rel=0"
  );
}

export async function fetchTikTokMeta(watchUrl: string): Promise<{ title: string; caption: string }> {
  try {
    const res = await fetch(`https://www.tiktok.com/oembed?url=${encodeURIComponent(watchUrl)}`, {
      next: { revalidate: 3600 },
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return { title: "From TikTok", caption: "" };

    const data = (await res.json()) as { title?: string; author_name?: string };
    const text = (data.title ?? "").trim();
    const author = data.author_name?.trim();
    const hashtags = text.match(/#\S+/g)?.join(" ") ?? "";
    const withoutTags = text.replace(/#\S+/g, " ").replace(/\s+/g, " ").trim();
    const title = withoutTags || (author ? `@${author}` : "From TikTok");
    const caption = [author && title !== `@${author}` ? `@${author}` : "", hashtags]
      .filter(Boolean)
      .join(" · ");
    return { title, caption };
  } catch {
    return { title: "From TikTok", caption: "" };
  }
}
