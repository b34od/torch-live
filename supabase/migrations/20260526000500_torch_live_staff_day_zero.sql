begin;

alter table public.staff_schedule_items
  drop constraint if exists staff_schedule_items_day_number_check;

alter table public.staff_schedule_items
  add constraint staff_schedule_items_day_number_check
  check (day_number between 0 and 4);

alter table public.student_schedule_items
  drop constraint if exists student_schedule_items_day_number_check;

alter table public.student_schedule_items
  add constraint student_schedule_items_day_number_check
  check (day_number between 1 and 4);

commit;
