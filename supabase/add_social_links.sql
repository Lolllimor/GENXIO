-- Public social links on org_settings.
-- Works whether id is uuid or boolean. Safe to run more than once.

alter table public.org_settings add column if not exists whatsapp_url text;
alter table public.org_settings add column if not exists discord_url text;
alter table public.org_settings add column if not exists tiktok_url text;

alter table public.org_settings enable row level security;

drop policy if exists "admins manage org settings" on public.org_settings;
create policy "admins manage org settings"
  on public.org_settings for all
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "anyone can read org settings" on public.org_settings;
create policy "anyone can read org settings"
  on public.org_settings for select
  using (true);

grant select on public.org_settings to anon, authenticated;
grant insert, update on public.org_settings to authenticated;

notify pgrst, 'reload schema';
