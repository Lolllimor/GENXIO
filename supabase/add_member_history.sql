-- Roster timeline: logs when someone is added, assigned, promoted, demoted, or exits.
-- Safe to run once; every statement is idempotent.

alter table public.members add column if not exists clan_team text;
alter table public.members drop constraint if exists members_clan_team_check;
alter table public.members add constraint members_clan_team_check
  check (clan_team in ('e-sport', 'elites', 'underdog'));

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
