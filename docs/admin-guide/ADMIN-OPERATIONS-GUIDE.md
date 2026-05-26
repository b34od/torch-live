# TORCH Live Technical Owner Guide

Last updated: May 26, 2026
Owner: TORCH Live Technical Owner
Audience: Bryan now, Ben/Nat later

If you are a non-technical portal helper, stop here and use:
1. `PORTAL-QUICKSTART.md`
2. `SOP-RUNBOOKS.md` (Portal Operator sections)

## 1) Purpose

This guide covers technical operations that should not be handled by frontline portal operators:
1. Auth configuration
2. Data model and access control boundaries
3. Email/SMTP setup
4. Deployment and verification
5. Legal/risk control ownership

## 2) System Overview

### Core Stack
1. Next.js App Router (`app/`)
2. Supabase (Auth + Postgres + RLS)
3. Vercel hosting/deploy
4. Custom SMTP configured in Supabase Auth

### Key Runtime Files
1. `lib/auth.js`, `middleware.js`
2. `lib/supabase/server.js`, `lib/supabase/client.js`, `lib/supabase/admin.js`
3. `lib/supabase/env.js`
4. `app/auth/confirm/page.js`, `app/auth/callback/route.js`, `app/auth/signout/route.js`

## 3) Role and Access Model

### Roles
1. `student`
2. `staff`
3. `admin`

### Access Rules
1. Role-home mapping is in `lib/navigation.js`.
2. Route protection is in `middleware.js`.
3. Active profile check (`is_active`) is enforced in both `middleware.js` and `lib/auth.js`.

### Current Data Constraint
`public.user_profiles.id` maps 1:1 to `auth.users.id`, so each user has one active profile row and one `program_year` assignment at a time.

## 4) Admin Portal Feature Map (Technical View)

### `/admin/users`
1. Year-scoped roster view
2. Single-user create/edit
3. CSV bulk import
4. Activate/deactivate
5. Remove user from auth + profile
6. Deactivate all student/staff users in selected year

### `/admin/schedule`
1. Student/staff schedule CRUD by day/year
2. Day model is `Friday` to `Tuesday`, with staff-only `Friday` (day 0)
3. Preconfigured location dropdowns for main and rain locations
4. Live start/end preview from start time + duration in add/edit flows
5. Timeline visualization with duration-scaled blocks and right-side time scale
6. `Copy Year`
7. `Clear Year Data` with typed confirmation

### `/admin/announcements`
1. Audience-targeted publish
2. Push-eligible and pin flags
3. 60-second duplicate guard
4. Edit existing announcements
5. Remove outdated announcements (with confirmation prompt)

### `/admin/resources`
1. Category create/edit/remove
2. Resource item create/edit/remove with visibility scope
3. Destructive removals are confirm-gated in UI

### `/admin/settings`
Readiness center covering:
1. Core environment-variable status
2. Schedule overlap scanning
3. Schedule day-coverage checks (staff Friday-Tuesday, student Saturday-Tuesday)
4. Active roster-role coverage checks (admin, staff, student)
5. Magic-link template quality checks (repo and optional live Supabase config parity)

## 5) Auth and User Lifecycle Boundaries

### Auth Flow
1. User requests magic link in `/login`.
2. `/auth/confirm` page extracts auth params from either query string or URL fragment and waits for explicit user tap (`Continue sign-in`) before forwarding to `/auth/callback`.
3. `/auth/callback` completes auth via `verifyOtp(token_hash,type)`, `exchangeCodeForSession(code)`, or fallback `setSession(access_token,refresh_token)`.
4. If magic-link browser handoff fails, user can submit email + 6-8 digit code in `/login` (`verifyOtp(email,token,type=email)`).
5. Role + active profile checks drive final route.

### Service-Role Use
`lib/supabase/admin.js` bypasses RLS and is high-risk.

Current high-risk actions using service-role:
1. Admin user create/list/update/delete in `app/admin/users/page.js`
2. Bootstrap fallback in `app/login/page.js`

## 6) Database Scope (Operational)

Primary tables:
1. `user_profiles`
2. `student_schedule_items`
3. `staff_schedule_items`
4. `announcements`
5. `announcement_reads`
6. `resource_categories`
7. `resource_items`
8. `audit_log`

## 7) Environment and Configuration

Required environment variables:
1. `NEXT_PUBLIC_SUPABASE_URL`
2. `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` or `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. `SUPABASE_SERVICE_ROLE_KEY`
4. `NEXT_PUBLIC_SITE_URL`
5. `TORCH_PROGRAM_YEAR`

Program time policy:
1. Program schedule timing is fixed to Stockton, NJ (`America/New_York`) for all users.

Optional one-time bootstrap:
1. `TORCH_BOOTSTRAP_ADMIN_EMAIL`
2. `TORCH_BOOTSTRAP_ADMIN_NAME`

## 8) Email and URL Configuration

### Supabase Auth Settings
1. `Site URL` should be `https://live.torchleadershipacademy.org`.
2. Redirect URLs must include both `.../auth/confirm` and `.../auth/callback` for production and approved preview domains.
3. Magic Link template should point users to `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email` (SSR-safe token-hash flow).
4. Template should include `{{ .Token }}` backup code so users can use `/login` -> `Sign in with code` when link handoff fails.
5. If enabled, `/admin/settings` will compare repo template baseline with live Supabase template content and flag drift before launch.

### SMTP
1. Custom SMTP must be enabled.
2. Sender address must be on verified domain.
3. Confirm deliverability in provider logs.

### Template Source
`supabase/templates/magic-link.html`

## 9) Legal and Risk Ownership

Published pages:
1. `/legal/privacy`
2. `/legal/terms`
3. `/legal/safety`

Control checklist and intake:
1. `docs/legal-risk-checklist.md`

Operational ownership baseline:
1. Entity owner: Torch Leadership Academy, Inc.
2. Legal/risk owner: Bryan O'Donnell (`bo@torchleadershipacademy.org`)
3. Operational support contact: `info@torchleadershipacademy.org`
4. Audience scope: authorized users age 14+ only

## 10) Troubleshooting

### "Signups not allowed for otp"
Likely missing auth user or disabled signup path. Create/repair user in `/admin/users`.

### "email rate limit exceeded"
Likely provider or auth throttle. Check SMTP provider logs and retry after cooldown.

### "PKCE code verifier not found in storage"
Magic link was opened in a different browser/device than the one used to request it (common on iPhone Gmail in-app browser). Request a new magic link and open it in the same browser context. If needed, use `/login` -> `Sign in with code` and enter the 6-8 digit backup code from the same email. Ensure Supabase Magic Link template uses token-hash confirm route (`/auth/confirm?token_hash=...&type=email`) and includes `{{ .Token }}`.

### "code challenge does not match previously saved code verifier"
Treat this as the same PKCE browser-context mismatch. Use `/login` -> `Sign in with code` from the newest email, or move into Safari and request a fresh sign-in email.

### "stack depth limit exceeded"
Likely RLS helper recursion caused by `SECURITY INVOKER` on `app_user_role()` / `app_user_year()`. Apply migration `20260525233000_torch_live_fix_rls_helper_definer.sql`.

### Magic link goes to localhost
Mismatch in Supabase URL config and/or `NEXT_PUBLIC_SITE_URL`. Correct both.

### Login redirect error about profile
Missing or inactive `user_profiles` row. Repair in `/admin/users`.

## 11) Known Limitation

Current model does not support clean historical multi-year membership under one identity without reassignment.

## 12) Documentation Contract

For any admin-impacting change:
1. Update relevant files in `docs/admin-guide/*`.
2. Update `docs/legal-risk-checklist.md` if legal/risk behavior changes.
3. Add `CHANGELOG.md` entry.
4. Run and record verification (`npm run build` + smoke test).
