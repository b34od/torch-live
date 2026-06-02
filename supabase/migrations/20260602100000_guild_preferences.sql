-- REVIEW REQUIRED: Apply only after Bryan approval.
-- Guild ranked preferences (students rank top 3 during Team Meeting 2)
-- and program_settings key/value store for runtime flags.

-- ────────────────────────────────────────────────────────────────
-- guild_preferences
-- ────────────────────────────────────────────────────────────────

create table if not exists public.guild_preferences (
  id           uuid primary key default gen_random_uuid(),
  student_id   uuid not null references auth.users(id) on delete cascade,
  program_year int  not null default 2026,
  rank_1       uuid references public.guilds(id) on delete set null,
  rank_2       uuid references public.guilds(id) on delete set null,
  rank_3       uuid references public.guilds(id) on delete set null,
  submitted_at timestamptz not null default timezone('utc', now()),
  updated_at   timestamptz not null default timezone('utc', now()),
  unique(student_id, program_year)
);

create index if not exists idx_guild_preferences_year
  on public.guild_preferences(program_year, student_id);

drop trigger if exists set_guild_preferences_updated_at on public.guild_preferences;
create trigger set_guild_preferences_updated_at
  before update on public.guild_preferences
  for each row execute function public.set_updated_at();

alter table public.guild_preferences enable row level security;

-- Students: read and write own row only
drop policy if exists student_own_guild_preference on public.guild_preferences;
create policy student_own_guild_preference
  on public.guild_preferences
  for all
  to authenticated
  using (
    student_id = auth.uid()
    and private.app_user_role() = 'student'
  )
  with check (
    student_id = auth.uid()
    and private.app_user_role() = 'student'
  );

-- Staff: read all preferences for their program year (to run the assignment board)
drop policy if exists staff_read_guild_preferences on public.guild_preferences;
create policy staff_read_guild_preferences
  on public.guild_preferences
  for select
  to authenticated
  using (
    program_year = private.app_user_year()
    and private.app_user_role() in ('staff', 'admin')
  );

-- Admin: full access
drop policy if exists admin_manage_guild_preferences on public.guild_preferences;
create policy admin_manage_guild_preferences
  on public.guild_preferences
  for all
  to authenticated
  using  (private.app_user_role() = 'admin')
  with check (private.app_user_role() = 'admin');

grant select, insert, update, delete on public.guild_preferences to authenticated, service_role;

-- ────────────────────────────────────────────────────────────────
-- program_settings
-- ────────────────────────────────────────────────────────────────

create table if not exists public.program_settings (
  program_year int  not null,
  key          text not null,
  value        text not null,
  updated_at   timestamptz not null default timezone('utc', now()),
  updated_by   uuid references auth.users(id),
  primary key  (program_year, key)
);

alter table public.program_settings enable row level security;

-- All authenticated users in their program year can read settings
drop policy if exists read_program_settings on public.program_settings;
create policy read_program_settings
  on public.program_settings
  for select
  to authenticated
  using (program_year = private.app_user_year());

-- Admin only for writes
drop policy if exists admin_manage_program_settings on public.program_settings;
create policy admin_manage_program_settings
  on public.program_settings
  for all
  to authenticated
  using  (private.app_user_role() = 'admin')
  with check (private.app_user_role() = 'admin');

grant select on public.program_settings to authenticated, service_role;
grant insert, update, delete on public.program_settings to authenticated, service_role;

-- Seed defaults
insert into public.program_settings (program_year, key, value)
values (2026, 'guild_selection_open', 'false')
on conflict (program_year, key) do nothing;
