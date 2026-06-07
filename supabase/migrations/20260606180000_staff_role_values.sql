-- Expand specialty_tag to include organizational role taxonomy alongside Nurse/Wellbeing Advisor.
-- Ericca (Nurse) and Krys (Wellbeing Advisor) are preserved; no existing rows are cleared.
-- New values: Support, Lead, Advisor, Coordinator, Board.

-- Drop old check constraint (created inline in migration 20260606120000)
alter table public.user_profiles
  drop constraint if exists user_profiles_specialty_tag_check;

-- Re-add with full value set
alter table public.user_profiles
  add constraint user_profiles_specialty_tag_check
  check (specialty_tag in (
    'Nurse', 'Wellbeing Advisor',
    'Support', 'Lead', 'SrC', 'Advisor', 'Coordinator', 'Board'
  ));
