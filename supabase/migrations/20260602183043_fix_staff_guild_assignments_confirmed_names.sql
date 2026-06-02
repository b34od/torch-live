-- Correct follow-up for 2026 staff guild assignments after the original
-- staff_team_guild_assignments migration was applied with partial name matches.

update public.user_profiles
set guild_id = (select id from public.guilds where slug = 'editors-journalism' and program_year = 2026)
where program_year = 2026
  and full_name in ('Joey Ayers');

update public.user_profiles
set guild_id = (select id from public.guilds where slug = 'public-speaking' and program_year = 2026)
where program_year = 2026
  and full_name in ('Natalie (Nat) De Rosa');

update public.user_profiles
set guild_id = (select id from public.guilds where slug = 'performing-arts' and program_year = 2026)
where program_year = 2026
  and full_name in ('Jack Morgan', 'Gabe Burns');

update public.user_profiles
set guild_id = (select id from public.guilds where slug = 'servant-leadership' and program_year = 2026)
where program_year = 2026
  and full_name in ('Alex Brunt', 'Meg Gallagher');

update public.user_profiles
set guild_id = (select id from public.guilds where slug = 'stem' and program_year = 2026)
where program_year = 2026
  and full_name in ('Dom Gargiulo', 'Jamie Palmer');

update public.user_profiles
set guild_id = (select id from public.guilds where slug = 'social-media-video' and program_year = 2026)
where program_year = 2026
  and full_name in ('Kaitlyn Potucek', 'Spencer Wattenberg');

update public.user_profiles
set guild_id = (select id from public.guilds where slug = 'reflection-connection' and program_year = 2026)
where program_year = 2026
  and full_name in ('Krys Fitzgerald');

update public.user_profiles
set guild_id = (select id from public.guilds where slug = 'health-wellness' and program_year = 2026)
where program_year = 2026
  and full_name in ('Alex Jones', 'Amelia Finley');
