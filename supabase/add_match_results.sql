-- Adds match placement tracking (for the results graph) to an existing
-- database. Safe to run once; idempotent.

create table if not exists public.match_results (
  id uuid primary key default gen_random_uuid(),
  match_date date not null default current_date,
  position integer not null check (position >= 1),
  mode text check (mode in ('MP', 'BR', 'Hybrid')),
  notes text,
  created_by uuid references public.admins (id),
  created_at timestamptz not null default now()
);

alter table public.match_results enable row level security;

drop policy if exists "admins manage match results" on public.match_results;
create policy "admins manage match results"
  on public.match_results for all
  using (public.is_admin())
  with check (public.is_admin());
