# AGENTS.md — TORCH Live

Orientation instructions for Codex (and any other automated agent) working in this repo.

## Project

TORCH Live is the operational web app for the TORCH Leadership Academy summer program.
Stack: Next.js 15 (App Router + Server Actions), Supabase (auth + Postgres + RLS), Pure CSS (no Tailwind), Twilio SMS.

**Second brain:** `/Users/BryanODonnell/Documents/Obsidian Vault/Projects/TORCH Live/`
Read `TORCH Live.md` (hub), `Backlog.md`, and `Decisions.md` at session start.

**Program dates:** July 18–21, 2026, Stockton University
**Deploy target:** July 12, 2026

## Session Start Protocol

1. Read this file.
2. Read `graphify-out/GRAPH_REPORT.md` if it exists — it maps the codebase.
3. Read the Obsidian hub: `TORCH Live.md` → `Backlog.md` → `Decisions.md`.
4. Run `git status --short --branch` to see current state.

## Codex Responsibilities

Codex is not only an audit/readiness lane for TORCH Live. Codex is also the PM discipline lane for this repo.

### Product Management and Change Management

- Own backlog hygiene: keep priorities, statuses, acceptance criteria, and dependencies current.
- Apply lightweight PM frameworks in notes and planning artifacts: RICE for prioritization, MoSCoW for scope control, and clear outcome/owner/date framing.
- Maintain change discipline: classify meaningful changes as `standard`, `normal`, or `emergency`, and capture risk, approvals, rollout plan, and rollback plan.
- Keep docs synchronized: when scope or behavior changes, update project hub, backlog, and decisions notes in Obsidian in the same session.
- Enforce release evidence: each significant work item should end with what changed, what was verified, what remains unverified, and operational impact.

### Delivery and Readiness

- Pre-deploy security audit: RLS policies, server actions, auth flows.
- GitHub PR review and merge closeout.
- Narrow correctness fixes after audit findings.
- Release checklist validation before July 12 deploy.

Do not build new features without explicit instruction. Check the Backlog for current sprint items and align work to the current highest-priority release items.

## Architecture Notes

- All protected pages call `requireUser()` from `lib/auth.js` at the top — never skip this.
- Server Actions use `createAdminSupabaseClient()` (service role) for writes; read-only ops use the user's session client via `createServerSupabaseClient()`.
- RLS is the authority on data access — do not re-implement role checks in app code.
- Schedule data lives in `schedule_items` (unified table). Old `staff_schedule_items` and `student_schedule_items` tables still exist in DB but are not used by app code.
- SMS dispatch is in `lib/notifications.js` → imported by `app/admin/announcements/page.js` only.

## Migration State

Applied to production (in order):
1. `20260525151500_torch_live_initial.sql`
2. `20260525214000_torch_live_hardening.sql`
3. `20260525214500_torch_live_rls_helper_invoker.sql`
4. `20260525233000_torch_live_fix_rls_helper_definer.sql`
5. `20260526000500_torch_live_staff_day_zero.sql`
6. `20260526091500_torch_live_private_rls_helpers.sql`
7. `20260528103000_torch_live_schedule_unification_and_urgent_messaging.sql`

8. `20260606120000_nat_sprint_identity_and_specialty.sql`

## Schema Additions (Nat Sprint — awaiting migration 20260606120000)

These columns are implemented in app code and will be active once the migration is applied:

| Column | Table | Type | Access |
|---|---|---|---|
| `pronouns` | `user_profiles` | `text` nullable | User self-editable via `/api/profile` |
| `specialty_tag` | `user_profiles` | `text` CHECK IN ('Nurse','Wellbeing Advisor') | Admin-only (not in `/api/profile`) |
| `cotl_color` | `user_profiles` | `text` CHECK IN ('blue','green','gold','orange') | User self-editable via `/api/profile` |
| `superpower` | `user_profiles` | `text` nullable (30 char soft limit) | User self-editable only — not in admin forms |

`get_directory_profiles(year_param INT)` now returns all 4 new columns (visible to all authenticated roles).

`getUserProfiles()` in `lib/data.js` now selects `pronouns, specialty_tag, cotl_color, superpower`.

`/api/profile` route now accepts: `pronouns` (60 char max), `superpower` (30 char max), `cotl_color` (enum-validated).

**Dependency note:** If TL-024 (CSP nonce hardening) is implemented, the inline theme script in `app/layout.js` will need a nonce attribute added.

## Approval Gates

**Always require Bryan approval before:**
- Applying Supabase migrations to production
- Merging to `main`
- Pushing to remote
- Changing env vars in Vercel
- Any destructive operation (drop table, delete rows, reset data)

## Key Files

| File | Purpose |
|---|---|
| `lib/auth.js` | `requireUser()` — the auth gate for all protected pages |
| `lib/data.js` | All Supabase read helpers (schedule, announcements, users) |
| `lib/notifications.js` | Twilio SMS dispatch + recipient resolution |
| `lib/schedule-drafts.js` | Draft preload helpers for 2026 schedule |
| `app/admin/schedule/page.js` | Admin schedule CRUD — heaviest file in the repo |
| `app/admin/announcements/page.js` | Announcements + SMS dispatch |
| `app/admin/users/page.js` | Bulk import + user management |
| `supabase/migrations/` | All DB migrations in chronological order |
