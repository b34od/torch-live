-- TL-032: Replace 2026 schedule_items with authoritative data
-- Source: ~/.claude/plans/users-bryanodonnell-documents-torch-mai-radiant-fern.md
-- (derived from "MAIN SCHEDULE TORCH 2026" CSV, staff spreadsheet, Student PDF)
-- day_number: 1=Sat July 18, 2=Sun July 19, 3=Mon July 20, 4=Tue July 21
--
-- Visibility: 'staff' = surprise activities, SrC breaks, staff meetings, setup items
--             'both'  = everything else (student-visible)
-- Split sessions: pairs share same start_time, 40 min each, adjacent sort_order
--
-- DESTRUCTIVE: deletes all existing 2026 schedule_items before inserting.
-- DO NOT APPLY without explicit Bryan approval.

delete from public.schedule_items where program_year = 2026;

insert into public.schedule_items (
  program_year, day_number, start_time, duration_minutes,
  activity_name, location, visibility, rain_location,
  point_person, secondary_person, notes, av_needs, sort_order
) values

-- ─── DAY 1 — SATURDAY July 18 (day_number = 1) ──────────────────────────────
(2026, 1, '07:55', 20,  'Breakfast & Program Kick Off!',
  'Spot in front of Housing 2/3', 'staff', null,
  null, null, null, null, 10),

(2026, 1, '08:15', 15,  'Registration Set-Up',
  'Spot in front of Housing 2/3', 'staff', 'Lot 6/7',
  'Sarah & Josh', 'Meg & Mitch', 'Pep talk', null, 20),

(2026, 1, '08:30', 60,  'Ice Breakers',
  'Housing 2/3 Quad', 'staff', 'Event Room A',
  'SrCs', 'Brunt', null, 'Need Mic and Speakers', 30),

(2026, 1, '08:45', 45,  'Registration & Ice Breakers',
  'Housing 2/3 Quad', 'both', 'Event Room A',
  'Sarah & Josh', 'Meg & Mitch', 'Backpats should be on doors', null, 40),

(2026, 1, '09:35', 5,   'TORCH Survey',
  'Event Room A', 'staff', null,
  'Josh', null, 'Pronoun pins and sharpies on table outside', null, 50),

(2026, 1, '09:40', 30,  'Welcome To Torch',
  'Event Room A', 'both', null,
  'Caroline & Alex Jones', null, null, 'Need Mic and Speakers', 60),

(2026, 1, '10:10', 10,  'TORCH Rules',
  'Event Room A', 'both', null,
  'Sarah & Josh', null, null, null, 70),

(2026, 1, '10:20', 10,  'Scramble',
  '10 Classrooms in C Wing', 'staff', null,
  'SrCs', null, null, null, 80),

(2026, 1, '10:30', 50,  'Team Meeting 1',
  '10 Classrooms in C Wing', 'both', null,
  'Joey', 'Spencer Anna', 'Orange bags, eggs',
  'C Wing rooms C004, C007, C008, C009, C011', 90),

(2026, 1, '11:25', 30,  'Community Guidelines',
  'Event Room A', 'both', null,
  'Danes, Anna, BO', null, null,
  'CC Theater: access to control room, 2 Aux audio, 2 HDMI video, 4 wireless mics', 100),

(2026, 1, '12:00', 30,  'Hall Meeting',
  'CC Theatre / Event Room A / LGBTQ+ room', 'both', null,
  null, null, null, null, 110),

-- SPLIT: Lunch (Teams) || Team Meeting 2 — Teams 1-5 eat first, 6-10 meet first, swap after 40 min
(2026, 1, '12:35', 40,  'Lunch (Teams)',
  'N-Wing Dining Hall', 'both', null,
  null, null, null, null, 120),

(2026, 1, '12:35', 40,  'Team Meeting 2',
  '10 Classrooms in C Wing', 'both', null,
  'Alex', 'Dom', 'CREATE GUILD ROSTER IMMEDIATELY - Danes & Caro. Cellphone bin.',
  'C Wing rooms C004, C007, C008, C009, C011', 125),

(2026, 1, '14:05', 50,  'TRUST: PART I',
  'Outside - Next to Arts and Sciences', 'both', 'Event Room A',
  'Joe', 'Larry', null, 'Need Mic and Speakers', 130),

(2026, 1, '15:00', 30,  'Orientation',
  'Campus Center Theatre', 'both', null,
  'SrCs', 'Brunt', null,
  'CC Theater: access to control room, 2 Aux audio, 2 HDMI video, 4 wireless mics', 140),

(2026, 1, '15:30', 75,  'Group Challenge (Puzzled)',
  'Outside - Behind Arts and Sciences', 'both', 'Event Room A',
  'Brunt/Caroline', null, null, 'Need Mic and Speakers', 150),

(2026, 1, '16:45', 10,  'Group Challenge (Puzzled) Debrief',
  'Event Room A', 'staff', null,
  'Brunt/Caroline', null, null, null, 155),

(2026, 1, '16:55', 30,  'Connection 1',
  'Event Room A', 'both', null,
  'Danes, Anna', 'Ash & Annie', null, null, 160),

-- SPLIT: Dinner (Guilds) || Guild Meeting 1 — half eat, half meet, swap after 40 min
(2026, 1, '17:30', 40,  'Dinner (Guilds)',
  'N-Wing Dining Hall', 'both', null,
  null, null, null, null, 170),

(2026, 1, '17:30', 40,  'Guild Meeting 1',
  '9 Classrooms in C Wing', 'both', null,
  'Brunt/Dom', null, null,
  'C Wing rooms C004, C007, C008, C009, C011', 175),

(2026, 1, '19:00', 70,  'The Power of Leadership / What Is a Leader?',
  'Campus Center Theatre', 'both', null,
  'Joe', 'Alex',
  'Support counselors leave to set up bonfire — Spencer & Rhicki',
  'CC Theater: access to control room, 2 Aux audio, 2 HDMI video, 4 wireless mics', 180),

(2026, 1, '20:10', 50,  'Team Meeting 3 (Paper Superheros)',
  'Campus Center Theatre', 'both', null,
  'Joe', 'Alex', 'Large paper & markers',
  'CC Theater: access to control room, 2 Aux audio, 2 HDMI video, 4 wireless mics', 190),

(2026, 1, '21:00', 30,  'What is a Leader? (cont.)',
  'Campus Center Theatre', 'both', null,
  'Joe', 'Alex', null,
  'CC Theater: access to control room, 2 Aux audio, 2 HDMI video, 4 wireless mics', 200),

(2026, 1, '21:30', 5,   'SrC Break',
  'Campus Center Theatre', 'staff', null,
  'SrCs', null, null, null, 210),

(2026, 1, '21:35', 60,  'Bonfire / Social',
  'Event Room A', 'both', null,
  'Spencer / Anna', null, null, null, 220),

(2026, 1, '22:35', 30,  'Lights Out',
  'Housing 2', 'both', null,
  null, null, null, null, 230),

(2026, 1, '23:00', 30,  'Staff Meeting',
  'Meeting Room 5', 'staff', null,
  'Danes', null, null, null, 240),

-- ─── DAY 2 — SUNDAY July 19 (day_number = 2) ────────────────────────────────
(2026, 2, '07:45', 40,  'Wake-Up Call',
  'Housing 2', 'both', null,
  null, null, null, null, 10),

(2026, 2, '08:00', 25,  'Optional Yoga or Optional Nature Walk',
  'Outside - Near Housing 2', 'both', null,
  'Sarah', null, null, null, 20),

(2026, 2, '08:30', 45,  'Breakfast w. Friends',
  'N-Wing Dining Hall', 'both', null,
  'Bo', 'Caroline', null, 'Need Mic and Speakers (Music)', 40),

(2026, 2, '09:20', 55,  'Believe',
  'Campus Center Theatre', 'both', null,
  'Joe', 'Larry', 'BB shirts',
  'CC Theater: access to control room, 2 Aux audio, 2 HDMI video, 4 wireless mics', 50),

(2026, 2, '10:15', 90,  'Board Breaking',
  'Outside - Behind Arts and Sciences', 'staff', 'Event Room A',
  null, null, null, null, 60),

(2026, 2, '11:45', 45,  'Catered Lunch & Team Meeting 4 (Debrief)',
  'Event Room A', 'both', null,
  'Bo', 'Caroline', null,
  'Event Room: 2 tables, 6 chairs, 3 Aux audio, 3 HDMI video, 4 wireless mics', 70),

(2026, 2, '12:30', 60,  'Color Outside the Lines',
  'Campus Center Theatre', 'both', null,
  'Alex J.', 'Anna', null, null, 80),

(2026, 2, '13:35', 45,  'Connection 2 - Identity on the GO',
  'C/D Atrium', 'both', 'Coffee House',
  'Danes, Anna', 'Ash & Annie',
  'Need advisors, not counselors — paper & writing utensils',
  'Paper, writing supplies', 90),

(2026, 2, '14:25', 10,  'International Leadership',
  'Campus Center Theatre', 'both', null,
  'Jamie', 'Josh', null, null, 100),

(2026, 2, '14:35', 10,  'Brief for Adventure Course',
  'Campus Center Theatre', 'staff', null,
  'Dom', 'Sarah/Meg', 'A/C costumes, props', null, 110),

(2026, 2, '14:45', 165, 'Adventure Course',
  'Outside - Behind Arts and Sciences', 'staff', 'Event Room A',
  'Dom', 'Sarah/Meg', null, 'Need Mic and Speakers (Music)', 120),

-- SPLIT: Dinner (Guilds) || Guild Meeting 2 — half eat, half meet, swap after 40 min
(2026, 2, '17:35', 40,  'Dinner (Guilds)',
  'N-Wing Dining Hall', 'both', null,
  'Bo', 'Caroline', null, null, 130),

(2026, 2, '17:35', 40,  'Guild Meeting 2',
  '9 Classrooms in C Wing', 'both', null,
  'Brunt/Dom', null, null, null, 135),

(2026, 2, '19:00', 15,  'Adventure Course Debrief',
  'Event Room A', 'staff', null,
  'Dom', 'Meg', null, null, 140),

(2026, 2, '19:15', 15,  'Debrief',
  'Event Room A', 'both', null,
  'Dom', 'Meg', null, 'Need Mic and Speakers (Music)', 150),

(2026, 2, '19:30', 45,  'Goal Mining',
  'Event Room A', 'both', null,
  'Alex Jones', 'Joe', null, null, 160),

(2026, 2, '20:15', 60,  'Impact',
  'Coffeehouse', 'both', null,
  'Caroline', 'Bo', 'Candles (plastic)', null, 170),

(2026, 2, '21:15', 5,   'SrC Break 2',
  'Campus Center Theatre', 'staff', null,
  'SrCs', 'Brunt', null, null, 180),

(2026, 2, '21:20', 155, 'Movie Night',
  'Campus Center Theatre', 'both', null,
  'Spencer W', 'Alex Jones', 'Movie night costumes', null, 190),

(2026, 2, '00:00', 30,  'Lights Out',
  'Housing 2', 'both', null,
  null, null, null, null, 200),

(2026, 2, '00:00', 30,  'Staff Meeting',
  'Meeting Room 5', 'staff', null,
  'Danes', null, null, null, 210),

-- ─── DAY 3 — MONDAY July 20 (day_number = 3) ────────────────────────────────
(2026, 3, '07:45', 40,  'Wake-Up Call',
  'Housing 2', 'both', null,
  null, null, 'Students should bring follies props', null, 10),

(2026, 3, '08:30', 45,  'Breakfast w. Friends',
  'N-Wing Dining Hall', 'both', null,
  'Bo', 'Caroline', null, null, 30),

(2026, 3, '09:15', 60,  'Trust Exercises (2)',
  'Outside - Behind N-Wing', 'both', 'C/D Atrium',
  'Joe', 'Larry', null, 'Need Mic and Speakers', 40),

(2026, 3, '10:20', 10,  'Presence - Guided Meditation',
  'Campus Center Theatre', 'both', null,
  'Annie', 'Brunt', null, null, 50),

(2026, 3, '10:30', 45,  'Connection 3 - Crumpled Paper',
  'Campus Center Theatre', 'both', null,
  'Danes, Anna', 'Ash, Annie', null, null, 60),

(2026, 3, '11:15', 5,   'SrC Break 3',
  'Campus Center Theatre', 'staff', null,
  'SrCs', 'Brunt', null, null, 70),

(2026, 3, '11:25', 30,  'Guild Meeting 3',
  '9 Classrooms in C Wing', 'both', null,
  'Brunt/Dom', null, 'Leads leave 10 minutes early to prep',
  'C Wing rooms C004, C007, C008, C009, C011', 80),

-- SPLIT: Lunch (Teams) || Team Meeting 5 — Teams 1-5 meet first, 6-10 eat first, swap after 40 min
(2026, 3, '12:00', 40,  'Lunch (Teams)',
  'N-Wing Dining Hall', 'both', null,
  'Bo', 'Caroline', null, null, 90),

(2026, 3, '12:00', 40,  'Team Meeting 5',
  '10 Classrooms in C Wing', 'both', null,
  'Larry', 'Spencer Anna', null, null, 95),

(2026, 3, '13:30', 20,  'Team Photos and Leader Group Photo',
  'Front of Campus Center', 'both', null,
  null, null, 'Once photo is done, supports go to WEG', null, 100),

(2026, 3, '13:50', 20,  'A Mile in Their Shoes',
  'Campus Center Theatre', 'both', null,
  'Joe, Josh', 'Alex', null, null, 110),

(2026, 3, '14:10', 175, 'Whole Earth Game',
  'Event Room A', 'both', null,
  'Bo, Josh, Alex', 'Production', null,
  'Event Room: 2 tables, 6 chairs, 3 Aux audio, 3 HDMI video, 4 wireless mics', 120),

(2026, 3, '17:05', 25,  'Chips, Debrief, Circle of Life',
  'Event Room A', 'both', null,
  'Bo, Josh, Alex', 'Production', 'Brunt + Meg chips', null, 130),

-- SPLIT: Dinner (Teams) || Follies Practice — Teams 1-5 rehearse, 6-10 eat, then swap
(2026, 3, '17:35', 40,  'Dinner (Teams)',
  'N-Wing Dining Hall', 'both', null,
  'Bo', 'Caroline', null, null, 140),

(2026, 3, '17:35', 40,  'Follies Practice',
  'Outside', 'both', 'C/D Atrium',
  'Chris L', 'Dom', null, null, 145),

(2026, 3, '19:05', 60,  'Follies',
  'Campus Center Theatre', 'both', null,
  'Chris L', 'Dom',
  'Everyone walks out to candle together and circles together',
  'CC Theater: access to control room, 2 Aux audio, 2 HDMI video, 4 wireless mics', 150),

(2026, 3, '20:05', 30,  'Torch Fireside Chat',
  'Campus Center Theatre', 'both', null,
  'Bo', null, null, 'Need Mic and Speakers', 160),

(2026, 3, '20:35', 45,  'Candle Ceremony',
  'Front of Campus', 'both', 'Event Room A',
  'Josh', 'Bo', null, null, 170),

(2026, 3, '21:25', 60,  'Dance',
  'Event Room A', 'both', null,
  'SrCs', 'Brunt', null, null, 180),

(2026, 3, '22:25', 30,  'Lights Out',
  'Housing 2', 'both', null,
  null, null, null, null, 190),

(2026, 3, '22:30', 30,  'Staff Meeting',
  'Meeting Room 5', 'staff', null,
  'Danes', null, null, null, 200),

-- ─── DAY 4 — TUESDAY July 21 (day_number = 4) ───────────────────────────────
(2026, 4, '07:55', 30,  'Wake-Up Call',
  'Housing 2', 'both', null,
  null, null, 'Students pack up', null, 10),

(2026, 4, '08:30', 45,  'Breakfast w. Friends',
  'N-Wing Dining Hall', 'both', null,
  'Bo', 'Caroline', 'Counselors go back to rooms after', null, 30),

(2026, 4, '09:20', 75,  'Team Meeting 6 (Letters to Self/Survey/Thankyous, Trainings)',
  '10 Classrooms in C Wing', 'both', null,
  'Natalie', 'Sarah, Josh',
  'Counselors pack, put stuff in cars, then pick up backpats and bring to Trust',
  'C Wing rooms C004, C007, C008, C009, C011', 40),

(2026, 4, '10:35', 70,  'Trust',
  'Outside - Behind Arts and Sciences', 'both', 'C/D Atrium',
  'Joe', 'Larry', null, null, 50),

(2026, 4, '11:45', 25,  'Escape to Disorientation',
  '10 Classrooms in C Wing', 'staff', null,
  'Joe', 'Brunt', null, null, 60),

(2026, 4, '12:10', 5,   'Walking/Buffer (Disorientation)',
  null, 'staff', null,
  'Joe', 'Brunt', null, null, 65),

(2026, 4, '12:15', 10,  'Disorientation',
  'Outside - Behind Arts and Sciences', 'staff', null,
  'SrCs', 'Brunt', 'SrCs get pied outside — bring table cloths', null, 70),

-- SPLIT: Lunch (Guilds) || Guild Meeting 4 — guilds rotate
(2026, 4, '12:30', 40,  'Lunch (Guilds)',
  'N-Wing Dining Hall', 'both', null,
  'Bo', 'Caroline', null, null, 80),

(2026, 4, '12:30', 40,  'Guild Meeting 4',
  '9 Classrooms in C Wing', 'both', null,
  'Brunt/Dom', null, null,
  'C Wing rooms C004, C007, C008, C009, C011', 85),

(2026, 4, '14:00', 40,  'Gratitude - Connection 4',
  'Campus Center Theatre', 'both', null,
  'Danes, Anna, Joe', null, 'Need advisors present', 'Need Mic and Speakers', 90),

(2026, 4, '14:40', 30,  'Heart to Heart',
  'Campus Center Theatre', 'both', null,
  'Danes, Anna, Joe', null, null, null, 100),

(2026, 4, '15:10', 25,  'Team Final Debrief/Circle of Life',
  'Campus Center Theatre', 'both', null,
  null, null, 'Need advisors present', null, 110),

(2026, 4, '15:35', 40,  'FULL Check Out, Parents Arrive',
  null, 'both', null,
  'Josh, Sarah', 'Meg', null, null, 120),

(2026, 4, '16:15', 60,  'Nonprofit & Community Partner Expo',
  'Event Room A', 'both', null,
  'Jamie & Chris', 'Board', 'Need advisors present', null, 130),

(2026, 4, '17:15', 60,  'Closing Ceremony',
  'Event Room A', 'both', null,
  'The Board', null, null, null, 140),

(2026, 4, '18:15', 10,  'Certificate Handout & Team Photo',
  'Campus Center Lobby / Outside', 'both', null,
  'The Board', null,
  'Return keys to Res Life — preference for students to leave keys in rooms', null, 150),

(2026, 4, '18:25', 10,  'Final Staff Regroup',
  'Event Room A', 'staff', null,
  null, null, 'PHOTO!', null, 160),

(2026, 4, '18:35', 30,  'Advisor Check Out',
  null, 'staff', null,
  'The Board', null, null, null, 170)

;
