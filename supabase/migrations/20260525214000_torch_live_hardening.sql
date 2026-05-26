create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

revoke execute on function public.app_user_role() from public;
revoke execute on function public.app_user_year() from public;
revoke execute on function public.app_user_role() from anon;
revoke execute on function public.app_user_year() from anon;
grant execute on function public.app_user_role() to authenticated;
grant execute on function public.app_user_year() to authenticated;

create index if not exists idx_announcement_reads_user_id on public.announcement_reads(user_id);
create index if not exists idx_announcements_created_by on public.announcements(created_by);
create index if not exists idx_audit_log_user_id on public.audit_log(user_id);
create index if not exists idx_staff_schedule_updated_by on public.staff_schedule_items(updated_by);
create index if not exists idx_student_schedule_updated_by on public.student_schedule_items(updated_by);

alter policy user_profiles_read_self_or_admin on public.user_profiles to authenticated;
alter policy admin_manage_user_profiles on public.user_profiles to authenticated;

alter policy read_student_schedule_by_role on public.student_schedule_items to authenticated;
alter policy admin_manage_student_schedule on public.student_schedule_items to authenticated;

alter policy read_staff_schedule_by_role on public.staff_schedule_items to authenticated;
alter policy admin_manage_staff_schedule on public.staff_schedule_items to authenticated;

alter policy read_announcements_by_audience on public.announcements to authenticated;
alter policy admin_manage_announcements on public.announcements to authenticated;

alter policy read_announcement_reads on public.announcement_reads to authenticated;
alter policy user_insert_announcement_reads on public.announcement_reads to authenticated;

alter policy read_resource_categories_by_role on public.resource_categories to authenticated;
alter policy admin_manage_resource_categories on public.resource_categories to authenticated;

alter policy read_resource_items_by_visibility on public.resource_items to authenticated;
alter policy admin_manage_resource_items on public.resource_items to authenticated;

alter policy admin_read_audit_log on public.audit_log to authenticated;
alter policy admin_write_audit_log on public.audit_log to authenticated;
