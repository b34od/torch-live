# TORCH Live SOP Runbooks

Last updated: May 27, 2026

## Audience Split

1. `Portal Operator SOPs` are for non-technical admins who only use `/admin/*`.
2. `Technical Owner SOPs` are for infrastructure, backend, legal/risk, and deployment tasks.

## Shared Rollout Cadence (Next 8 Weeks)

1. `Weeks 1-2`: admin core team dry run (`Schedule`, `Users`, `Announcements`, `Resources`, `Settings`) using non-critical program-year data.
2. `Weeks 3-4`: staff pilot with real mobile devices and account activation checks.
3. `Weeks 5-6`: student-facing pilot for schedule/updates/resources readability and login reliability.
4. `Weeks 7-8`: launch hardening, final smoke tests, and go-live signoff.
5. Run this cadence in ET (`America/New_York`) and keep one owner accountable per week.

---

## Portal Operator SOP 1: Start of Shift

### Objective
Confirm the portal is ready before making changes.

### Steps
1. Sign in at `/login`.
2. If magic-link handoff fails, use `Sign in with code` and enter the 6-8 digit backup code from the same email.
3. Open `Users` and confirm `Roster Year`.
4. Open `Schedule` and confirm `Track`, `Program Year`, and `Day`.
5. Open `Announcements` and review recent pinned posts.

### Success Check
1. You can access all admin tabs.
2. Year shown in `Users` and `Schedule` is correct.

## Portal Operator SOP 2: Publish an Announcement

### Objective
Send clear updates to the right audience.

### Steps
1. Go to `/admin/announcements`.
2. Enter `Title` and `Body`.
3. Set `Audience` to `All`, `Staff only`, or `Students only`.
4. Optional: set `Mark as push-eligible` and `Pin to top`.
5. Click `Publish Announcement`.

### Success Check
1. Banner shows `Announcement published.`
2. Post appears under `Recent Announcements`.

### Cleanup Action
1. Use `Edit` to fix wording/audience mistakes.
2. Remove outdated posts directly from `Recent Announcements` using `Remove`, then confirm.

## Portal Operator SOP 3: Update Schedule

### Objective
Keep schedule accurate for students and staff.

### Steps
1. Go to `/admin/schedule`.
2. Pick `Track`, `Program Year`, and day label (`Friday` through `Tuesday`), then click `Load Schedule`.
3. Friday is staff-only; student schedules start Saturday.
4. For new entry, complete `Add Schedule Item`, confirm start/end preview, then click `Add Item`.
5. For existing entry, click `Edit`, update fields, then click `Save Item`.

### Success Check
1. Updated or new row appears in the schedule table.
2. Start/end range is correct and timeline block position/length matches intent.
3. Timeline conflict warning is empty (or overlaps are intentionally approved).
4. If overlap is required for operations, item was saved with explicit `Allow overlap` acknowledgment.

## Portal Operator SOP 4: Bulk Upload Users

### Objective
Load a roster quickly with fewer manual edits.

### Input Format
1. CSV columns: `full_name,email,role,year`
2. Allowed roles: `student`, `staff`, `admin`

### Steps
1. Go to `/admin/users`.
2. Set `Roster Year`.
3. Paste CSV into `Paste CSV` or upload file in `Or upload CSV file`.
4. Click `Import Users`.
5. Spot-check at least 10 rows in `Current Year Roster`.

### Success Check
1. Import result banner appears.
2. Rows are visible with correct role and year.

## Portal Operator SOP 5: Edit / Deactivate / Remove User

### Objective
Keep access clean and current.

### Steps
1. Go to `/admin/users`.
2. Use `Edit` for name/email/role/year/status changes.
3. Use `Deactivate` to turn access off without deleting.
4. Use `Remove` only for permanent removal.

### Guardrail
1. Never deactivate or remove your own admin account.

## Portal Operator SOP 6: End of Day Closeout

### Objective
Leave the portal clean for the next shift.

### Steps
1. Confirm tomorrow's first schedule blocks are correct.
2. Unpin stale urgent announcements.
3. Remove stale resource entries in `/admin/resources` (or edit them if they should stay).
4. Log any unresolved issues for Bryan.

## Portal Operator SOP 7: Weekly Rollout Pilot Checklist

### Objective
Confirm each role can use the app on mobile without blockers before full launch.

### Steps
1. Complete one admin sign-in and one staff/student sign-in on a phone.
2. Confirm schedule day labels are correct (`Friday` through `Tuesday`) and ET context is visible.
3. Confirm one schedule edit save from mobile and verify timeline + list views update.
4. Publish and unpublish one announcement to verify content flow.
5. Record any issue with screenshot, device type, and exact time.

### Success Check
1. No sign-in dead ends.
2. No unreadable schedule blocks.
3. No blocked save/publish actions.

---

## Technical Owner SOP 0: Rollout Phase Gates

### Objective
Move from pilot to production launch with explicit gates, not assumptions.

### Gate A: Admin Pilot Exit
1. At least 3 admin users complete mobile sign-in + schedule edit successfully.
2. Launch readiness required checks in `/admin/settings` are green.
3. No unresolved P0/P1 auth or schedule issues.

### Gate B: Staff Pilot Exit
1. At least 5 staff users complete login and consume `/staff/now` + `/staff/schedule`.
2. Staff day coverage (`Friday` to `Tuesday`) is complete.
3. No timezone confusion reports after ET labeling updates.

### Gate C: Student Pilot Exit
1. At least 10 student users complete login and consume `/student/now` + `/student/schedule`.
2. Student schedule readability is acceptable on iPhone and Android.
3. Announcement and resource views are readable and usable on small screens.

### Gate D: Launch Approval
1. Production deploy smoke checks pass (`/login`, `/admin/schedule`, `/staff/schedule`, `/student/schedule`).
2. One live rollback path is documented in release notes.
3. Bryan signs off on launch after reviewing unresolved-risk list.

## Technical Owner SOP 1: Pre-Program Technical Readiness

### Objective
Validate auth, email, domain, and data readiness before launch.

### Steps
1. Verify production domain and latest deploy in Vercel.
2. Verify Supabase URL configuration (`Site URL` and redirect URLs).
3. Verify SMTP sender and domain status.
4. Verify Magic Link template uses token-hash confirm URL (`/auth/confirm?token_hash=...&type=email`) and displays `{{ .Token }}` backup code.
5. Verify env vars are present.
6. Run one student and one staff login test.

## Technical Owner SOP 2: Year Rollover

### Objective
Transition from prior year to new year without deleting history.

### Steps
1. In `/admin/users`, run `Deactivate Student/Staff in YEAR` for completed year.
2. In `/admin/schedule`, run `Copy Year` if reusing schedule baseline.
3. Import upcoming roster to the new year.
4. Verify both tracks and all days in schedule.

## Technical Owner SOP 3: Incident Response

### Trigger Examples
1. Auth outage or mass login failure.
2. Wrong schedule published broadly.
3. Suspected credential leak.
4. Email delivery outage.

### Immediate Actions
1. Freeze risky admin changes.
2. Verify provider status (Supabase, Vercel, email provider).
3. Publish corrective announcement if needed.
4. Rotate compromised credentials.
5. Document timeline and recovery actions.

## Technical Owner SOP 4: Change Control

### Before Deploy
1. Run `npm run build`.
2. Validate affected admin flows.
3. Update docs in `docs/admin-guide/*` and `docs/legal-risk-checklist.md` as needed.
4. Append `CHANGELOG.md` entry.

### After Deploy
1. Smoke test `/login`, `/admin/schedule`, `/admin/users`, `/admin/announcements`, `/admin/resources`.
2. If auth/email changed, run one magic-link test end-to-end.

## Technical Owner SOP 5: Legal and Risk Operations Cadence

### Objective
Keep compliance controls current without relying on memory.

### Weekly (during active program)
1. Review admin roster and deactivate any account that is no longer authorized.
2. Confirm urgent/safety communication channels are functioning.
3. Confirm sender/domain deliverability is healthy.

### Monthly (off-season)
1. Review user access and remove stale temporary accounts.
2. Review incident/accessibility inboxes and close resolved items.
3. Validate legal links in app footer and login page.

### Annual (within 30 days post-program)
1. Run year rollover and deactivate completed-year student/staff accounts.
2. Execute retention sweep according to `docs/legal-risk-checklist.md`.
3. Archive incident log and accessibility log for the completed cycle.

### Annual (before next launch)
1. Review legal pages (`/legal/privacy`, `/legal/terms`, `/legal/safety`) with counsel notes.
2. Re-verify vendor terms/DPA records and operational contacts.
3. Run full login and role-based smoke test before opening access.
