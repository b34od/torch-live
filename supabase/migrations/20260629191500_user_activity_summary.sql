create table if not exists public.user_activity_summary (
  user_id uuid primary key references auth.users(id) on delete cascade,
  program_year int not null,
  first_activated_at timestamptz,
  first_app_visit_at timestamptz,
  last_app_visit_at timestamptz,
  app_visit_count int not null default 0 check (app_visit_count >= 0),
  last_path text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_user_activity_summary_year
  on public.user_activity_summary(program_year);

create index if not exists idx_user_activity_summary_last_app_visit
  on public.user_activity_summary(last_app_visit_at desc);

drop trigger if exists set_user_activity_summary_updated_at on public.user_activity_summary;
create trigger set_user_activity_summary_updated_at
before update on public.user_activity_summary
for each row execute procedure public.set_updated_at();

grant select on table public.user_activity_summary to authenticated;

alter table public.user_activity_summary enable row level security;

drop policy if exists admin_read_user_activity_summary on public.user_activity_summary;
create policy admin_read_user_activity_summary
  on public.user_activity_summary
  for select
  to authenticated
  using (private.app_user_role() = 'admin');

drop policy if exists self_read_user_activity_summary on public.user_activity_summary;
create policy self_read_user_activity_summary
  on public.user_activity_summary
  for select
  to authenticated
  using (user_id = auth.uid());

create or replace function public.record_user_activity(event_type text, pathname text default null)
returns void
language plpgsql
security definer
set search_path = public, private
as $$
declare
  normalized_event text := lower(trim(coalesce(event_type, '')));
  normalized_path text := left(nullif(trim(pathname), ''), 255);
  current_user_id uuid := auth.uid();
  current_year int;
  existing_summary public.user_activity_summary%rowtype;
  should_increment boolean := false;
  event_time timestamptz := timezone('utc', now());
begin
  if current_user_id is null then
    return;
  end if;

  select up.program_year
    into current_year
  from public.user_profiles up
  where up.id = current_user_id
    and up.is_active = true
  limit 1;

  if current_year is null then
    return;
  end if;

  select *
    into existing_summary
  from public.user_activity_summary
  where user_id = current_user_id;

  if normalized_event = 'login' then
    insert into public.user_activity_summary (
      user_id,
      program_year,
      first_activated_at,
      created_at,
      updated_at
    )
    values (
      current_user_id,
      current_year,
      event_time,
      event_time,
      event_time
    )
    on conflict (user_id) do update
      set program_year = excluded.program_year,
          first_activated_at = coalesce(public.user_activity_summary.first_activated_at, excluded.first_activated_at),
          updated_at = event_time;
    return;
  end if;

  if normalized_event <> 'visit' then
    return;
  end if;

  should_increment :=
    existing_summary.user_id is null
    or existing_summary.last_app_visit_at is null
    or existing_summary.last_app_visit_at <= (event_time - interval '15 minutes');

  insert into public.user_activity_summary (
    user_id,
    program_year,
    first_activated_at,
    first_app_visit_at,
    last_app_visit_at,
    app_visit_count,
    last_path,
    created_at,
    updated_at
  )
  values (
    current_user_id,
    current_year,
    existing_summary.first_activated_at,
    event_time,
    event_time,
    1,
    normalized_path,
    event_time,
    event_time
  )
  on conflict (user_id) do update
    set program_year = excluded.program_year,
        first_activated_at = coalesce(public.user_activity_summary.first_activated_at, excluded.first_activated_at),
        first_app_visit_at = coalesce(public.user_activity_summary.first_app_visit_at, excluded.first_app_visit_at),
        last_app_visit_at = excluded.last_app_visit_at,
        app_visit_count =
          case
            when should_increment then public.user_activity_summary.app_visit_count + 1
            else public.user_activity_summary.app_visit_count
          end,
        last_path = coalesce(excluded.last_path, public.user_activity_summary.last_path),
        updated_at = event_time;
end;
$$;

revoke all on function public.record_user_activity(text, text) from public;
revoke all on function public.record_user_activity(text, text) from anon;
grant execute on function public.record_user_activity(text, text) to authenticated;

insert into public.user_activity_summary (
  user_id,
  program_year,
  first_activated_at,
  created_at,
  updated_at
)
select
  up.id,
  up.program_year,
  au.last_sign_in_at,
  coalesce(au.last_sign_in_at, timezone('utc', now())),
  timezone('utc', now())
from public.user_profiles up
join auth.users au on au.id = up.id
where au.last_sign_in_at is not null
on conflict (user_id) do update
  set program_year = excluded.program_year,
      first_activated_at = coalesce(public.user_activity_summary.first_activated_at, excluded.first_activated_at),
      updated_at = timezone('utc', now());
