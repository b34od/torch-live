-- Full schedule duration scrub: align all student-visible items to ~5 min gap before next item
-- Also merges Community Guidelines + Hall Meeting into one student-facing block (matches PDF)

-- Day 1: Merge Community Guidelines & Hall Meeting
UPDATE schedule_items SET activity_name = 'Community Guidelines & Hall Meeting', duration_minutes = 65
  WHERE program_year = 2026 AND day_number = 1 AND activity_name = 'Community Guidelines';
UPDATE schedule_items SET visibility = 'staff'
  WHERE program_year = 2026 AND day_number = 1 AND activity_name = 'Hall Meeting';

-- Day 1: Duration corrections
UPDATE schedule_items SET duration_minutes = 40  WHERE program_year = 2026 AND day_number = 1 AND activity_name = 'Welcome To Torch';
UPDATE schedule_items SET duration_minutes = 60  WHERE program_year = 2026 AND day_number = 1 AND activity_name = 'Team Meeting 1';
UPDATE schedule_items SET duration_minutes = 55  WHERE program_year = 2026 AND day_number = 1 AND activity_name = 'TRUST: PART I';
UPDATE schedule_items SET duration_minutes = 20  WHERE program_year = 2026 AND day_number = 1 AND activity_name = 'Orientation';
UPDATE schedule_items SET duration_minutes = 80  WHERE program_year = 2026 AND day_number = 1 AND activity_name = 'Group Challenge (Puzzled)';
UPDATE schedule_items SET duration_minutes = 65  WHERE program_year = 2026 AND day_number = 1 AND activity_name LIKE 'The Power of Leadership%';
UPDATE schedule_items SET duration_minutes = 45  WHERE program_year = 2026 AND day_number = 1 AND activity_name LIKE 'Team Meeting 3%';
UPDATE schedule_items SET duration_minutes = 55  WHERE program_year = 2026 AND day_number = 1 AND activity_name = 'Bonfire / Social';

-- Day 2: Duration corrections
UPDATE schedule_items SET duration_minutes = 140 WHERE program_year = 2026 AND day_number = 2 AND activity_name = 'Believe';
UPDATE schedule_items SET duration_minutes = 40  WHERE program_year = 2026 AND day_number = 2 AND activity_name LIKE 'Catered Lunch%';
UPDATE schedule_items SET duration_minutes = 185 WHERE program_year = 2026 AND day_number = 2 AND activity_name = 'International Leadership';
UPDATE schedule_items SET duration_minutes = 10  WHERE program_year = 2026 AND day_number = 2 AND activity_name = 'Debrief' AND start_time = '19:00';
UPDATE schedule_items SET duration_minutes = 55  WHERE program_year = 2026 AND day_number = 2 AND activity_name = 'Goal Mining';

-- Day 3: Duration corrections
UPDATE schedule_items SET duration_minutes = 55  WHERE program_year = 2026 AND day_number = 3 AND activity_name = 'Breakfast w/ Friends';
UPDATE schedule_items SET duration_minutes = 45  WHERE program_year = 2026 AND day_number = 3 AND activity_name = 'Trust 2';
UPDATE schedule_items SET duration_minutes = 50  WHERE program_year = 2026 AND day_number = 3 AND activity_name LIKE 'Connection 3%';
UPDATE schedule_items SET duration_minutes = 15  WHERE program_year = 2026 AND day_number = 3 AND activity_name LIKE 'Team Photos%';
UPDATE schedule_items SET duration_minutes = 15  WHERE program_year = 2026 AND day_number = 3 AND activity_name = 'A Mile in Their Shoes';
UPDATE schedule_items SET duration_minutes = 200 WHERE program_year = 2026 AND day_number = 3 AND activity_name = 'The Whole Earth Game';
UPDATE schedule_items SET duration_minutes = 55  WHERE program_year = 2026 AND day_number = 3 AND activity_name = 'Follies';
UPDATE schedule_items SET duration_minutes = 25  WHERE program_year = 2026 AND day_number = 3 AND activity_name = 'Fireside Chat';
UPDATE schedule_items SET duration_minutes = 55  WHERE program_year = 2026 AND day_number = 3 AND activity_name = 'Dance';

-- Day 4: Duration corrections
UPDATE schedule_items SET duration_minutes = 70  WHERE program_year = 2026 AND day_number = 4 AND activity_name LIKE 'Team Meeting 6%';
UPDATE schedule_items SET duration_minutes = 65  WHERE program_year = 2026 AND day_number = 4 AND activity_name = 'Trust';
UPDATE schedule_items SET duration_minutes = 35  WHERE program_year = 2026 AND day_number = 4 AND activity_name LIKE 'FULL Check Out%';
UPDATE schedule_items SET duration_minutes = 55  WHERE program_year = 2026 AND day_number = 4 AND activity_name LIKE 'Nonprofit%';
UPDATE schedule_items SET duration_minutes = 55  WHERE program_year = 2026 AND day_number = 4 AND activity_name = 'Closing Ceremony';
