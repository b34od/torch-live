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
-- Content below is sourced from Bryan's "MAIN SCHEDULE TORCH 2026 -
-- FRIDAY 2026.pdf" (2026-07-01). Note: the PDF's own header row is
-- mislabeled "7/18/26" (a Saturday) even though the file is named
-- FRIDAY and every item on it -- staff arrival, counselor induction,
-- "go to sleep" -- is pre-arrival staff-only content for 7/17/26
-- (the actual Friday). All rows are visibility='staff' since no
-- students are on campus yet; getStaffScheduleByDay() only fetches
-- 'staff'-visibility rows for day_number=0, so 'both' rows would be
-- invisible here regardless.
--
-- DO NOT APPLY without explicit Bryan approval.

insert into public.schedule_items (
  program_year, day_number, start_time, duration_minutes,
  activity_name, location, visibility, rain_location,
  point_person, secondary_person, notes, av_needs, sort_order
) values
(2026, 0, '08:30', 20, 'Staff Arrival', 'Housing 2/3 Quad', 'staff', null,
  'Caroline', null, null, null, 10),

(2026, 0, '08:50', 30, 'Welcome! Overview of Expectations', 'Meeting Room 5', 'staff', null,
  'Danes', null, null, null, 20),

(2026, 0, '09:20', 30, 'Registration, Unpacking & Check-In', 'Housing 2/3 Quad', 'staff', null,
  null, null, 'Swarm them at the dorms when they go to grab their bags.', null, 30),

(2026, 0, '09:50', 60, 'Counselor Introductions - No Phones', 'Coffeehouse', 'staff', null,
  'Larry, Spencer, Anna, SrCs', null, 'Theatre not booked - use if open. At this point, put props in a pile for Nat.', null, 40),

(2026, 0, '10:50', 60, 'Unpacking Supplies from Trailer', 'Housing 2/3 Quad', 'staff', null,
  'GI, Joey', null, null, null, 50),

(2026, 0, '11:50', 30, 'Trust', 'Housing 2/3 Quad', 'staff', null,
  'GI & Larry', null, null, null, 60),

(2026, 0, '12:20', 45, 'Lunch (with Teams)', 'N-Wing Dining Hall', 'staff', null,
  null, null, null, null, 70),

(2026, 0, '13:05', 10, 'Staff Photo', 'Housing 2/3 Quad', 'staff', null,
  'BO/Nat?', null, 'Also take a photo for the LGBTQ meeting. Get polo on before photo.', null, 80),

(2026, 0, '13:15', 50, 'Board Breaking', 'Housing 2/3 Quad', 'staff', 'Coffeehouse',
  'GI & Larry', null, null, null, 90),

(2026, 0, '14:05', 30, 'Connection 2 - Identity on the Go', 'Outside', 'staff', null,
  'Danes & Anna', null, null, null, 100),

(2026, 0, '14:35', 45, 'Behind the Scenes Tour', null, 'staff', null,
  'Bo, Caroline, Chris', null, 'Show behind the stage, trailer location, cafe.', null, 110),

(2026, 0, '15:20', 90, 'Staff Level Meetings', 'Meeting Room 5 & Other Meeting Rooms', 'staff', null,
  null, null, 'If you finish early, practice counselor intros with level group in team order. Danes/Larry lead in meeting room; Spencer/Anna support in Bay Hall; Bo/Sarah cover Advisors/SrCs in the coffeehouse.', null, 120),

(2026, 0, '16:50', 10, 'Assessment Update', 'Meeting Room 5', 'staff', null,
  'Josh', null, null, null, 130),

(2026, 0, '17:00', 10, 'Role Instructions - Student Induction Ceremony Review', 'Meeting Room 5', 'staff', null,
  'Josh', null, 'Review procedure (where to stand/walk, hum Little Light of Mine). Once you sign the book, start humming. Bring back the second verse - lyrics need to go out ahead of time, not just the day before.', null, 140),

(2026, 0, '17:10', 20, 'Role Instructions - Quick WEG Math Overview', 'Meeting Room 5', 'staff', null,
  'Bo, Josh, Alex, Ash, Caroline, (Joe? Sarah?)', null, 'TBD', null, 150),

(2026, 0, '17:30', 45, 'Dinner (with Guilds)', 'N-Wing Dining Hall', 'staff', null,
  null, null, null, null, 160),

(2026, 0, '18:15', 60, 'Review of Saturday Schedule', 'Meeting Room 5', 'staff', null,
  null, null, 'Backpat swap - everyone writes their own name. Staff meeting format.', null, 170),

(2026, 0, '19:15', 30, 'Mental Health Break', 'Meeting Room 5', 'staff', null,
  'Krys', null, null, null, 180),

(2026, 0, '19:45', 45, 'Staff Speed Meet', 'Outside', 'staff', null,
  'Danes', null, 'Counselors do their roles for "Didn''t Catch Your Name," then Sneeches.', null, 190),

(2026, 0, '20:30', 20, 'Decorate Backpats', 'Meeting Room 5', 'staff', null,
  'SrCs', null, 'Distraction while Counselor Induction is set up - delegate across the team. Make ones for counselors & advisors too. Include: first name, last initial, team #, counselor/advisor role only - no room #.', null, 200),

(2026, 0, '20:50', 30, 'Counselor Induction Ceremony', 'Amphitheatre', 'staff', null,
  'Bo, Josh?', null, null, null, 210),

(2026, 0, '21:20', 60, 'Counselor Dance Practice', 'Outside', 'staff', null,
  'SrCs', null, 'Advisors: help with nametags/bags/registration prep and put up backpats.', null, 220),

(2026, 0, '22:20', 40, 'Counselor Hangout', 'Coffeehouse or Meeting Room 5', 'staff', null,
  'SrCs', null, 'Advisors put backpats on doors.', null, 230);
