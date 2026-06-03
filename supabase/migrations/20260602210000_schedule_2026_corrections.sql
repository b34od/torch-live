-- Schedule corrections to match STUDENT SCHEDULE 2026.pdf
-- ⚠️  Requires Bryan approval before applying.
-- All changes are targeted UPDATEs + 2 INSERTs — no destructive deletes.

-- ─────────────────────────────────────────────────────────────────────────────
-- DAY 1 — Saturday, July 18
-- ─────────────────────────────────────────────────────────────────────────────

-- TORCH Rules: not in student PDF
UPDATE public.schedule_items SET visibility = 'staff'
WHERE program_year = 2026 AND day_number = 1 AND activity_name = 'TORCH Rules';

-- Lunch timing: 12:30 → 12:40
UPDATE public.schedule_items SET start_time = '12:40'
WHERE program_year = 2026 AND day_number = 1 AND activity_name = 'Lunch w/ Team';

-- Team Meeting 2 timing: 13:15 → 13:25
UPDATE public.schedule_items SET start_time = '13:25'
WHERE program_year = 2026 AND day_number = 1 AND activity_name = 'Team Meeting 2';

-- Trust 1 timing: 14:00 → 14:15
UPDATE public.schedule_items SET start_time = '14:15'
WHERE program_year = 2026 AND day_number = 1 AND activity_name = 'Trust 1';

-- Orientation timing: 14:50 → 15:05
UPDATE public.schedule_items SET start_time = '15:05'
WHERE program_year = 2026 AND day_number = 1 AND activity_name = 'Orientation';

-- Group Challenge → Senior Counselor Challenge, 15:20 → 15:35
UPDATE public.schedule_items
SET activity_name = 'Senior Counselor Challenge', start_time = '15:35'
WHERE program_year = 2026 AND day_number = 1 AND activity_name = 'Group Challenge';

-- Group Challenge Debrief: not in student PDF, shift to follow Senior Counselor Challenge end
UPDATE public.schedule_items
SET visibility = 'staff', start_time = '16:55'
WHERE program_year = 2026 AND day_number = 1 AND activity_name = 'Group Challenge Debrief';

-- Connection 1 timing: 16:50 → 17:05
UPDATE public.schedule_items SET start_time = '17:05'
WHERE program_year = 2026 AND day_number = 1 AND activity_name = 'Connection 1';

-- Guild Meeting 1 timing: 17:20 → 17:35
UPDATE public.schedule_items SET start_time = '17:35'
WHERE program_year = 2026 AND day_number = 1 AND activity_name = 'Guild Meeting 1';

-- Dinner w/ Guild (Day 1) timing: 18:10 → 18:25
UPDATE public.schedule_items SET start_time = '18:25'
WHERE program_year = 2026 AND day_number = 1 AND activity_name = 'Dinner w/ Guild';

-- What Is a Leader? (→ The Power of Leadership): 19:00 → 19:20
UPDATE public.schedule_items SET start_time = '19:20'
WHERE program_year = 2026 AND day_number = 1 AND activity_name = 'What Is a Leader?';

-- Team Meeting 3 timing: 20:10 → 20:30
UPDATE public.schedule_items SET start_time = '20:30'
WHERE program_year = 2026 AND day_number = 1 AND activity_name = 'Team Meeting 3';

-- What Is a Leader? (cont.) timing: 20:55 → 21:15
UPDATE public.schedule_items SET start_time = '21:15'
WHERE program_year = 2026 AND day_number = 1 AND activity_name = 'What Is a Leader? (cont.)';

-- SrC Break (staff): shift to follow cont. block end
UPDATE public.schedule_items SET start_time = '21:45'
WHERE program_year = 2026 AND day_number = 1 AND activity_name = 'SrC Break';

-- Free Time timing: 21:40 → 21:55
UPDATE public.schedule_items SET start_time = '21:55'
WHERE program_year = 2026 AND day_number = 1 AND activity_name = 'Free Time';

-- Lights Out (Day 1) timing: 22:40 → 22:55
UPDATE public.schedule_items SET start_time = '22:55'
WHERE program_year = 2026 AND day_number = 1 AND start_time = '22:40:00' AND visibility = 'both';

-- Staff Meeting after lights out (Day 1): shift to match
UPDATE public.schedule_items SET start_time = '22:55'
WHERE program_year = 2026 AND day_number = 1 AND start_time = '22:50:00' AND visibility = 'staff';

-- ─────────────────────────────────────────────────────────────────────────────
-- DAY 2 — Sunday, July 19
-- ─────────────────────────────────────────────────────────────────────────────

-- Believe timing: 09:15 → 09:20
UPDATE public.schedule_items SET start_time = '09:20'
WHERE program_year = 2026 AND day_number = 2 AND activity_name = 'Believe';

-- Lunch & Team Meeting 4 timing: 11:50 → 11:45
UPDATE public.schedule_items SET start_time = '11:45'
WHERE program_year = 2026 AND day_number = 2 AND activity_name = 'Lunch & Team Meeting 4';

-- Color Outside the Lines timing: 12:35 → 12:30
UPDATE public.schedule_items SET start_time = '12:30'
WHERE program_year = 2026 AND day_number = 2 AND activity_name = 'Color Outside the Lines';

-- International Leadership: staff → both, 14:20 → 14:30
UPDATE public.schedule_items
SET visibility = 'both', start_time = '14:30'
WHERE program_year = 2026 AND day_number = 2 AND activity_name = 'International Leadership';

-- Dinner w/ Guild (Day 2) timing: 17:30 → 17:45
UPDATE public.schedule_items SET start_time = '17:45'
WHERE program_year = 2026 AND day_number = 2 AND activity_name = 'Dinner w/ Guild';

-- Guild Meeting 2 timing: 18:15 → 18:30
UPDATE public.schedule_items SET start_time = '18:30'
WHERE program_year = 2026 AND day_number = 2 AND activity_name = 'Guild Meeting 2';

-- Debrief timing: 19:00 → 19:15
UPDATE public.schedule_items SET start_time = '19:15'
WHERE program_year = 2026 AND day_number = 2 AND activity_name = 'Debrief';

-- Believe Debrief & Goal Mining → Goal Mining, 19:15 → 19:30
UPDATE public.schedule_items
SET activity_name = 'Goal Mining', start_time = '19:30'
WHERE program_year = 2026 AND day_number = 2 AND activity_name = 'Believe Debrief & Goal Mining';

-- Impact timing: 20:00 → 20:15
UPDATE public.schedule_items SET start_time = '20:15'
WHERE program_year = 2026 AND day_number = 2 AND activity_name = 'Impact';

-- Movie Night timing: 21:05 → 21:20
UPDATE public.schedule_items SET start_time = '21:20'
WHERE program_year = 2026 AND day_number = 2 AND activity_name = 'Movie Night';

-- ─────────────────────────────────────────────────────────────────────────────
-- DAY 3 — Monday, July 20
-- ─────────────────────────────────────────────────────────────────────────────

-- Guild Meeting 3 timing: 11:35 → 11:45
UPDATE public.schedule_items SET start_time = '11:45'
WHERE program_year = 2026 AND day_number = 3 AND activity_name = 'Guild Meeting 3';

-- Lunch & Team Meeting 5 timing: 12:10 → 12:20
UPDATE public.schedule_items SET start_time = '12:20'
WHERE program_year = 2026 AND day_number = 3 AND activity_name = 'Lunch & Team Meeting 5';

-- A Mile in Their Shoes timing: 13:40 → 13:55
UPDATE public.schedule_items SET start_time = '13:55'
WHERE program_year = 2026 AND day_number = 3 AND activity_name = 'A Mile in Their Shoes';

-- Whole Earth Game timing: 14:00 → 14:15
UPDATE public.schedule_items SET start_time = '14:15'
WHERE program_year = 2026 AND day_number = 3 AND activity_name = 'Whole Earth Game';

-- Chips, Debrief, Circle of Life: not in student PDF, shift to follow WEG end
UPDATE public.schedule_items
SET start_time = '17:15', visibility = 'staff'
WHERE program_year = 2026 AND day_number = 3 AND activity_name = 'Chips, Debrief, Circle of Life';

-- Follies Rehearsal timing: 17:30 → 17:50
UPDATE public.schedule_items SET start_time = '17:50'
WHERE program_year = 2026 AND day_number = 3 AND activity_name = 'Follies Rehearsal';

-- Dinner (Teams): staff only → student visible, rename, 18:15 → 18:35
UPDATE public.schedule_items
SET activity_name = 'Dinner w/ Team', start_time = '18:35', visibility = 'both'
WHERE program_year = 2026 AND day_number = 3 AND activity_name = 'Dinner (Teams)';

-- The TORCH Follies timing: 19:00 → 19:25
UPDATE public.schedule_items SET start_time = '19:25'
WHERE program_year = 2026 AND day_number = 3 AND activity_name = 'The TORCH Follies';

-- Fireside Chat timing: 20:00 → 20:25
UPDATE public.schedule_items SET start_time = '20:25'
WHERE program_year = 2026 AND day_number = 3 AND activity_name = 'Fireside Chat';

-- INSERT Pass the TORCH (PDF: 8:55pm, outside, after Fireside Chat)
INSERT INTO public.schedule_items
  (program_year, day_number, start_time, duration_minutes, activity_name, location, visibility, sort_order)
VALUES
  (2026, 3, '20:55', 50, 'Pass the TORCH', 'J/K Wing Amphitheatre', 'both', 215);

-- Dance → Free Time (student label), staff → both, 21:20 → 21:45
UPDATE public.schedule_items
SET activity_name = 'Free Time', start_time = '21:45', visibility = 'both'
WHERE program_year = 2026 AND day_number = 3 AND activity_name = 'Dance';

-- Lights Out (Day 3) timing: 22:20 → 22:45
UPDATE public.schedule_items SET start_time = '22:45'
WHERE program_year = 2026 AND day_number = 3 AND start_time = '22:20:00' AND visibility = 'both';

-- ─────────────────────────────────────────────────────────────────────────────
-- DAY 4 — Tuesday, July 21
-- ─────────────────────────────────────────────────────────────────────────────

-- Team Meeting 6 timing: 09:20 → 09:25
UPDATE public.schedule_items SET start_time = '09:25'
WHERE program_year = 2026 AND day_number = 4 AND activity_name = 'Team Meeting 6';

-- Trust 3 timing: 10:35 → 10:40
UPDATE public.schedule_items SET start_time = '10:40'
WHERE program_year = 2026 AND day_number = 4 AND activity_name = 'Trust 3';

-- Escape to Disorientation: rename staff-only "Disorientation" at 11:45 → student visible
UPDATE public.schedule_items
SET activity_name = 'Escape to Disorientation', visibility = 'both'
WHERE program_year = 2026 AND day_number = 4 AND start_time = '11:45:00' AND activity_name = 'Disorientation';

-- Guild Meeting 4 timing: 12:35 → 12:45
UPDATE public.schedule_items SET start_time = '12:45'
WHERE program_year = 2026 AND day_number = 4 AND activity_name = 'Guild Meeting 4';

-- Lunch (Teams) → Lunch w/ Team, 13:15 → 13:25
UPDATE public.schedule_items
SET activity_name = 'Lunch w/ Team', start_time = '13:25'
WHERE program_year = 2026 AND day_number = 4 AND activity_name = 'Lunch (Teams)';

-- Gratitude — Connection 4: not in PDF student schedule
UPDATE public.schedule_items SET visibility = 'staff'
WHERE program_year = 2026 AND day_number = 4 AND activity_name = 'Gratitude — Connection 4';

-- Heart to Heart: not in PDF student schedule
UPDATE public.schedule_items SET visibility = 'staff'
WHERE program_year = 2026 AND day_number = 4 AND activity_name = 'Heart to Heart';

-- Team Final Debrief (→ TORCH Wrap Up): 15:05 → 14:10, expand to 95 min
-- (absorbs the Gratitude + Heart to Heart window; students see one TORCH Wrap Up block)
UPDATE public.schedule_items
SET start_time = '14:10', duration_minutes = 95
WHERE program_year = 2026 AND day_number = 4 AND activity_name = 'Team Final Debrief / Circle of Life';

-- Full Check Out timing: 15:30 → 15:45
UPDATE public.schedule_items SET start_time = '15:45'
WHERE program_year = 2026 AND day_number = 4 AND activity_name = 'Full Check Out — Parents Arrive';

-- Nonprofit Expo timing: 16:10 → 16:25
UPDATE public.schedule_items SET start_time = '16:25'
WHERE program_year = 2026 AND day_number = 4 AND activity_name = 'Nonprofit & Community Partner Expo';

-- Closing Ceremony timing: 17:10 → 17:25
UPDATE public.schedule_items SET start_time = '17:25'
WHERE program_year = 2026 AND day_number = 4 AND activity_name = 'Closing Ceremony';

-- Certificate Handout timing: 18:10 → 18:25
UPDATE public.schedule_items SET start_time = '18:25'
WHERE program_year = 2026 AND day_number = 4 AND activity_name = 'Certificate Handout + Final Team Photo';
