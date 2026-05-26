create schema if not exists private;

revoke all on schema private from public;
grant usage on schema private to authenticated;

create or replace function private.app_user_role()
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

create or replace function private.app_user_year()
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

revoke execute on function private.app_user_role() from public;
revoke execute on function private.app_user_year() from public;
revoke execute on function private.app_user_role() from anon;
revoke execute on function private.app_user_year() from anon;
grant execute on function private.app_user_role() to authenticated;
grant execute on function private.app_user_year() to authenticated;

alter policy user_profiles_read_self_or_admin on public.user_profiles
using (id = auth.uid() or private.app_user_role() = 'admin');

alter policy admin_manage_user_profiles on public.user_profiles
using (private.app_user_role() = 'admin')
with check (private.app_user_role() = 'admin');

alter policy read_student_schedule_by_role on public.student_schedule_items
using (
  program_year = private.app_user_year()
  and private.app_user_role() in ('student', 'staff', 'admin')
);

alter policy admin_manage_student_schedule on public.student_schedule_items
using (private.app_user_role() = 'admin')
with check (private.app_user_role() = 'admin');

alter policy read_staff_schedule_by_role on public.staff_schedule_items
using (
  program_year = private.app_user_year()
  and private.app_user_role() in ('staff', 'admin')
);

alter policy admin_manage_staff_schedule on public.staff_schedule_items
using (private.app_user_role() = 'admin')
with check (private.app_user_role() = 'admin');

alter policy read_announcements_by_audience on public.announcements
using (
  program_year = private.app_user_year()
  and (
    private.app_user_role() = 'admin'
    or audience = 'all'
    or (audience = 'staff' and private.app_user_role() in ('staff', 'admin'))
    or (audience = 'students' and private.app_user_role() = 'student')
  )
);

alter policy admin_manage_announcements on public.announcements
using (private.app_user_role() = 'admin')
with check (private.app_user_role() = 'admin');

alter policy read_announcement_reads on public.announcement_reads
using (user_id = auth.uid() or private.app_user_role() = 'admin');

alter policy read_resource_categories_by_role on public.resource_categories
using (
  program_year = private.app_user_year()
  and private.app_user_role() in ('student', 'staff', 'admin')
);

alter policy admin_manage_resource_categories on public.resource_categories
using (private.app_user_role() = 'admin')
with check (private.app_user_role() = 'admin');

alter policy read_resource_items_by_visibility on public.resource_items
using (
  exists (
    select 1
    from public.resource_categories rc
    where rc.id = resource_items.category_id
      and rc.program_year = private.app_user_year()
  )
  and (
    private.app_user_role() = 'admin'
    or visibility = 'all'
    or (visibility = 'staff' and private.app_user_role() in ('staff', 'admin'))
    or (visibility = 'students' and private.app_user_role() = 'student')
  )
);

alter policy admin_manage_resource_items on public.resource_items
using (private.app_user_role() = 'admin')
with check (private.app_user_role() = 'admin');

alter policy admin_read_audit_log on public.audit_log
using (private.app_user_role() = 'admin');

alter policy admin_write_audit_log on public.audit_log
with check (private.app_user_role() = 'admin');

revoke execute on function public.app_user_role() from public;
revoke execute on function public.app_user_year() from public;
revoke execute on function public.app_user_role() from anon;
revoke execute on function public.app_user_year() from anon;
revoke execute on function public.app_user_role() from authenticated;
revoke execute on function public.app_user_year() from authenticated;

drop function if exists public.app_user_role();
drop function if exists public.app_user_year();
