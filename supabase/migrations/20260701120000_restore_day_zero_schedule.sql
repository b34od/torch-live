-- Restore Friday (day_number = 0) staff schedule.
--
-- Root cause: 20260628120000_schedule_2026_final.sql ran
-- `delete from schedule_items where program_year = 2026` before
-- inserting only day_number 1-4 (its source CSV/PDF only covered the
-- 4 program days). That delete had no day_number scope, so it also
-- wiped the day-0 Friday staff-training rows as collateral damage.
-- No migration since has restored them -- schedule_items has had
-- zero day_number=0 rows in production ever since, which is why
-- /staff/schedule silently empties out ("No schedule items yet for
-- Friday.") whenever a staff member lands on the default day outside
-- the July 18-21 program window. Tracked as backlog TL-065.
--
-- Content below is the last known day-0 data (from
-- 20260601140000_schedule_2026_data.sql, June 1 draft) reinserted
-- as-is. It has not been reconfirmed against a current source for
-- the actual July 17 staff training day -- treat as a placeholder to
-- review/edit via /admin/schedule, not confirmed-final content.
--
-- DO NOT APPLY without explicit Bryan approval.

insert into public.schedule_items (
  program_year, day_number, start_time, duration_minutes,
  activity_name, location, visibility, rain_location,
  point_person, secondary_person, notes, av_needs, sort_order
) values
(2026, 0, '08:00', 60,  'Staff Meeting',             'Staff Lounge',          'staff', null, 'Danes',        null,           null, null, 10),
(2026, 0, '09:00', 120, 'Registration / Room Setup', 'Housing 2',             'staff', null, 'Sarah & Josh', 'Meg & Mitch', null, null, 20),
(2026, 0, '11:00', 60,  'Lunch (Staff)',              'N-Wing Dining Hall',    'staff', null, null,           null,          null, null, 30),
(2026, 0, '13:00', 180, 'Staff Training & Prep',      'Campus Center Theatre', 'staff', null, 'Danes',        'Brunt',       null, null, 40),
(2026, 0, '16:00', 60,  'Dinner (Staff)',             'N-Wing Dining Hall',    'staff', null, null,           null,          null, null, 50),
(2026, 0, '17:00', 60,  'Final Staff Briefing',       'Staff Lounge',          'staff', null, 'Danes',        null,          null, null, 60);
