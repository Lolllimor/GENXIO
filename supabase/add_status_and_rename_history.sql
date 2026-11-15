-- Timeline: log "set inactive", "reactivated" and "renamed" events.
-- "Exited" is now only logged when an exit is actually recorded on the Exits page.
-- Safe to run more than once. Requires add_member_history.sql to have been run.

alter table public.member_history add column if not exists detail text;

alter table public.member_history drop constraint if exists member_history_event_type_check;
alter table public.member_history add constraint member_history_event_type_check
  check (event_type in (
    'added', 'assigned', 'promoted', 'demoted', 'unassigned', 'exited',
    'deactivated', 'reactivated', 'renamed'
  ));

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

  if old.ign is distinct from new.ign then
    insert into public.member_history (member_id, ign, event_type, detail, created_by)
    values (new.id, new.ign, 'renamed', old.ign || ' → ' || new.ign, auth.uid());
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

  if old.status is distinct from new.status then
    if new.status = 'INACTIVE' then
      -- A real exit logs its own "exited" event (see log_exit_history); don't double-log it.
      if not exists (
        select 1 from public.member_history
        where member_id = new.id and event_type = 'exited' and created_at > now() - interval '2 minutes'
      ) then
        insert into public.member_history (member_id, ign, event_type, from_team, created_by)
        values (new.id, new.ign, 'deactivated', coalesce(new.clan_team, old.clan_team), auth.uid());
      end if;
    elsif new.status = 'ACTIVE' then
      insert into public.member_history (member_id, ign, event_type, to_team, created_by)
      values (new.id, new.ign, 'reactivated', new.clan_team, auth.uid());
    end if;
  end if;

  return new;
end;
$$;

revoke all on function public.log_member_history() from public;

drop trigger if exists member_history_aiu on public.members;
create trigger member_history_aiu
  after insert or update on public.members
  for each row execute procedure public.log_member_history();

-- Logging an exit on the Exits page (or from the roster) records "exited".
create or replace function public.log_exit_history()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.member_history (member_id, ign, event_type, from_team, to_team, created_by)
  values (
    new.member_id,
    new.ign,
    'exited',
    (select clan_team from public.members where id = new.member_id),
    null,
    auth.uid()
  );
  return new;
end;
$$;

revoke all on function public.log_exit_history() from public;

drop trigger if exists exits_history_ai on public.exits;
create trigger exits_history_ai
  after insert on public.exits
  for each row execute procedure public.log_exit_history();

notify pgrst, 'reload schema';
