-- Homepage TikTok embed fields on org_settings.
-- Safe to run more than once.

alter table public.org_settings add column if not exists tiktok_video_url text;
alter table public.org_settings add column if not exists tiktok_video_title text;
alter table public.org_settings add column if not exists tiktok_video_caption text;

update public.org_settings
set
  tiktok_video_url = coalesce(
    nullif(tiktok_video_url, ''),
    'https://www.tiktok.com/@genioontt/video/7678225405064645906'
  ),
  tiktok_video_title = coalesce(nullif(tiktok_video_title, ''), '2–1 vs WeChillin'),
  tiktok_video_caption = coalesce(
    nullif(tiktok_video_caption, ''),
    'Extended highlights from GenXio E-Sports'' win over WeChillin.'
  )
where tiktok_video_url is null or tiktok_video_url = '';

notify pgrst, 'reload schema';
