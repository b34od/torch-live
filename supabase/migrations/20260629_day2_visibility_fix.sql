-- Cleanup: remove duplicate Optional Nature Walk on Day 3 (v2 INSERT duplicated an existing row)
DELETE FROM schedule_items
WHERE program_year = 2026 AND day_number = 3 AND activity_name = 'Optional Nature Walk'
  AND id NOT IN (
    SELECT id FROM schedule_items
    WHERE program_year = 2026 AND day_number = 3 AND activity_name = 'Optional Nature Walk'
    ORDER BY created_at ASC
    LIMIT 1
  );
