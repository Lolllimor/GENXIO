-- Confirmed via information_schema introspection: the Assistant's schema
-- added NOT NULL to three columns that should be optional -- plenty of
-- Team Roster rows genuinely have no recorded value for mode, comp
-- experience, or scrim availability. Make them nullable to match the
-- intended design.
alter table public.members alter column mode drop not null;
alter table public.members alter column comps_experience drop not null;
alter table public.members alter column scrim_availability drop not null;
