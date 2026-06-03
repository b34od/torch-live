-- Remove email and phone sharing from the directory entirely.
-- Neither field is returned by get_directory_profiles for any caller.

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
    null::text as email,
    up.role,
    up.team_key,
    up.guild_id,
    g.name  as guild_name,
    g.slug  as guild_slug,
    up.room_number,
    case when up.show_social then up.social_handle else null end as social_handle,
    null::text as phone_number
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

-- Turn off email sharing for all existing users
update public.user_profiles
set show_email = false
where show_email = true;

alter table public.user_profiles
  alter column show_email set default false;
