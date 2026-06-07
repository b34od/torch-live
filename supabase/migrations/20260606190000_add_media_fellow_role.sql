-- Add Media Fellow to the specialty_tag allowed values.

alter table public.user_profiles
  drop constraint if exists user_profiles_specialty_tag_check;

alter table public.user_profiles
  add constraint user_profiles_specialty_tag_check
  check (specialty_tag in (
    'Nurse', 'Wellbeing Advisor',
    'Support', 'Lead', 'SrC', 'Advisor', 'Coordinator', 'Board', 'Media Fellow'
  ));
