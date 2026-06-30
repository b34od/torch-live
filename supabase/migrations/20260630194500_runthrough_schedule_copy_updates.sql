-- Production runthrough copy corrections noted on 2026-06-30.
-- Apply in production only after Bryan confirms the live Friday row wording.

UPDATE public.schedule_items
SET activity_name = 'Pass the TORCH'
WHERE program_year = 2026
  AND day_number = 0
  AND lower(activity_name) = 'counselor induction ceremony';
