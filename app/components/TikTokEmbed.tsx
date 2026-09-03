import { tiktokPlayerSrc } from "@/lib/tiktok";

export default function TikTokEmbed({ videoId, title }: { videoId: string; title: string }) {
  return (
    <div className="tiktok-embed-host">
      <iframe
        src={tiktokPlayerSrc(videoId)}
        title={title}
        allow="encrypted-media; fullscreen; picture-in-picture"
        allowFullScreen
        loading="lazy"
      />
    </div>
  );
}
