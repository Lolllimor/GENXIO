-- Hot-drop lists per map for the admin Poster Studio.
-- One row per map; `drops` is the ordered list shown as quick-pick chips.
-- Safe to run more than once.

create table if not exists public.poster_map_drops (
  map_name text primary key,
  drops text[] not null default '{}',
  updated_at timestamptz not null default now()
);

alter table public.poster_map_drops enable row level security;

drop policy if exists "admins manage poster map drops" on public.poster_map_drops;
create policy "admins manage poster map drops"
  on public.poster_map_drops for all
  using (public.is_admin())
  with check (public.is_admin());

notify pgrst, 'reload schema';
