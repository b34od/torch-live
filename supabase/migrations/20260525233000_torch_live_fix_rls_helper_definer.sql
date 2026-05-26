-- Restore SECURITY DEFINER for RLS helper functions.
-- SECURITY INVOKER causes recursive evaluation against user_profiles policies,
-- which can surface as "stack depth limit exceeded" on student/staff queries.

create or replace function public.app_user_role()
returns text
language sql
stable
security definer
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
security definer
set search_path = public
as $$
  select program_year
  from public.user_profiles
  where id = auth.uid()
    and is_active = true
  limit 1;
$$;

revoke execute on function public.app_user_role() from public;
revoke execute on function public.app_user_year() from public;
revoke execute on function public.app_user_role() from anon;
revoke execute on function public.app_user_year() from anon;
grant execute on function public.app_user_role() to authenticated;
grant execute on function public.app_user_year() to authenticated;
