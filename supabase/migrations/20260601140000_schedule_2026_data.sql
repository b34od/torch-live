-- ⚠️  DESTRUCTIVE — requires explicit Bryan approval before applying.
-- Replaces ALL 2026 schedule_items with authoritative data from the
-- "MAIN SCHEDULE TORCH 2026.xlsx" PDF (4-page document, all four days).
--
-- Visibility rules applied:
--   'staff'  — internal ops items students never need to see
--              (staff meetings, walking buffers, SrC breaks, TORCH Survey)
--   'both'   — items students need to know about (when/where to be)
--
-- Run via: supabase db push (after Bryan approval)

delete from public.schedule_items where program_year = 2026;

insert into public.schedule_items
  (program_year, day_number, start_time, duration_minutes, activity_name,
   location, visibility, rain_location, point_person, secondary_person, notes, sort_order)
values

-- ────────────────────────────────────────────────────────────────
-- Day 0 — Friday, July 17 (staff only)
-- ────────────────────────────────────────────────────────────────
(2026, 0, '08:00', 60,  'Staff Meeting',            'Staff Lounge',                  'staff', null,           'Danes',          null,            null, 10),
(2026, 0, '09:00', 120, 'Registration / Room Setup', 'Housing 2',                    'staff', null,           'Sarah & Josh',   'Meg & Mitch',   null, 20),
(2026, 0, '11:00', 60,  'Lunch (Staff)',             'N-Wing Dining Hall',           'staff', null,           null,             null,            null, 30),
(2026, 0, '13:00', 180, 'Staff Training & Prep',    'Campus Center Theatre',         'staff', null,           'Danes',          'Brunt',         null, 40),
(2026, 0, '16:00', 60,  'Dinner (Staff)',            'N-Wing Dining Hall',           'staff', null,           null,             null,            null, 50),
(2026, 0, '17:00', 60,  'Final Staff Briefing',     'Staff Lounge',                  'staff', null,           'Danes',          null,            null, 60),

-- ────────────────────────────────────────────────────────────────
-- Day 1 — Saturday, July 18
-- ────────────────────────────────────────────────────────────────
(2026, 1, '08:00', 15,  'Staff Meeting',            'Staff Lounge',                  'staff', null,           null,             null,            null, 10),
(2026, 1, '08:15', 45,  'Registration Set-Up',      'Spot in front of Housing 2/3',  'staff', 'Lot 6/7',      'Sarah & Josh',   'Meg & Mitch',   'Pep talk', 20),
(2026, 1, '09:00', 45,  'Registration & Icebreakers','Housing 2/3 Quad',             'both',  'Event A',      'Sarah & Josh',   'Brunt',         null, 30),
(2026, 1, '09:45', 5,   'TORCH Survey',             'Campus Center Theatre',         'staff', null,           'Josh',           null,            'Pronoun pins + sharpies on table outside', 40),
(2026, 1, '09:50', 30,  'Welcome to TORCH',         'Campus Center Theatre',         'both',  null,           'Caroline & Alex Jones', null,    null, 50),
(2026, 1, '10:20', 10,  'TORCH Rules',              'Campus Center Theatre',         'both',  null,           'Sarah & Josh',   null,            null, 60),
(2026, 1, '10:30', 5,   'Walking Buffer',           null,                            'staff', null,           null,             null,            null, 70),
(2026, 1, '10:35', 60,  'Team Meeting 1',           'Classrooms',                    'both',  null,           'Joey',           'Spencer & Anna','Orange bags, eggs — no scramble', 80),
(2026, 1, '11:35', 15,  'Community Guidelines',     'Campus Center Theatre',         'both',  null,           'Danes, Anna, BO',null,            null, 90),
(2026, 1, '11:50', 40,  'Hall Meeting',             'Campus Center Theatre',         'both',  null,           null,             null,            'Girls: CC Theatre; Boys: Meeting Room 5; LGBTQ+: meeting room', 100),
(2026, 1, '12:30', 45,  'Lunch w/ Team',            'N-Wing Dining Hall',            'both',  null,           null,             null,            'Split by teams', 110),
(2026, 1, '13:15', 45,  'Team Meeting 2 — Pick Guilds','Classrooms',                'both',  null,           'Alex',           'Dom',           'Create guild roster immediately — Danes & Caroline', 120),
(2026, 1, '14:00', 50,  'TRUST: Part I',            'Outside — Behind Arts & Sciences','both','Event Room A', 'Joe',            'Larry',         null, 130),
(2026, 1, '14:50', 30,  'Orientation',              'Campus Center Theatre',         'both',  null,           'SrCs',           'Brunt',         null, 140),
(2026, 1, '15:20', 80,  'Group Challenge — Puzzled','Outside — Behind Arts & Sciences','both','Event Room A', 'Brunt/Caroline', null,            null, 150),
(2026, 1, '16:40', 10,  'Group Challenge Debrief',  'Event Room A',                  'both',  null,           'Brunt/Caroline', null,            null, 160),
(2026, 1, '16:50', 30,  'Connection 1',             'Event Room A',                  'both',  null,           'Danes, Anna',    'Ash & Annie',   null, 170),
(2026, 1, '17:20', 50,  'Guild Meeting 1',          'Classrooms',                    'both',  null,           'Brunt/Dom',      null,            null, 180),
(2026, 1, '18:10', 50,  'Dinner w/ Guild',          'N-Wing Dining Hall',            'both',  null,           'Brunt/Dom',      null,            null, 190),
(2026, 1, '19:00', 70,  'What Is a Leader?',        'Campus Center Theatre',         'both',  null,           'Joe',            'Alex',          'Support counselors leave to set up bonfire — Spencer & Rhicki', 200),
(2026, 1, '20:10', 45,  'Team Meeting 3 — Paper Superheroes','Campus Center Theatre','both', null,           'Joe',            'Alex',          'Large paper & markers', 210),
(2026, 1, '20:55', 30,  'What Is a Leader? (cont.)', 'Campus Center Theatre',       'both',  null,           'Joe',            'Alex',          null, 220),
(2026, 1, '21:25', 10,  'SrC Break',                'Campus Center Theatre',         'staff', null,           'SrCs',           'Brunt',         null, 230),
(2026, 1, '21:35', 5,   'Walking Buffer',           null,                            'staff', null,           null,             null,            null, 240),
(2026, 1, '21:40', 60,  'Bonfire / Social',         'Event Room A',                  'both',  null,           'Spencer/Dom',    null,            null, 250),
(2026, 1, '22:40', 0,   'Lights Out',               'Housing 2',                     'both',  null,           null,             null,            null, 260),
(2026, 1, '22:50', 0,   'Staff Meeting',            'Staff Lounge',                  'staff', null,           'Danes',          null,            null, 270),

-- ────────────────────────────────────────────────────────────────
-- Day 2 — Sunday, July 19
-- ────────────────────────────────────────────────────────────────
(2026, 2, '07:45', 40,  'Wake-Up Call',             'Housing 2',                     'both',  null,           'Sarah',          null,            null, 10),
(2026, 2, '08:00', 25,  'Optional Yoga',            'Grass near Housing 2',          'both',  null,           'Sarah',          null,            null, 20),
(2026, 2, '08:25', 5,   'Walking Buffer',           null,                            'staff', null,           null,             null,            null, 30),
(2026, 2, '08:30', 45,  'Breakfast w/ Friends',     'N-Wing Dining Hall',            'both',  null,           'Bryan',          'Caroline',      null, 40),
(2026, 2, '09:15', 65,  'Believe',                  'Campus Center Theatre',         'both',  null,           'Joe',            'Larry',         'BB shirts', 50),
(2026, 2, '10:20', 90,  'Board Breaking',           'Outside — Behind Arts & Sciences','both','Event Room A', null,             null,            null, 60),
(2026, 2, '11:50', 45,  'Catered Lunch & Team Meeting 4 Debrief','Event Room A',    'both',  null,           'Bryan',          'Caroline',      null, 70),
(2026, 2, '12:35', 60,  'Color Outside the Lines',  'Campus Center Theatre',         'both',  null,           'Alex J.',        'Anna',          null, 80),
(2026, 2, '13:35', 45,  'Connection 2 — Identity on the GO','Outside',              'both',  'Coffee House',  'Danes, Anna',    'Ash & Annie',   'Need advisors, not counselors: paper & writing utensils', 90),
(2026, 2, '14:20', 10,  'International Leadership', 'Campus Center Theatre',         'both',  null,           'Jamie',          'Josh',          null, 100),
(2026, 2, '14:30', 15,  'Brief for Adventure Course','Campus Center Theatre',        'staff', null,           'Dom',            'Sarah/Meg',     'A/C costumes, props', 110),
(2026, 2, '14:45', 165, 'Adventure Course',         'Outside — Behind Arts & Sciences','both','Event Room A', 'Dom',            'Sarah/Meg',     null, 120),
(2026, 2, '17:30', 45,  'Dinner w/ Guild',          'N-Wing Dining Hall',            'both',  null,           'Bryan',          'Caroline',      null, 130),
(2026, 2, '18:15', 45,  'Guild Meeting 2',          'Classrooms',                    'both',  null,           'Brunt/Dom',      null,            null, 140),
(2026, 2, '19:00', 15,  'Adventure Course Debrief', 'Event Room A',                  'both',  null,           'Dom',            'Meg',           null, 150),
(2026, 2, '19:15', 45,  'Believe Debrief & Goal Mining','Event Room A',             'both',  null,           'Alex Jones',     'Joe',           null, 160),
(2026, 2, '20:00', 60,  'Impact',                   'Coffeehouse',                   'both',  'Caroline',     'BO',             null,            'Candles (plastic)', 170),
(2026, 2, '21:00', 5,   'SrC Break 2',              'Campus Center Theatre',         'staff', null,           'SrCs',           'Brunt',         null, 180),
(2026, 2, '21:05', 170, 'Movie Night',              'Campus Center Theatre',         'both',  null,           'Spencer W.',     'Alex Jones',    'Movie night costumes', 190),
(2026, 2, '23:55', 5,   'Walking Buffer',           null,                            'staff', null,           null,             null,            null, 200),
(2026, 2, '00:00', 0,   'Lights Out',               'Housing 2',                     'both',  null,           null,             null,            null, 210),
(2026, 2, '00:00', 30,  'Staff Meeting',            'Staff Lounge',                  'staff', null,           'Danes',          null,            null, 220),

-- ────────────────────────────────────────────────────────────────
-- Day 3 — Monday, July 20
-- ────────────────────────────────────────────────────────────────
(2026, 3, '07:45', 40,  'Wake-Up Call',             'Housing 2',                     'both',  null,           null,             null,            'Students should bring follies props', 10),
(2026, 3, '08:25', 5,   'Walking Buffer',           null,                            'staff', null,           null,             null,            null, 20),
(2026, 3, '08:30', 45,  'Breakfast w/ Friends',     'N-Wing Dining Hall',            'both',  null,           'Bryan',          'Caroline',      null, 30),
(2026, 3, '09:15', 15,  'Team Photos & Leader Group Photo','Outside — Behind N-Wing','both', 'C/D Atrium',   null,             null,            'Once photo done, supports go to WEG', 40),
(2026, 3, '09:30', 60,  'Trust Exercises 2',        'Outside — Behind N-Wing',       'both',  'C/D Atrium',   'Joe',            'Larry',         null, 50),
(2026, 3, '10:30', 5,   'Walking Buffers',          null,                            'staff', null,           null,             null,            null, 60),
(2026, 3, '10:30', 15,  'Presence — Guided Meditation','Campus Center Theatre',     'both',  'C/D Atrium',   'Annie',          'Brunt',         null, 70),
(2026, 3, '10:45', 45,  'Connection 3 — Crumpled Paper','Campus Center Theatre',   'both',  null,           'Danes, Anna',    'Ash, Annie',    null, 80),
(2026, 3, '11:30', 10,  'SrC Break 3',              'Campus Center Theatre',         'staff', null,           'SrCs',           'Brunt',         null, 90),
(2026, 3, '11:40', 5,   'Walking Buffer',           null,                            'staff', null,           null,             null,            null, 100),
(2026, 3, '11:35', 35,  'Guild Meeting 3',          'Classrooms',                    'both',  null,           'Brunt/Dom',      null,            'Leads leave 10 min early', 110),
(2026, 3, '12:10', 45,  'Lunch & Team Meeting 5 — Lead Freestyle','Classrooms',    'both',  null,           'Larry',          'Spencer Anna',  null, 120),
(2026, 3, '12:55', 45,  'Lunch & Team Meeting 5 — Lead Freestyle','N-Wing Dining Hall','both',null,          'Bryan',          'Caroline',      null, 130),
(2026, 3, '13:40', 20,  'A Mile in Their Shoes',    'Campus Center Theatre',         'both',  null,           'Joe Josh',       'Alex',          null, 140),
(2026, 3, '14:00', 180, 'Whole Earth Game',         'Event Room A',                  'both',  null,           'Bryan Josh Alex','Production',    null, 150),
(2026, 3, '17:00', 30,  'Chips, Debrief, Circle of Life','Event Room A',            'both',  null,           'Bryan Josh Alex','Production',    'Brunt + Meg Chips', 160),
(2026, 3, '17:30', 45,  'Follies Rehearsal / Dinner','Campus Center Theatre',       'both',  'Event Room A', 'Chris L.',       'Dom',           null, 170),
(2026, 3, '18:15', 45,  'Follies Rehearsal / Dinner','N-Wing Dining Hall',          'both',  null,           'Bryan',          'Caroline',      null, 180),
(2026, 3, '19:00', 60,  'Follies',                  'Campus Center Theatre',         'both',  null,           'Chris L.',       'Dom',           'Everyone walks out to candle together', 190),
(2026, 3, '20:00', 30,  'TORCH Fireside Chat',      'Campus Center Theatre',         'both',  null,           'Bryan',          null,            null, 200),
(2026, 3, '20:30', 45,  'Candle Ceremony — Congratulations','J/K Wing Amphitheatre','both', 'Event Room A', 'Josh',           'BO',            null, 210),
(2026, 3, '21:15', 5,   'Walking Buffer',           null,                            'staff', null,           null,             null,            null, 220),
(2026, 3, '21:20', 60,  'Dance',                    'TRLC',                          'both',  null,           'SrCs',           'Brunt',         null, 230),
(2026, 3, '22:20', 0,   'Lights Out',               'Housing 2',                     'both',  null,           null,             null,            null, 240),
(2026, 3, '22:20', 30,  'Staff Meeting',            'Staff Lounge',                  'staff', null,           'Danes',          null,            null, 250),

-- ────────────────────────────────────────────────────────────────
-- Day 4 — Tuesday, July 21
-- ────────────────────────────────────────────────────────────────
(2026, 4, '07:55', 30,  'Wake-Up Call (students pack up)','Housing 2',              'both',  null,           null,             null,            'Students be packed', 10),
(2026, 4, '08:25', 5,   'Walking Buffer',           null,                            'staff', null,           null,             null,            null, 20),
(2026, 4, '08:30', 50,  'Breakfast w/ Friends',     'N-Wing Dining Hall',            'both',  null,           'Bryan',          'Caroline',      'Counselors go back to rooms after', 30),
(2026, 4, '09:20', 75,  'Team Meeting 6 — Letters to Self / Survey / Thankyous / Trainings','Classrooms','both',null,'Natalie','Sarah Josh',    'Counselors pack, put stuff in cars, then pick up backpacks and bring to Trust', 40),
(2026, 4, '10:35', 70,  'Trust',                    'Outside — Behind Arts & Sciences','both','C/D Atrium',  'Joe',            'Larry',         null, 50),
(2026, 4, '11:45', 30,  'Escape to Disorientation', 'Classrooms',                   'both',  null,           'Joe',            'Brunt',         null, 60),
(2026, 4, '12:15', 10,  'Walking Buffer / Disorientation','—',                      'staff', null,           'Joe',            'Brunt',         null, 70),
(2026, 4, '12:25', 10,  'Disorientation',           'Outside',                       'both',  'CC Theater',   'SrCs',           'Brunt',         'SrCs get pied outside — BRING TABLE CLOTHS', 80),
(2026, 4, '12:35', 40,  'Guild Meeting 4',          'Classrooms',                    'both',  null,           'Brunt/Dom',      null,            null, 90),
(2026, 4, '13:15', 40,  'Lunch (Teams)',             'N-Wing Dining Hall',           'both',  null,           'Bryan',          'Caroline',      null, 100),
(2026, 4, '13:55', 40,  'Gratitude — Connection 4', 'Campus Center Theatre',         'both',  null,           'Danes, Anna, GI',null,           'Need advisors present', 110),
(2026, 4, '14:35', 30,  'Heart to Heart',           'Campus Center Theatre',         'both',  null,           'Danes, Anna, GI',null,           null, 120),
(2026, 4, '15:05', 25,  'Team Final Debrief / Circle of Life','Campus Center Theatre','both',null,           null,             null,            'Need advisors present', 130),
(2026, 4, '15:30', 40,  'Full Check Out — Parents Arrive','—',                      'both',  null,           'Josh Sarah',     'Meg',           null, 140),
(2026, 4, '16:10', 60,  'Nonprofit & Community Partner Expo','Event Room A',        'both',  null,           'Jamie & Chris',  'Board',         'Need advisors present', 150),
(2026, 4, '17:10', 60,  'Closing Ceremony',         'Event Room A',                  'both',  null,           'The Board',      null,            null, 160),
(2026, 4, '18:10', 10,  'Certificate Handout + Final Team Photo','Campus Center Lobby / Outside','both',null,'The Board',      null,            'Return to Res Life — preference for students to leave keys in rooms', 170),
(2026, 4, '18:20', 10,  'Final Staff Regroup + Photo','—',                          'staff', null,           'The Board',      null,            null, 180),
(2026, 4, '18:30', 0,   'Advisor Check Out',        '—',                             'staff', null,           'The Board',      null,            null, 190);
