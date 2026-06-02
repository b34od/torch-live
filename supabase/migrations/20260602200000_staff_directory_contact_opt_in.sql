-- Staff and admin contact info should be private by default.
-- Existing staff/admin rows are backfilled to opt-out of email/phone display
-- until each person explicitly enables those fields in their own profile.

create or replace function public.apply_user_profile_directory_defaults()
returns trigger
language plpgsql
as $$
begin
  if new.show_in_directory is null then
    new.show_in_directory := true;
  end if;

  if new.show_social is null then
    new.show_social := true;
  end if;

  if new.role in ('staff', 'admin') then
    if tg_op = 'INSERT' or old.role is distinct from new.role then
      new.show_email := false;
      new.show_phone := false;
    else
      if new.show_email is null then
        new.show_email := false;
      end if;

      if new.show_phone is null then
        new.show_phone := false;
      end if;
    end if;
  else
    if new.show_email is null then
      new.show_email := true;
    end if;

    if new.show_phone is null then
      new.show_phone := true;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists set_user_profile_directory_defaults on public.user_profiles;
create trigger set_user_profile_directory_defaults
before insert or update of role
on public.user_profiles
for each row
execute function public.apply_user_profile_directory_defaults();

update public.user_profiles
set
  show_email = false,
  show_phone = false
where role in ('staff', 'admin')
  and (show_email is distinct from false or show_phone is distinct from false);
