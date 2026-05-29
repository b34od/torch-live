alter table public.user_profiles
  add column if not exists cohort_key text,
  add column if not exists phone_number text;

create index if not exists idx_user_profiles_year_cohort
  on public.user_profiles(program_year, cohort_key, role, is_active);

create table if not exists public.schedule_items (
  id uuid primary key default gen_random_uuid(),
  program_year int not null default 2026,
  day_number int not null check (day_number between 0 and 4),
  start_time time not null,
  duration_minutes int not null check (duration_minutes > 0 and duration_minutes <= 360),
  activity_name text not null,
  location text,
  visibility text not null default 'both' check (visibility in ('students', 'staff', 'both')),
  rain_location text,
  point_person text,
  secondary_person text,
  notes text,
  av_needs text,
  sort_order int not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  updated_by uuid references auth.users(id)
);

create index if not exists idx_schedule_items_year_day_visibility
  on public.schedule_items(program_year, day_number, visibility, sort_order, start_time);

create index if not exists idx_schedule_items_updated_by
  on public.schedule_items(updated_by);

create index if not exists idx_schedule_items_dedupe_key
  on public.schedule_items(
    program_year,
    day_number,
    start_time,
    duration_minutes,
    activity_name,
    coalesce(location, ''),
    visibility
  );

drop trigger if exists set_schedule_items_updated_at on public.schedule_items;
create trigger set_schedule_items_updated_at
before update on public.schedule_items
for each row execute procedure public.set_updated_at();

insert into public.schedule_items (
  program_year,
  day_number,
  start_time,
  duration_minutes,
  activity_name,
  location,
  visibility,
  sort_order,
  updated_by,
  created_at,
  updated_at
)
select
  s.program_year,
  s.day_number,
  s.start_time,
  s.duration_minutes,
  s.activity_name,
  s.location,
  'both'::text,
  s.sort_order,
  s.updated_by,
  s.created_at,
  s.updated_at
from public.student_schedule_items s
where not exists (
  select 1
  from public.schedule_items si
  where si.program_year = s.program_year
    and si.day_number = s.day_number
    and si.start_time = s.start_time
    and si.duration_minutes = s.duration_minutes
    and si.activity_name = s.activity_name
    and coalesce(si.location, '') = coalesce(s.location, '')
    and si.visibility = 'both'
);

update public.schedule_items si
set
  rain_location = coalesce(si.rain_location, ss.rain_location),
  point_person = coalesce(si.point_person, ss.point_person),
  secondary_person = coalesce(si.secondary_person, ss.secondary_person),
  notes = coalesce(si.notes, ss.notes),
  av_needs = coalesce(si.av_needs, ss.av_needs),
  updated_by = coalesce(si.updated_by, ss.updated_by)
from public.staff_schedule_items ss
where ss.day_number between 1 and 4
  and si.program_year = ss.program_year
  and si.day_number = ss.day_number
  and si.start_time = ss.start_time
  and si.duration_minutes = ss.duration_minutes
  and si.activity_name = ss.activity_name
  and coalesce(si.location, '') = coalesce(ss.location, '')
  and si.visibility = 'both';

insert into public.schedule_items (
  program_year,
  day_number,
  start_time,
  duration_minutes,
  activity_name,
  location,
  visibility,
  rain_location,
  point_person,
  secondary_person,
  notes,
  av_needs,
  sort_order,
  updated_by,
  created_at,
  updated_at
)
select
  ss.program_year,
  ss.day_number,
  ss.start_time,
  ss.duration_minutes,
  ss.activity_name,
  ss.location,
  'staff'::text,
  ss.rain_location,
  ss.point_person,
  ss.secondary_person,
  ss.notes,
  ss.av_needs,
  ss.sort_order,
  ss.updated_by,
  ss.created_at,
  ss.updated_at
from public.staff_schedule_items ss
where ss.day_number = 0
  and not exists (
    select 1
    from public.schedule_items si
    where si.program_year = ss.program_year
      and si.day_number = ss.day_number
      and si.start_time = ss.start_time
      and si.duration_minutes = ss.duration_minutes
      and si.activity_name = ss.activity_name
      and coalesce(si.location, '') = coalesce(ss.location, '')
      and si.visibility = 'staff'
  );

insert into public.schedule_items (
  program_year,
  day_number,
  start_time,
  duration_minutes,
  activity_name,
  location,
  visibility,
  rain_location,
  point_person,
  secondary_person,
  notes,
  av_needs,
  sort_order,
  updated_by,
  created_at,
  updated_at
)
select
  ss.program_year,
  ss.day_number,
  ss.start_time,
  ss.duration_minutes,
  ss.activity_name,
  ss.location,
  'staff'::text,
  ss.rain_location,
  ss.point_person,
  ss.secondary_person,
  ss.notes,
  ss.av_needs,
  ss.sort_order,
  ss.updated_by,
  ss.created_at,
  ss.updated_at
from public.staff_schedule_items ss
where ss.day_number between 1 and 4
  and not exists (
    select 1
    from public.schedule_items si
    where si.program_year = ss.program_year
      and si.day_number = ss.day_number
      and si.start_time = ss.start_time
      and si.duration_minutes = ss.duration_minutes
      and si.activity_name = ss.activity_name
      and coalesce(si.location, '') = coalesce(ss.location, '')
      and si.visibility = 'both'
  )
  and not exists (
    select 1
    from public.schedule_items si
    where si.program_year = ss.program_year
      and si.day_number = ss.day_number
      and si.start_time = ss.start_time
      and si.duration_minutes = ss.duration_minutes
      and si.activity_name = ss.activity_name
      and coalesce(si.location, '') = coalesce(ss.location, '')
      and si.visibility = 'staff'
  );

create table if not exists public.schedule_dependencies (
  id uuid primary key default gen_random_uuid(),
  source_item_id uuid not null references public.schedule_items(id) on delete cascade,
  dependent_item_id uuid not null references public.schedule_items(id) on delete cascade,
  relation_type text not null default 'shift_with' check (relation_type in ('shift_with')),
  offset_minutes int not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  updated_by uuid references auth.users(id),
  constraint schedule_dependencies_not_self check (source_item_id <> dependent_item_id),
  constraint schedule_dependencies_unique unique (source_item_id, dependent_item_id, relation_type)
);

create index if not exists idx_schedule_dependencies_source
  on public.schedule_dependencies(source_item_id);

create index if not exists idx_schedule_dependencies_dependent
  on public.schedule_dependencies(dependent_item_id);

drop trigger if exists set_schedule_dependencies_updated_at on public.schedule_dependencies;
create trigger set_schedule_dependencies_updated_at
before update on public.schedule_dependencies
for each row execute procedure public.set_updated_at();

alter table public.schedule_items enable row level security;
alter table public.schedule_dependencies enable row level security;

grant select on table public.schedule_items, public.schedule_dependencies to authenticated;
grant insert, update, delete on table public.schedule_items, public.schedule_dependencies to authenticated;

drop policy if exists read_schedule_items_by_role on public.schedule_items;
create policy read_schedule_items_by_role
on public.schedule_items
for select
using (
  program_year = private.app_user_year()
  and (
    private.app_user_role() = 'admin'
    or (
      private.app_user_role() = 'student'
      and day_number between 1 and 4
      and visibility in ('students', 'both')
    )
    or (
      private.app_user_role() = 'staff'
      and (
        (day_number = 0 and visibility = 'staff')
        or (day_number between 1 and 4 and visibility in ('staff', 'both'))
      )
    )
  )
);

drop policy if exists admin_manage_schedule_items on public.schedule_items;
create policy admin_manage_schedule_items
on public.schedule_items
for all
using (private.app_user_role() = 'admin')
with check (private.app_user_role() = 'admin');

drop policy if exists admin_manage_schedule_dependencies on public.schedule_dependencies;
create policy admin_manage_schedule_dependencies
on public.schedule_dependencies
for all
using (private.app_user_role() = 'admin')
with check (private.app_user_role() = 'admin');

alter table public.announcements
  add column if not exists message_type text not null default 'info' check (message_type in ('info', 'schedule_change', 'urgent')),
  add column if not exists recipient_scope text not null default 'all_students' check (recipient_scope in ('all_students', 'cohort', 'custom')),
  add column if not exists recipient_cohort text,
  add column if not exists custom_recipients text[] not null default '{}'::text[],
  add column if not exists send_sms boolean not null default false,
  add column if not exists sms_delivery_status text not null default 'not_requested' check (sms_delivery_status in ('not_requested', 'queued', 'sent', 'partial', 'failed'));

create table if not exists public.notification_deliveries (
  id uuid primary key default gen_random_uuid(),
  announcement_id uuid not null references public.announcements(id) on delete cascade,
  channel text not null check (channel in ('in_app', 'sms')),
  recipient text,
  status text not null check (status in ('queued', 'sent', 'failed')),
  provider_message_id text,
  provider_error text,
  created_at timestamptz not null default timezone('utc', now()),
  created_by uuid references auth.users(id)
);

create index if not exists idx_notification_deliveries_announcement
  on public.notification_deliveries(announcement_id, channel, created_at desc);

alter table public.notification_deliveries enable row level security;
grant select, insert on table public.notification_deliveries to authenticated;

drop policy if exists admin_manage_notification_deliveries on public.notification_deliveries;
create policy admin_manage_notification_deliveries
on public.notification_deliveries
for all
using (private.app_user_role() = 'admin')
with check (private.app_user_role() = 'admin');
