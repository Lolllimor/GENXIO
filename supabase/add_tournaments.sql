-- Tournament results: teams (duo or squad) ranked in a tournament, with per-player kills.
-- Safe to run more than once.

create table if not exists public.tournaments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  tournament_date date not null default current_date,
  team_size integer not null default 2 check (team_size between 1 and 4),
  kind text not null default 'inners' check (kind in ('inners', 'other')),
  notes text,
  created_by uuid references public.admins (id),
  created_at timestamptz not null default now()
);

create table if not exists public.tournament_teams (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments (id) on delete cascade,
  name text not null default 'Team',
  placement integer not null default 1 check (placement >= 1),
  created_at timestamptz not null default now()
);

create table if not exists public.tournament_players (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.tournament_teams (id) on delete cascade,
  member_id uuid references public.members (id) on delete set null,
  ign text not null,
  kills integer not null default 0 check (kills >= 0),
  created_at timestamptz not null default now()
);

create index if not exists tournament_teams_tournament_idx on public.tournament_teams (tournament_id);
create index if not exists tournament_players_team_idx on public.tournament_players (team_id);

alter table public.tournaments enable row level security;
alter table public.tournament_teams enable row level security;
alter table public.tournament_players enable row level security;

drop policy if exists "admins manage tournaments" on public.tournaments;
create policy "admins manage tournaments"
  on public.tournaments for all
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "admins manage tournament teams" on public.tournament_teams;
create policy "admins manage tournament teams"
  on public.tournament_teams for all
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "admins manage tournament players" on public.tournament_players;
create policy "admins manage tournament players"
  on public.tournament_players for all
  using (public.is_admin())
  with check (public.is_admin());

alter table public.tournaments add column if not exists kind text not null default 'inners';
alter table public.tournaments drop constraint if exists tournaments_kind_check;
alter table public.tournaments add constraint tournaments_kind_check check (kind in ('inners', 'other'));

notify pgrst, 'reload schema';
