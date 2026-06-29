-- Schedule PDF alignment v2: match student-visible items to printed handbook

-- 1. TORCH Rules (Day 1 10:10) → staff only; not on printed student schedule
UPDATE schedule_items SET visibility = 'staff'
WHERE program_year = 2026 AND day_number = 1 AND activity_name = 'TORCH Rules';

-- 2. Orientation (Day 1) time: 15:00 → 15:05 per PDF
UPDATE schedule_items SET start_time = '15:05:00'
WHERE program_year = 2026 AND day_number = 1 AND activity_name = 'Orientation';

-- 3. Day 2 optional activity: rename to match PDF (Sunday = yoga only)
UPDATE schedule_items SET activity_name = 'Optional Yoga'
WHERE program_year = 2026 AND day_number = 2 AND activity_name = 'Optional Yoga or Optional Nature Walk';

-- 4. Day 3 optional activity: missing from DB; PDF shows "Optional Nature Walk (O) 8:00am"
INSERT INTO schedule_items (program_year, day_number, start_time, duration_minutes, activity_name, location, visibility, sort_order)
VALUES (2026, 3, '08:00:00', 25, 'Optional Nature Walk', 'Outside - Near Housing 2', 'both', 20);

-- 5. Connection 2 (Day 2) location: C/D Atrium → Outside per PDF legend (O)
UPDATE schedule_items SET location = 'Outside'
WHERE program_year = 2026 AND day_number = 2 AND activity_name = 'Connection 2 - Identity on the GO';

-- 6. Heart to Heart (Day 4 14:40) → staff only; not on printed student schedule
UPDATE schedule_items SET visibility = 'staff'
WHERE program_year = 2026 AND day_number = 4 AND activity_name = 'Heart to Heart';

-- 7. Team Final Debrief (Day 4 15:10) → staff only; not on printed student schedule
UPDATE schedule_items SET visibility = 'staff'
WHERE program_year = 2026 AND day_number = 4 AND activity_name LIKE 'Team Final Debrief%';

-- 8. Full Checkout (Day 4) location: null → Housing 2 per PDF legend (H)
UPDATE schedule_items SET location = 'Housing 2'
WHERE program_year = 2026 AND day_number = 4 AND activity_name LIKE 'FULL Check Out%';

-- 9. Chips/Debrief/Circle of Life (Day 3 17:05) → staff only; not on printed student schedule
UPDATE schedule_items SET visibility = 'staff'
WHERE program_year = 2026 AND day_number = 3 AND activity_name = 'Chips, Debrief, Circle of Life';
