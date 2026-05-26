create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null,
  role text not null check (role in ('student', 'staff', 'admin')),
  program_year int not null default 2026,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.staff_schedule_items (
  id uuid primary key default gen_random_uuid(),
  program_year int not null default 2026,
  day_number int not null check (day_number between 1 and 4),
  start_time time not null,
  duration_minutes int not null,
  activity_name text not null,
  location text,
  rain_location text,
  is_rain_active boolean not null default false,
  point_person text,
  secondary_person text,
  notes text,
  av_needs text,
  sort_order int not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  updated_by uuid references auth.users(id)
);

create table if not exists public.student_schedule_items (
  id uuid primary key default gen_random_uuid(),
  program_year int not null default 2026,
  day_number int not null check (day_number between 1 and 4),
  start_time time not null,
  duration_minutes int not null,
  activity_name text not null,
  location text,
  sort_order int not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  updated_by uuid references auth.users(id)
);

create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  program_year int not null default 2026,
  title text not null,
  body text not null,
  audience text not null check (audience in ('all', 'staff', 'students')),
  is_push boolean not null default false,
  is_pinned boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  created_by uuid references auth.users(id)
);

create table if not exists public.announcement_reads (
  id uuid primary key default gen_random_uuid(),
  announcement_id uuid not null references public.announcements(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  read_at timestamptz not null default timezone('utc', now()),
  unique (announcement_id, user_id)
);

create table if not exists public.resource_categories (
  id uuid primary key default gen_random_uuid(),
  program_year int not null default 2026,
  name text not null,
  icon text,
  sort_order int not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.resource_items (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.resource_categories(id) on delete cascade,
  title text not null,
  body text not null,
  image_url text,
  visibility text not null default 'all' check (visibility in ('all', 'staff', 'students')),
  sort_order int not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  action text not null,
  target_table text,
  target_id uuid,
  details jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_user_profiles_role_year
  on public.user_profiles(program_year, role, is_active);
create index if not exists idx_staff_schedule_year_day
  on public.staff_schedule_items(program_year, day_number, sort_order, start_time);
create index if not exists idx_student_schedule_year_day
  on public.student_schedule_items(program_year, day_number, sort_order, start_time);
create index if not exists idx_announcements_year_created
  on public.announcements(program_year, created_at desc);
create index if not exists idx_resource_categories_year_sort
  on public.resource_categories(program_year, sort_order);
create index if not exists idx_resource_items_category_sort
  on public.resource_items(category_id, sort_order);

drop trigger if exists set_user_profiles_updated_at on public.user_profiles;
create trigger set_user_profiles_updated_at
before update on public.user_profiles
for each row execute procedure public.set_updated_at();

drop trigger if exists set_staff_schedule_updated_at on public.staff_schedule_items;
create trigger set_staff_schedule_updated_at
before update on public.staff_schedule_items
for each row execute procedure public.set_updated_at();

drop trigger if exists set_student_schedule_updated_at on public.student_schedule_items;
create trigger set_student_schedule_updated_at
before update on public.student_schedule_items
for each row execute procedure public.set_updated_at();

drop trigger if exists set_resource_categories_updated_at on public.resource_categories;
create trigger set_resource_categories_updated_at
before update on public.resource_categories
for each row execute procedure public.set_updated_at();

drop trigger if exists set_resource_items_updated_at on public.resource_items;
create trigger set_resource_items_updated_at
before update on public.resource_items
for each row execute procedure public.set_updated_at();

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

grant usage on schema public to anon, authenticated;
grant execute on function public.app_user_role() to authenticated;
grant execute on function public.app_user_year() to authenticated;

grant select on table
  public.user_profiles,
  public.staff_schedule_items,
  public.student_schedule_items,
  public.announcements,
  public.announcement_reads,
  public.resource_categories,
  public.resource_items,
  public.audit_log
to authenticated;

grant insert, update, delete on table
  public.user_profiles,
  public.staff_schedule_items,
  public.student_schedule_items,
  public.announcements,
  public.announcement_reads,
  public.resource_categories,
  public.resource_items,
  public.audit_log
to authenticated;

alter table public.user_profiles enable row level security;
alter table public.staff_schedule_items enable row level security;
alter table public.student_schedule_items enable row level security;
alter table public.announcements enable row level security;
alter table public.announcement_reads enable row level security;
alter table public.resource_categories enable row level security;
alter table public.resource_items enable row level security;
alter table public.audit_log enable row level security;

drop policy if exists user_profiles_read_self_or_admin on public.user_profiles;
create policy user_profiles_read_self_or_admin
on public.user_profiles
for select
using (
  id = auth.uid() or public.app_user_role() = 'admin'
);

drop policy if exists admin_manage_user_profiles on public.user_profiles;
create policy admin_manage_user_profiles
on public.user_profiles
for all
using (public.app_user_role() = 'admin')
with check (public.app_user_role() = 'admin');

drop policy if exists read_student_schedule_by_role on public.student_schedule_items;
create policy read_student_schedule_by_role
on public.student_schedule_items
for select
using (
  program_year = public.app_user_year()
  and public.app_user_role() in ('student', 'staff', 'admin')
);

drop policy if exists admin_manage_student_schedule on public.student_schedule_items;
create policy admin_manage_student_schedule
on public.student_schedule_items
for all
using (public.app_user_role() = 'admin')
with check (public.app_user_role() = 'admin');

drop policy if exists read_staff_schedule_by_role on public.staff_schedule_items;
create policy read_staff_schedule_by_role
on public.staff_schedule_items
for select
using (
  program_year = public.app_user_year()
  and public.app_user_role() in ('staff', 'admin')
);

drop policy if exists admin_manage_staff_schedule on public.staff_schedule_items;
create policy admin_manage_staff_schedule
on public.staff_schedule_items
for all
using (public.app_user_role() = 'admin')
with check (public.app_user_role() = 'admin');

drop policy if exists read_announcements_by_audience on public.announcements;
create policy read_announcements_by_audience
on public.announcements
for select
using (
  program_year = public.app_user_year()
  and (
    public.app_user_role() = 'admin'
    or audience = 'all'
    or (audience = 'staff' and public.app_user_role() in ('staff', 'admin'))
    or (audience = 'students' and public.app_user_role() = 'student')
  )
);

drop policy if exists admin_manage_announcements on public.announcements;
create policy admin_manage_announcements
on public.announcements
for all
using (public.app_user_role() = 'admin')
with check (public.app_user_role() = 'admin');

drop policy if exists read_announcement_reads on public.announcement_reads;
create policy read_announcement_reads
on public.announcement_reads
for select
using (
  user_id = auth.uid() or public.app_user_role() = 'admin'
);

drop policy if exists user_insert_announcement_reads on public.announcement_reads;
create policy user_insert_announcement_reads
on public.announcement_reads
for insert
with check (user_id = auth.uid());

drop policy if exists read_resource_categories_by_role on public.resource_categories;
create policy read_resource_categories_by_role
on public.resource_categories
for select
using (
  program_year = public.app_user_year()
  and public.app_user_role() in ('student', 'staff', 'admin')
);

drop policy if exists admin_manage_resource_categories on public.resource_categories;
create policy admin_manage_resource_categories
on public.resource_categories
for all
using (public.app_user_role() = 'admin')
with check (public.app_user_role() = 'admin');

drop policy if exists read_resource_items_by_visibility on public.resource_items;
create policy read_resource_items_by_visibility
on public.resource_items
for select
using (
  exists (
    select 1
    from public.resource_categories rc
    where rc.id = resource_items.category_id
      and rc.program_year = public.app_user_year()
  )
  and (
    public.app_user_role() = 'admin'
    or visibility = 'all'
    or (visibility = 'staff' and public.app_user_role() in ('staff', 'admin'))
    or (visibility = 'students' and public.app_user_role() = 'student')
  )
);

drop policy if exists admin_manage_resource_items on public.resource_items;
create policy admin_manage_resource_items
on public.resource_items
for all
using (public.app_user_role() = 'admin')
with check (public.app_user_role() = 'admin');

drop policy if exists admin_read_audit_log on public.audit_log;
create policy admin_read_audit_log
on public.audit_log
for select
using (public.app_user_role() = 'admin');

drop policy if exists admin_write_audit_log on public.audit_log;
create policy admin_write_audit_log
on public.audit_log
for insert
with check (public.app_user_role() = 'admin');
