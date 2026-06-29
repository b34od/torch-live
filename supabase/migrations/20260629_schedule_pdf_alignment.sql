-- TL-032 Phase 2: Align DB schedule with printed student handbook PDF
-- All changes confirmed by Bryan on 2026-06-28.
-- DO NOT APPLY without explicit Bryan approval.

-- ── Time fixes ──────────────────────────────────────────────────────────────

UPDATE public.schedule_items
  SET start_time = '09:35'
  WHERE program_year = 2026 AND day_number = 1
    AND activity_name = 'Welcome To Torch';

UPDATE public.schedule_items
  SET start_time = '10:20'
  WHERE program_year = 2026 AND day_number = 1
    AND activity_name = 'Team Meeting 1';

UPDATE public.schedule_items
  SET start_time = '19:00'
  WHERE program_year = 2026 AND day_number = 2
    AND activity_name = 'Debrief' AND visibility = 'both';

UPDATE public.schedule_items
  SET start_time = '19:15'
  WHERE program_year = 2026 AND day_number = 2
    AND activity_name = 'Goal Mining';

UPDATE public.schedule_items
  SET start_time = '09:30', duration_minutes = 50
  WHERE program_year = 2026 AND day_number = 3
    AND activity_name = 'Trust Exercises (2)';

-- ── Split duration: 40 → 45 min (5 min walking time baked in) ───────────────

UPDATE public.schedule_items
  SET duration_minutes = 45
  WHERE program_year = 2026 AND duration_minutes = 40
    AND activity_name IN (
      'Lunch (Teams)', 'Team Meeting 2',
      'Dinner (Guilds)', 'Guild Meeting 1', 'Guild Meeting 2',
      'Team Meeting 5', 'Dinner (Teams)', 'Follies Practice',
      'Lunch (Guilds)', 'Guild Meeting 4'
    );

-- ── Visibility fixes ────────────────────────────────────────────────────────

UPDATE public.schedule_items
  SET visibility = 'both'
  WHERE program_year = 2026 AND day_number = 4
    AND activity_name = 'Escape to Disorientation';

UPDATE public.schedule_items
  SET visibility = 'both'
  WHERE program_year = 2026 AND day_number = 4
    AND activity_name = 'Disorientation';

-- ── Name fixes (match printed handbook) ─────────────────────────────────────

UPDATE public.schedule_items
  SET activity_name = 'Breakfast w/ Friends'
  WHERE program_year = 2026
    AND activity_name = 'Breakfast w. Friends';

UPDATE public.schedule_items
  SET activity_name = 'The Whole Earth Game'
  WHERE program_year = 2026
    AND activity_name = 'Whole Earth Game';

UPDATE public.schedule_items
  SET activity_name = 'Fireside Chat'
  WHERE program_year = 2026
    AND activity_name = 'Torch Fireside Chat';

UPDATE public.schedule_items
  SET activity_name = 'Wake-Up Call & Pack Up'
  WHERE program_year = 2026 AND day_number = 4
    AND activity_name = 'Wake-Up Call';
