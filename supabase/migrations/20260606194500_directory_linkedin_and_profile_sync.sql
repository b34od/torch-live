-- Directory LinkedIn opt-in and profile round-trip support
-- REQUIRES BRYAN APPROVAL before applying to production.

alter table public.user_profiles
  add column if not exists linkedin_url text;

-- Keep social handles staff/admin-only, but allow opted-in LinkedIn links to
-- appear to all authenticated directory viewers by linking the person's name.
drop function if exists public.get_directory_profiles(int);

create function public.get_directory_profiles(year_param int)
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
  linkedin_url  text,
  phone_number  text,
  pronouns      text,
  specialty_tag text,
  cotl_color    text,
  superpower    text
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
    case
      when private.app_user_role() in ('staff', 'admin') and up.show_social
      then up.social_handle
      else null
    end as social_handle,
    case
      when up.show_social then up.linkedin_url
      else null
    end as linkedin_url,
    null::text as phone_number,
    up.pronouns,
    up.specialty_tag,
    up.cotl_color,
    up.superpower
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
