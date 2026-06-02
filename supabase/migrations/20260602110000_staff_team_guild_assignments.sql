-- REVIEW REQUIRED: Do not apply this draft migration without Bryan approval.
-- Assign team_key and guild_id for all staff based on the 2026 TORCH
-- team roster and guild staff assignment charts.
-- Bryan review is still required before apply because this updates production
-- assignment data.

-- ────────────────────────────────────────────────────────────────
-- Add Health & Wellness guild (9th guild, missing from seed)
-- ────────────────────────────────────────────────────────────────

insert into public.guilds (program_year, slug, name,
  student_description, staff_description, sort_order)
values (
  2026,
  'health-wellness',
  'Health & Wellness',
  'This guild explores the connection between personal health, wellness, and leadership. You''ll engage in activities focused on physical, mental, and emotional wellbeing and how they relate to your growth as a leader.',
  'You''ll help facilitate wellness activities and support Leaders in understanding how health and leadership are connected.'
  , 9
)
on conflict (program_year, slug) do nothing;

-- ────────────────────────────────────────────────────────────────
-- Team assignments (team_key) — all full names confirmed
-- ────────────────────────────────────────────────────────────────

update public.user_profiles set team_key = '1'
  where program_year = 2026
    and full_name in ('Keshaun Ryan', 'Liv Manna', 'Elena Caballero', 'Annie Saunders');

update public.user_profiles set team_key = '2'
  where program_year = 2026
    and full_name in ('Sydney Clements', 'Lexi Hudnall', 'Sanjit Gandavarapu', 'Ben Jones');

update public.user_profiles set team_key = '3'
  where program_year = 2026
    and full_name in ('Jos Seales', 'Helena LeCompte', 'Nick Mack', 'Ash Manna');

update public.user_profiles set team_key = '4'
  where program_year = 2026
    and full_name in ('Jaidan Arenas', 'Ella Calamito', 'Mariam Selim', 'Shannon Leary');

update public.user_profiles set team_key = '5'
  where program_year = 2026
    and full_name in ('Dani Tauman', 'Davis Tran', 'Joy Ogunsakin', 'Gina Raccuglia');

update public.user_profiles set team_key = '6'
  where program_year = 2026
    and full_name in ('Tess Van Name', 'Bryar Gilliland', 'Nia Suresh', 'Ally Townsend');

update public.user_profiles set team_key = '7'
  where program_year = 2026
    and full_name in ('Cheryl Oluwaseun-Apo', 'Madi Comly', 'Nick Amey', 'Anna Kuzmic');

update public.user_profiles set team_key = '8'
  where program_year = 2026
    and full_name in ('Sydney Troncone', 'Himanshu Punjabi', 'Lexy Roses', 'Alivia Goble');

update public.user_profiles set team_key = '9'
  where program_year = 2026
    and full_name in ('Henry Green', 'Amelia Finley', 'Violet Martini', 'Bella Pruscino');

update public.user_profiles set team_key = '10'
  where program_year = 2026
    and full_name in ('Reyna Barr', 'Uriel Rivera', 'Sarah Dolan', 'Lauren Njuki');

-- ────────────────────────────────────────────────────────────────
-- Guild assignments (guild_id) — confirmed names from first-name
-- cross-reference with team roster
-- ────────────────────────────────────────────────────────────────

-- Editors & Journalism
update public.user_profiles
  set guild_id = (select id from public.guilds where slug = 'editors-journalism' and program_year = 2026)
  where program_year = 2026
    and full_name in ('Alivia Goble', 'Annie Saunders', 'Elena Caballero', 'Lexy Roses', 'Joey Ayers');

-- Public Speaking
update public.user_profiles
  set guild_id = (select id from public.guilds where slug = 'public-speaking' and program_year = 2026)
  where program_year = 2026
    and full_name in ('Ben Jones', 'Joy Ogunsakin', 'Uriel Rivera', 'Nat De Rosa');

-- Performing Arts
update public.user_profiles
  set guild_id = (select id from public.guilds where slug = 'performing-arts' and program_year = 2026)
  where program_year = 2026
    and full_name in ('Liv Manna', 'Ella Calamito', 'Jack Morgan', 'Gabe Burns');

-- Impact
update public.user_profiles
  set guild_id = (select id from public.guilds where slug = 'impact' and program_year = 2026)
  where program_year = 2026
    and full_name in ('Ash Manna', 'Himanshu Punjabi', 'Madi Comly');

-- Impact — Bryan O'Donnell (BO) is admin role
update public.user_profiles
  set guild_id = (select id from public.guilds where slug = 'impact' and program_year = 2026)
  where program_year = 2026
    and email = 'bryanod11@gmail.com';

-- Servant Leadership
update public.user_profiles
  set guild_id = (select id from public.guilds where slug = 'servant-leadership' and program_year = 2026)
  where program_year = 2026
    and full_name in ('Davis Tran', 'Helena LeCompte', 'Nia Suresh', 'Alex Brunt', 'Meg Gallagher');

-- STEM
update public.user_profiles
  set guild_id = (select id from public.guilds where slug = 'stem' and program_year = 2026)
  where program_year = 2026
    and full_name in ('Mariam Selim', 'Violet Martini', 'Dom Gargiulo', 'Jamie Palmer');

-- Social Media & Video Production
update public.user_profiles
  set guild_id = (select id from public.guilds where slug = 'social-media-video' and program_year = 2026)
  where program_year = 2026
    and full_name in ('Shannon Leary', 'Bryar Gilliland', 'Nick Mack', 'Kaitlyn Potucek', 'Spencer Wattenberg');

-- Reflection & Connection
update public.user_profiles
  set guild_id = (select id from public.guilds where slug = 'reflection-connection' and program_year = 2026)
  where program_year = 2026
    and full_name in ('Anna Kuzmic', 'Gina Raccuglia', 'Sanjit Gandavarapu', 'Nick Amey', 'Sarah Dolan', 'Krys Fitzgerald');

-- Health & Wellness
update public.user_profiles
  set guild_id = (select id from public.guilds where slug = 'health-wellness' and program_year = 2026)
  where program_year = 2026
    and full_name in ('Ally Townsend', 'Bella Pruscino', 'Lexi Hudnall', 'Alex Jones', 'Amelia Finley');
