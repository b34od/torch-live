-- Nat Sprint identity fields (TL-036, TL-037, TL-042, TL-043)
-- REQUIRES BRYAN APPROVAL before applying to production.

-- TL-036: pronouns — free text, nullable, no constraint (respect non-binary/custom expressions)
alter table public.user_profiles
  add column if not exists pronouns text;

-- TL-037: specialty tag — admin-only to set; constrained to known roles
alter table public.user_profiles
  add column if not exists specialty_tag text
  check (specialty_tag in ('Nurse', 'Wellbeing Advisor'));

-- TL-042: Color Outside the Lines assessment color — user self-select, optional display
alter table public.user_profiles
  add column if not exists cotl_color text
  check (cotl_color in ('blue', 'green', 'gold', 'orange'));

-- TL-043: leadership superpower word — user self-written, optional, free text
alter table public.user_profiles
  add column if not exists superpower text;

-- Recreate get_directory_profiles to expose all new identity columns.
-- pronouns, cotl_color, superpower: visible to all roles (user opt-in = user chose to share).
-- specialty_tag: visible to all roles (students need to find Nurse/Wellbeing fast).
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
