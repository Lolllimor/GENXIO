-- Adds match placement + per-player kill tracking to an existing
-- database. A scrim can have several lobbies, each with its own
-- placement and kill counts. Safe to run once; idempotent.
--
-- If you already ran an earlier version of this file, run
-- supabase/add_lobbies_and_kills.sql instead to upgrade in place.

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
