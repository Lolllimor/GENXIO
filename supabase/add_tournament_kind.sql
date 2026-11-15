-- Tournament type: only 'inners' tournaments count toward the leaderboards.
-- Run this if you already ran add_tournaments.sql before this column existed. Safe to run more than once.

alter table public.tournaments add column if not exists kind text not null default 'inners';
alter table public.tournaments drop constraint if exists tournaments_kind_check;
alter table public.tournaments add constraint tournaments_kind_check check (kind in ('inners', 'other'));

notify pgrst, 'reload schema';
