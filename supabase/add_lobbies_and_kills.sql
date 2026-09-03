-- Upgrades match_results to "one result per lobby within a scrim" (a
-- scrim can have several lobbies) with per-player kill tracking per
-- lobby. Handles upgrading from any earlier version of this table.
-- Safe to run once.

-- Make sure scrim_id exists (in case you're upgrading from the very
-- first version of this table, which only had match_date/mode).
alter table public.match_results add column if not exists scrim_id uuid references public.scrims (id) on delete cascade;

-- Safety net: results with no scrim link can't be kept in this model.
-- There should be none logged yet at this point.
delete from public.match_results where scrim_id is null;

alter table public.match_results alter column scrim_id set not null;
alter table public.match_results drop constraint if exists match_results_scrim_id_key;

alter table public.match_results add column if not exists lobby_number integer not null default 1;
alter table public.match_results drop constraint if exists match_results_lobby_number_check;
alter table public.match_results add constraint match_results_lobby_number_check check (lobby_number >= 1);
alter table public.match_results drop constraint if exists match_results_scrim_lobby_key;
alter table public.match_results add constraint match_results_scrim_lobby_key unique (scrim_id, lobby_number);

alter table public.match_results drop column if exists match_date;
alter table public.match_results drop column if exists mode;

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
