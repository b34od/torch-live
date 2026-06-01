-- Guilds: groups that students self-select and staff are pre-assigned to.
-- Also adds room_number, social_handle, and show_in_directory to user_profiles.

-- ────────────────────────────────────────────────────────────
-- guilds table
-- ────────────────────────────────────────────────────────────

create table if not exists public.guilds (
  id uuid primary key default gen_random_uuid(),
  program_year int not null default 2026,
  slug text not null,
  name text not null,
  student_description text,
  staff_description text,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique(program_year, slug)
);

drop trigger if exists set_guilds_updated_at on public.guilds;
create trigger set_guilds_updated_at
  before update on public.guilds
  for each row execute function public.set_updated_at();

create index if not exists idx_guilds_year_order
  on public.guilds(program_year, sort_order);

alter table public.guilds enable row level security;

-- All authenticated users in the same program_year can read active guilds
drop policy if exists guilds_read_active on public.guilds;
create policy guilds_read_active
  on public.guilds
  for select
  to authenticated
  using (
    is_active = true
    and program_year = private.app_user_year()
    and private.app_user_role() in ('student', 'staff', 'admin')
  );

drop policy if exists admin_manage_guilds on public.guilds;
create policy admin_manage_guilds
  on public.guilds
  for all
  to authenticated
  using (private.app_user_role() = 'admin')
  with check (private.app_user_role() = 'admin');

-- ────────────────────────────────────────────────────────────
-- user_profiles extensions
-- ────────────────────────────────────────────────────────────

alter table public.user_profiles
  add column if not exists guild_id uuid references public.guilds(id) on delete set null,
  add column if not exists room_number text,
  add column if not exists social_handle text,
  add column if not exists show_in_directory boolean not null default true;

create index if not exists idx_user_profiles_guild
  on public.user_profiles(program_year, guild_id, role, is_active);

-- ────────────────────────────────────────────────────────────
-- Directory RPC — returns only safe fields (no phone numbers)
-- ────────────────────────────────────────────────────────────

create or replace function public.get_directory_profiles(year_param int)
returns table (
  id uuid,
  full_name text,
  email text,
  role text,
  team_key text,
  guild_id uuid,
  guild_name text,
  guild_slug text,
  room_number text,
  social_handle text
)
security definer
set search_path = public, private
language sql as $$
  select
    up.id,
    up.full_name,
    up.email,
    up.role,
    up.team_key,
    up.guild_id,
    g.name as guild_name,
    g.slug as guild_slug,
    up.room_number,
    up.social_handle
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

-- ────────────────────────────────────────────────────────────
-- Seed 8 guilds for program_year = 2026
-- ────────────────────────────────────────────────────────────

insert into public.guilds (program_year, slug, name, student_description, staff_description, sort_order) values
(2026, 'servant-leadership', 'Servant Leadership',
 'In this guild, Leaders are elected by their peers and engage in experiential learning activities focused on teamwork and shared leadership. You''ll explore stepping back to let others lead and apply these skills within your team. Your guild also creates and presents an award to a teammate at the Closing Ceremony.',
 'You''ll support Advisors in leading activities and discussions, and help Leaders apply their learning to team dynamics and real life.',
 1),
(2026, 'performing-arts', 'Performing Arts',
 'Leaders in this guild will plan and run The Follies, taking on roles like writers, directors, and actors. You''ll host the event and perform a skit reflecting on your Torch experience.',
 'You''ll help facilitate theater games that connect to leadership, support idea generation, and assist with rehearsals.',
 2),
(2026, 'editors-journalism', 'Editors & Journalism',
 'Leaders will create the Torch Times, a yearbook-style publication distributed at the Closing Ceremony. You''ll write, edit, take photos, and design the final product.',
 'You''ll help keep the project on track, support story development, review content, and maintain morale.',
 3),
(2026, 'public-speaking', 'Public Speaking',
 'This guild focuses on building your public speaking skills through interactive activities. At the end of Torch, your guild will run the Closing Ceremony.',
 'You''ll help facilitate speaking exercises and support the guild in practicing and preparing their ceremony roles.',
 4),
(2026, 'impact', 'Impact',
 'Leaders in this guild will explore environmental social issues, support the facilitation of the Impact program, hold debriefs about the Whole Earth Game, and make a plan for post-TORCH service projects.',
 'You''ll support discussions and help Leaders prepare for these programs.',
 5),
(2026, 'reflection-connection', 'Reflection & Connection',
 'This guild centers on self-reflection and the role of connection in leadership. You''ll engage in activities like Silver Linings, Connection, and Gratitude, focusing on vulnerability, identity, and leadership style.',
 'You''ll help facilitate reflection activities and ensure Leaders are prepared to lead or participate meaningfully.',
 6),
(2026, 'stem', 'STEM Guild',
 'Leaders will engage in creative problem-solving through engineering challenges, climate science discussions, DNA isolation, and stargazing. You''ll present your work on TorchNN during WEG.',
 'You''ll guide the DNA activity, support climate change discussions, and assist with WEG presentations.',
 7),
(2026, 'social-media-video', 'Social Media & Video Production',
 'Leaders will create videos and social media content, including short-form videos, TikToks, and promotional material for future programs. You''ll also collaborate with other guilds to capture and showcase their work.',
 'You''ll support brainstorming, review content, help assign production roles, and ensure final content is submitted correctly.',
 8)
on conflict (program_year, slug) do nothing;
