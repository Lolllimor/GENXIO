-- Persistent clan squad on each roster member.
-- E-Sport (best) → Elites (second) → Underdog (last).
-- Safe to run once; every statement is idempotent.

alter table public.members add column if not exists clan_team text;
alter table public.members drop constraint if exists members_clan_team_check;
alter table public.members add constraint members_clan_team_check
  check (clan_team in ('e-sport', 'elites', 'underdog'));
