-- GenXio admin backend schema.
-- Run this once in the Supabase SQL editor for your project
-- (Dashboard -> SQL Editor -> New query -> paste -> Run).
--
-- Re-running this file is safe for fresh setups; if you already ran an
-- older version of this schema, apply supabase/migrations/002_expand_roster.sql
-- (or just the "alter table" statements in this file) instead of rerunning
-- the whole thing, since `create table if not exists` won't add new columns
-- to an existing table.

-- ---------- admins allowlist ----------
-- Rows here gate access to /admin. A user must exist in auth.users
-- (create them via Supabase Auth) AND have a matching row here.
create table if not exists public.admins (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  created_at timestamptz not null default now()
);

alter table public.admins enable row level security;

create policy "admins can read the allowlist"
  on public.admins for select
  using (auth.uid() = id);

-- security definer so RLS policies on other tables can call this
-- without needing their own access to public.admins.
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (select 1 from public.admins where id = auth.uid());
$$;

-- ---------- roster ----------
create table if not exists public.members (
  id uuid primary key default gen_random_uuid(),
  ign text not null,
  clan_tag text not null default 'G¹',
  whatsapp_name text,
  whatsapp_number text,
  status text not null default 'ACTIVE' check (status in ('ACTIVE', 'INACTIVE')),
  clan_team text check (clan_team in ('e-sport', 'elites', 'underdog')),
  mode text check (mode in ('MP', 'BR', 'Hybrid')),
  mp_role text,
  device text,
  notes text,
  -- playstyle (from the Team Roster sheet)
  activity text check (activity in ('Low', 'Average', 'High')),
  comps_experience boolean,
  scrim_availability boolean,
  weapons text,
  mp_operator text,
  br_class text,
  -- official tournament-org registration (from the Player Registration sheet)
  professional_name text,
  uid text,
  discord text,
  country text,
  device_serial_number text,
  joined_at date not null default current_date,
  created_at timestamptz not null default now()
);

-- Columns above are included in create table for fresh installs. For an
-- existing database created from an earlier version of this file, run:
alter table public.members add column if not exists activity text;
alter table public.members drop constraint if exists members_activity_check;
alter table public.members add constraint members_activity_check
  check (activity in ('Low', 'Average', 'High'));
alter table public.members add column if not exists comps_experience boolean;
alter table public.members add column if not exists scrim_availability boolean;
alter table public.members add column if not exists weapons text;
alter table public.members add column if not exists mp_operator text;
alter table public.members add column if not exists br_class text;
alter table public.members add column if not exists professional_name text;
alter table public.members add column if not exists uid text;
alter table public.members add column if not exists discord text;
alter table public.members add column if not exists country text;
alter table public.members add column if not exists device_serial_number text;
alter table public.members add column if not exists clan_team text;
alter table public.members drop constraint if exists members_clan_team_check;
alter table public.members add constraint members_clan_team_check
  check (clan_team in ('e-sport', 'elites', 'underdog'));

alter table public.members enable row level security;

drop policy if exists "admins manage members" on public.members;
create policy "admins manage members"
  on public.members for all
  using (public.is_admin())
  with check (public.is_admin());

-- ---------- roster timeline (added / promoted / demoted) ----------
create table if not exists public.member_history (
  id uuid primary key default gen_random_uuid(),
  member_id uuid references public.members (id) on delete set null,
  ign text not null,
  event_type text not null check (event_type in (
    'added', 'assigned', 'promoted', 'demoted', 'unassigned', 'exited'
  )),
  from_team text,
  to_team text,
  created_by uuid references public.admins (id),
  created_at timestamptz not null default now()
);

create index if not exists member_history_created_at_idx
  on public.member_history (created_at desc);
create index if not exists member_history_member_id_idx
  on public.member_history (member_id);

alter table public.member_history enable row level security;

drop policy if exists "admins manage member history" on public.member_history;
create policy "admins manage member history"
  on public.member_history for all
  using (public.is_admin())
  with check (public.is_admin());

create or replace function public.log_member_history()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  ranks constant text[] := array['e-sport', 'elites', 'underdog'];
  old_rank int;
  new_rank int;
  kind text;
begin
  if tg_op = 'INSERT' then
    insert into public.member_history (member_id, ign, event_type, from_team, to_team, created_by)
    values (new.id, new.ign, 'added', null, new.clan_team, auth.uid());
    return new;
  end if;

  if old.clan_team is distinct from new.clan_team then
    old_rank := array_position(ranks, old.clan_team);
    new_rank := array_position(ranks, new.clan_team);

    if old.clan_team is null then
      kind := 'assigned';
    elsif new.clan_team is null then
      kind := 'unassigned';
    elsif new_rank is not null and old_rank is not null and new_rank < old_rank then
      kind := 'promoted';
    elsif new_rank is not null and old_rank is not null and new_rank > old_rank then
      kind := 'demoted';
    else
      kind := 'assigned';
    end if;

    insert into public.member_history (member_id, ign, event_type, from_team, to_team, created_by)
    values (new.id, new.ign, kind, old.clan_team, new.clan_team, auth.uid());
  end if;

  if old.status is distinct from new.status and new.status = 'INACTIVE' then
    insert into public.member_history (member_id, ign, event_type, from_team, to_team, created_by)
    values (new.id, new.ign, 'exited', coalesce(new.clan_team, old.clan_team), null, auth.uid());
  end if;

  return new;
end;
$$;

revoke all on function public.log_member_history() from public;

drop trigger if exists member_history_aiu on public.members;
create trigger member_history_aiu
  after insert or update on public.members
  for each row execute procedure public.log_member_history();

-- ---------- applications (fed by the public Apply form) ----------
create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  clan_tag text not null default 'G¹',
  ign text not null,
  status text not null default 'ACTIVE' check (status in ('ACTIVE', 'INACTIVE')),
  whatsapp_name text,
  whatsapp_number text,
  activity text,
  mode text,
  mp_role text,
  device text,
  comps_experience boolean,
  scrim_availability boolean,
  weapons text,
  mp_operator text,
  br_class text,
  submitted_at timestamptz not null default now(),
  roster_status text not null default 'pending' check (roster_status in ('pending', 'accepted', 'rejected')),
  reviewed_by uuid references public.admins (id),
  reviewed_at timestamptz,
  member_id uuid references public.members (id)
);

alter table public.applications enable row level security;

drop policy if exists "admins manage applications" on public.applications;
create policy "admins manage applications"
  on public.applications for all
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "anyone can submit an application" on public.applications;
create policy "anyone can submit an application"
  on public.applications for insert
  with check (roster_status = 'pending' and reviewed_by is null and member_id is null);

-- ---------- exits (former players) ----------
create table if not exists public.exits (
  id uuid primary key default gen_random_uuid(),
  ign text not null,
  role_at_exit text,
  device text,
  weapons text,
  date_joined date,
  date_exited date not null default current_date,
  reason_for_exit text,
  whatsapp_number text,
  member_id uuid references public.members (id) on delete set null,
  created_by uuid references public.admins (id),
  created_at timestamptz not null default now()
);

alter table public.exits enable row level security;

drop policy if exists "admins manage exits" on public.exits;
create policy "admins manage exits"
  on public.exits for all
  using (public.is_admin())
  with check (public.is_admin());

-- ---------- org settings (singleton row) ----------
create table if not exists public.org_settings (
  id boolean primary key default true check (id),
  organization_name text,
  team_name text,
  team_tag text,
  manager_discord text,
  updated_at timestamptz not null default now()
);

insert into public.org_settings (id, organization_name, team_name, team_tag)
values (true, 'GENXIO E-Sports', 'Genxio E-Sports', 'G¹')
on conflict (id) do nothing;

alter table public.org_settings enable row level security;

drop policy if exists "admins manage org settings" on public.org_settings;
create policy "admins manage org settings"
  on public.org_settings for all
  using (public.is_admin())
  with check (public.is_admin());

-- ---------- scrims + attendance ----------
create table if not exists public.scrims (
  id uuid primary key default gen_random_uuid(),
  scrim_date date not null default current_date,
  opponent text,
  notes text,
  created_by uuid references public.admins (id),
  created_at timestamptz not null default now()
);

alter table public.scrims enable row level security;

drop policy if exists "admins manage scrims" on public.scrims;
create policy "admins manage scrims"
  on public.scrims for all
  using (public.is_admin())
  with check (public.is_admin());

-- ad-hoc teams registered for a scrim (e.g. a "tougher lobby" squad vs a
-- second squad). Reassigned fresh per scrim, not a persistent roster.
create table if not exists public.scrim_teams (
  id uuid primary key default gen_random_uuid(),
  scrim_id uuid not null references public.scrims (id) on delete cascade,
  name text not null default 'Team',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.scrim_teams enable row level security;

drop policy if exists "admins manage scrim teams" on public.scrim_teams;
create policy "admins manage scrim teams"
  on public.scrim_teams for all
  using (public.is_admin())
  with check (public.is_admin());

create table if not exists public.scrim_attendance (
  id uuid primary key default gen_random_uuid(),
  scrim_id uuid not null references public.scrims (id) on delete cascade,
  member_id uuid not null references public.members (id) on delete cascade,
  status text not null default 'present' check (status in ('present', 'absent', 'late', 'excused')),
  team_id uuid references public.scrim_teams (id) on delete set null,
  slot text check (slot in ('main', 'sub')),
  note text,
  unique (scrim_id, member_id)
);

-- Safe to re-run on an existing database created from an earlier version.
alter table public.scrim_attendance add column if not exists team_id uuid references public.scrim_teams (id) on delete set null;
alter table public.scrim_attendance add column if not exists slot text;
alter table public.scrim_attendance drop constraint if exists scrim_attendance_slot_check;
alter table public.scrim_attendance add constraint scrim_attendance_slot_check check (slot in ('main', 'sub'));

alter table public.scrim_attendance enable row level security;

drop policy if exists "admins manage attendance" on public.scrim_attendance;
create policy "admins manage attendance"
  on public.scrim_attendance for all
  using (public.is_admin())
  with check (public.is_admin());

-- matches played (present + late) and attendance % per member, mirroring
-- the Attendance Tracker sheet's COUNTIF/COUNTA formulas.
create or replace view public.member_attendance_stats
with (security_invoker = on) as
select
  member_id,
  count(*) filter (where status in ('present', 'late')) as matches_played,
  count(*) as matches_recorded,
  case
    when count(*) = 0 then 0
    else round(count(*) filter (where status in ('present', 'late'))::numeric / count(*), 3)
  end as attendance_pct
from public.scrim_attendance
group by member_id;

-- ---------- match results (one row per lobby played within a scrim) ----------
create table if not exists public.match_results (
  id uuid primary key default gen_random_uuid(),
  scrim_id uuid not null references public.scrims (id) on delete cascade,
  lobby_number integer not null default 1 check (lobby_number >= 1),
  position integer not null check (position >= 1),
  notes text,
  created_by uuid references public.admins (id),
  created_at timestamptz not null default now(),
  unique (scrim_id, lobby_number)
);

alter table public.match_results enable row level security;

drop policy if exists "admins manage match results" on public.match_results;
create policy "admins manage match results"
  on public.match_results for all
  using (public.is_admin())
  with check (public.is_admin());

-- per-player kills for a given lobby (kill base). Cumulative team kills
-- is just the sum of these rows for a match_result.
create table if not exists public.match_result_kills (
  id uuid primary key default gen_random_uuid(),
  match_result_id uuid not null references public.match_results (id) on delete cascade,
  member_id uuid not null references public.members (id) on delete cascade,
  kills integer not null default 0 check (kills >= 0),
  unique (match_result_id, member_id)
);

alter table public.match_result_kills enable row level security;

drop policy if exists "admins manage match result kills" on public.match_result_kills;
create policy "admins manage match result kills"
  on public.match_result_kills for all
  using (public.is_admin())
  with check (public.is_admin());

-- ---------- news ----------
create table if not exists public.news_posts (
  id uuid primary key default gen_random_uuid(),
  tag text not null default 'Announcement',
  title text not null,
  body text not null,
  published boolean not null default false,
  post_date date not null default current_date,
  created_by uuid references public.admins (id),
  created_at timestamptz not null default now()
);

alter table public.news_posts enable row level security;

drop policy if exists "admins manage news" on public.news_posts;
create policy "admins manage news"
  on public.news_posts for all
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "anyone can read published news" on public.news_posts;
create policy "anyone can read published news"
  on public.news_posts for select
  using (published = true);

-- ---------- achievements ----------
create table if not exists public.achievements (
  id uuid primary key default gen_random_uuid(),
  result text not null,
  title text not null,
  description text not null,
  published boolean not null default false,
  achieved_on date not null default current_date,
  created_by uuid references public.admins (id),
  created_at timestamptz not null default now()
);

alter table public.achievements enable row level security;

drop policy if exists "admins manage achievements" on public.achievements;
create policy "admins manage achievements"
  on public.achievements for all
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "anyone can read published achievements" on public.achievements;
create policy "anyone can read published achievements"
  on public.achievements for select
  using (published = true);

-- ---------- bootstrap your first admin ----------
-- 1. Supabase Dashboard -> Authentication -> Users -> Add user (email + password).
-- 2. Copy that user's UID, then run:
--    insert into public.admins (id, email) values ('<uid>', '<email>');
