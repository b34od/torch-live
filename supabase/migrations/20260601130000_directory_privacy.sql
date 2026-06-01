-- Per-field directory privacy controls for user_profiles.
-- Users can hide their email, phone, and social handle from the directory
-- while still having those values stored for internal use.

alter table public.user_profiles
  add column if not exists show_email  boolean not null default true,
  add column if not exists show_phone  boolean not null default true,
  add column if not exists show_social boolean not null default true;

-- Allow any authenticated user to update their own privacy fields.
-- The check constraint prevents updating other users' rows.
drop policy if exists user_update_own_privacy on public.user_profiles;
create policy user_update_own_privacy
  on public.user_profiles
  for update
  to authenticated
  using  (id = auth.uid())
  with check (id = auth.uid());

-- Replace get_directory_profiles to respect per-field privacy flags
-- and surface phone_number when the user has opted in.
create or replace function public.get_directory_profiles(year_param int)
returns table (
  id            uuid,
  full_name     text,
  email         text,
  role          text,
  team_key      text,
  guild_id      uuid,
  guild_name    text,
  guild_slug    text,
  room_number   text,
  social_handle text,
  phone_number  text
)
security definer
set search_path = public, private
language sql as $$
  select
    up.id,
    up.full_name,
    case when up.show_email  then up.email         else null end as email,
    up.role,
    up.team_key,
    up.guild_id,
    g.name  as guild_name,
    g.slug  as guild_slug,
    up.room_number,
    case when up.show_social then up.social_handle else null end as social_handle,
    case when up.show_phone  then up.phone_number  else null end as phone_number
  from public.user_profiles up
  left join public.guilds g on g.id = up.guild_id
  where up.program_year = year_param
    and up.is_active = true
    and up.show_in_directory = true
    and private.app_user_year() = year_param
    and private.app_user_role() in ('student', 'staff', 'admin');
$$;

revoke all on function public.get_directory_profiles(int) from public, anon;
grant execute on function public.get_directory_profiles(int) to authenticated;
