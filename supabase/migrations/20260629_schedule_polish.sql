-- Schedule polish: split durations, timing corrections, Follies/Fireside no-buffer

-- Day 2: guild split 45→40 (fixes debrief overlap), Movie Night earlier start
UPDATE schedule_items SET duration_minutes = 40 WHERE program_year = 2026 AND day_number = 2 AND activity_name = 'Dinner (Guilds)';
UPDATE schedule_items SET duration_minutes = 40 WHERE program_year = 2026 AND day_number = 2 AND activity_name = 'Guild Meeting 2';
UPDATE schedule_items SET start_time = '21:15', duration_minutes = 160 WHERE program_year = 2026 AND day_number = 2 AND activity_name = 'Movie Night';

-- Day 3: Trust 2 moved to 9:15, Breakfast adjusted, splits 45→40, Follies/Fireside extended
UPDATE schedule_items SET start_time = '09:15', duration_minutes = 60 WHERE program_year = 2026 AND day_number = 3 AND activity_name = 'Trust 2';
UPDATE schedule_items SET duration_minutes = 45 WHERE program_year = 2026 AND day_number = 3 AND activity_name = 'Breakfast w/ Friends';
UPDATE schedule_items SET duration_minutes = 40 WHERE program_year = 2026 AND day_number = 3 AND activity_name = 'Lunch (Teams)';
UPDATE schedule_items SET duration_minutes = 40 WHERE program_year = 2026 AND day_number = 3 AND activity_name = 'Team Meeting 5';
UPDATE schedule_items SET duration_minutes = 40 WHERE program_year = 2026 AND day_number = 3 AND activity_name = 'Dinner (Teams)';
UPDATE schedule_items SET duration_minutes = 40 WHERE program_year = 2026 AND day_number = 3 AND activity_name = 'Follies Practice';
UPDATE schedule_items SET duration_minutes = 60 WHERE program_year = 2026 AND day_number = 3 AND activity_name = 'Follies';
UPDATE schedule_items SET duration_minutes = 30 WHERE program_year = 2026 AND day_number = 3 AND activity_name = 'Fireside Chat';

-- Day 4: lunch split 45→40
UPDATE schedule_items SET duration_minutes = 40 WHERE program_year = 2026 AND day_number = 4 AND activity_name = 'Lunch (Guilds)';
UPDATE schedule_items SET duration_minutes = 40 WHERE program_year = 2026 AND day_number = 4 AND activity_name = 'Guild Meeting 4';
