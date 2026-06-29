-- Day 2: Board Breaking and Adventure Course are student activities, not staff-only
UPDATE schedule_items SET visibility = 'both'
WHERE program_year = 2026 AND day_number = 2 AND activity_name = 'Board Breaking';

UPDATE schedule_items SET visibility = 'both'
WHERE program_year = 2026 AND day_number = 2 AND activity_name = 'Adventure Course';

-- Cleanup: remove duplicate Optional Nature Walk on Day 3 (v2 INSERT duplicated an existing row)
DELETE FROM schedule_items
WHERE program_year = 2026 AND day_number = 3 AND activity_name = 'Optional Nature Walk'
  AND id NOT IN (
    SELECT id FROM schedule_items
    WHERE program_year = 2026 AND day_number = 3 AND activity_name = 'Optional Nature Walk'
    ORDER BY created_at ASC
    LIMIT 1
  );
