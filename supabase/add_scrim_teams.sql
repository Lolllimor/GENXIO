-- Adds ad-hoc scrim teams (main/sub slots) to an existing database.
-- Safe to run once; every statement is idempotent.

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

alter table public.scrim_attendance add column if not exists team_id uuid references public.scrim_teams (id) on delete set null;
alter table public.scrim_attendance add column if not exists slot text;
alter table public.scrim_attendance drop constraint if exists scrim_attendance_slot_check;
alter table public.scrim_attendance add constraint scrim_attendance_slot_check check (slot in ('main', 'sub'));
