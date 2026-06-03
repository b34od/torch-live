-- 1. Suppress social handles from student callers in the directory RPC.
-- 2. Add admin_audit_log table for account management actions.

-- ── Social handle suppression ───────────────────────────────────────────────
create or replace function public.get_directory_profiles(year_param int)
returns table (
  id            uuid,
  full_name     text,
  email         text,
  role          text,
  team_key      text,
  guild_id      uuid,
  guild_name    text,
  guild_slug    text,
  room_number   text,
  social_handle text,
  phone_number  text
)
security definer
set search_path = public, private
language sql as $$
  select
    up.id,
    up.full_name,
    null::text as email,
    up.role,
    up.team_key,
    up.guild_id,
    g.name  as guild_name,
    g.slug  as guild_slug,
    up.room_number,
    -- social handle visible to staff/admin only
    case
      when private.app_user_role() in ('staff', 'admin') and up.show_social
      then up.social_handle
      else null
    end as social_handle,
    null::text as phone_number
  from public.user_profiles up
  left join public.guilds g on g.id = up.guild_id
  where up.program_year = year_param
    and up.is_active = true
    and up.show_in_directory = true
    and private.app_user_year() = year_param
    and private.app_user_role() in ('student', 'staff', 'admin');
$$;

revoke all on function public.get_directory_profiles(int) from public, anon;
grant execute on function public.get_directory_profiles(int) to authenticated;

-- ── Admin audit log ─────────────────────────────────────────────────────────
create table if not exists public.admin_audit_log (
  id              uuid primary key default gen_random_uuid(),
  program_year    int,
  action          text not null,
  actor_id        uuid references auth.users(id),
  actor_email     text,
  target_user_id  uuid,
  target_email    text,
  details         jsonb,
  created_at      timestamptz not null default timezone('utc', now())
);

create index if not exists idx_admin_audit_log_actor
  on public.admin_audit_log(actor_id, created_at desc);
create index if not exists idx_admin_audit_log_target
  on public.admin_audit_log(target_user_id, created_at desc);
create index if not exists idx_admin_audit_log_created
  on public.admin_audit_log(created_at desc);

-- Admins can read; nobody can update or delete rows.
alter table public.admin_audit_log enable row level security;

drop policy if exists admin_audit_log_read on public.admin_audit_log;
create policy admin_audit_log_read
  on public.admin_audit_log
  for select
  to authenticated
  using (private.app_user_role() = 'admin');

drop policy if exists admin_audit_log_insert on public.admin_audit_log;
create policy admin_audit_log_insert
  on public.admin_audit_log
  for insert
  to authenticated
  with check (true);
