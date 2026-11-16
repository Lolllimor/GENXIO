-- Discord alerts. The webhook URL lives in an admin-only table (org_settings is publicly readable, so it must NOT go there).
-- When someone submits an application, the database itself posts to your Discord channel.
-- Safe to run more than once.

create extension if not exists pg_net with schema extensions;

create table if not exists public.admin_settings (
  key text primary key,
  value text,
  updated_at timestamptz not null default now()
);

alter table public.admin_settings enable row level security;

drop policy if exists "admins manage admin settings" on public.admin_settings;
create policy "admins manage admin settings"
  on public.admin_settings for all
  using (public.is_admin())
  with check (public.is_admin());

create or replace function public.notify_new_application()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  hook text;
  enabled text;
  payload jsonb;
begin
  select value into hook from public.admin_settings where key = 'discord_webhook_url';
  select value into enabled from public.admin_settings where key = 'discord_notify_applications';

  -- Only ever call real Discord webhooks, and only when alerts are switched on.
  if hook is null or hook !~ '^https://(canary\.|ptb\.)?(discord|discordapp)\.com/api/webhooks/' or coalesce(enabled, 'true') = 'false' then
    return new;
  end if;

  payload := jsonb_build_object(
    'username', 'GenXio Admin',
    'allowed_mentions', jsonb_build_object('parse', jsonb_build_array()),
    'embeds', jsonb_build_array(jsonb_build_object(
      'title', '📥 New application',
      'description', '**' || left(coalesce(new.clan_tag, '') || '丨' || new.ign, 100) || '** wants to join the roster.',
      'color', 9133302,
      'fields', jsonb_build_array(
        jsonb_build_object('name', 'Mode', 'value', coalesce(nullif(left(new.mode::text, 100), ''), '—'), 'inline', true),
        jsonb_build_object('name', 'MP role', 'value', coalesce(nullif(left(new.mp_role::text, 100), ''), '—'), 'inline', true),
        jsonb_build_object('name', 'Activity', 'value', coalesce(nullif(left(new.activity::text, 100), ''), '—'), 'inline', true),
        jsonb_build_object('name', 'Device', 'value', coalesce(nullif(left(new.device::text, 100), ''), '—'), 'inline', true)
      ),
      'footer', jsonb_build_object('text', 'Review it in the admin console → Applications'),
      'timestamp', to_char(now() at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
    ))
  );

  perform net.http_post(
    url := hook,
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body := payload
  );
  return new;
exception when others then
  -- A Discord problem must never block someone from applying.
  return new;
end;
$$;

revoke all on function public.notify_new_application() from public;

drop trigger if exists applications_discord_ai on public.applications;
create trigger applications_discord_ai
  after insert on public.applications
  for each row execute procedure public.notify_new_application();

notify pgrst, 'reload schema';
