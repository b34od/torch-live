create or replace function public.app_user_role()
returns text
language sql
stable
security invoker
set search_path = public
as $$
  select role
  from public.user_profiles
  where id = auth.uid()
    and is_active = true
  limit 1;
$$;

create or replace function public.app_user_year()
returns int
language sql
stable
security invoker
set search_path = public
as $$
  select program_year
  from public.user_profiles
  where id = auth.uid()
    and is_active = true
  limit 1;
$$;
