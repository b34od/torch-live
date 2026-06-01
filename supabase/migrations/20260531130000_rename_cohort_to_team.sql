-- Rename cohort_key → team_key on user_profiles.
-- "Cohort" is internal tooling language; TORCH uses "Team" everywhere in the program.

alter table public.user_profiles
  rename column cohort_key to team_key;

drop index if exists idx_user_profiles_cohort;

create index if not exists idx_user_profiles_team
  on public.user_profiles(program_year, team_key, role, is_active);
