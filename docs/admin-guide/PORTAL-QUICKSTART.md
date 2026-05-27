# TORCH Live Portal Quickstart

Last updated: May 27, 2026
Audience: non-technical admins using only `https://live.torchleadershipacademy.org`

## 1) What You Need Before You Start

1. Your own admin account email is active.
2. You can receive a sign-in link by email.
3. You know the current program year (example: `2026`).
4. Schedule times are anchored to Stockton, NJ (`America/New_York` Eastern Time) for all users.

If any of these fail, stop and contact Bryan.

## 2) Sign In

1. Open `https://live.torchleadershipacademy.org/login`.
2. Enter your email and click `Send sign-in email`.
3. Open your newest email and click `Sign in to TORCH Live`.
4. On the confirm screen, tap `Continue sign-in`.
5. If the link opens in the wrong browser, return to `/login` and use `Sign in with code` with the 6-8 digit backup code shown in the same email.
6. Confirm you land on admin pages with tabs like `Schedule`, `Announcements`, `Resources`, `Users`, `Settings`.
7. Important on iPhone/Gmail: if the email opens inside Gmail's browser, use `Open in Safari` and request a fresh sign-in email there before retrying.

## 3) Your 5 Core Jobs

### Job A: Publish Announcements

1. Open `Announcements`.
2. Fill `Title` and `Body`.
3. Choose `Audience`.
4. Optional: check `Mark as push-eligible` and/or `Pin to top`.
5. Click `Publish Announcement`.
6. Confirm message: `Announcement published.`
7. To correct a post, use `Edit` under that post, save, then click `Done editing`.
8. To remove an outdated post, use `Remove` under that post and confirm.

### Job B: Update Schedule

1. Open `Schedule`.
2. Set `Track`, `Program Year`, and day label (`Friday` through `Tuesday`).
3. Note: `Friday` is staff-only move-in day.
4. Click `Load Schedule`.
5. Optional (new program setup): under `Year Tools`, use `Load 2026 Draft Baseline`, choose a `Draft Source` (`2026 Draft` or `2025 Baseline`), choose `Current Track Only` or `Both Staff + Student Tracks`, then type `LOAD <year>` or `LOAD BOTH <year>`.
6. Confirm the displayed draft row counts and per-day preview times, then submit once to preload the selected draft scope.
7. Review the loaded draft in timeline + item list before making edits.
8. Add or edit item details with start time, duration, and preconfigured locations.
9. Confirm the auto-calculated end time before saving.
10. Verify the update in both table and timeline view.
11. If a red conflict warning appears above the timeline, adjust times so blocks no longer overlap.
12. If overlap is truly required, use `Allow overlap for this item` when saving that item.
13. Use `Now` tabs (`/student/now`, `/staff/now`) for live in-the-moment operations. Schedule pages are day-planning views and do not show a live `Now` line.

### Job C: Add or Update Users

1. Open `Users`.
2. Confirm `Roster Year` is correct.
3. Single user: use `Add User` and click `Create User`.
4. Bulk users: use `Bulk Upload Users` and click `Import Users`.
5. Existing user: click `Edit`, update fields, then `Save Changes`.

### Job D: Deactivate or Remove Users

1. Open `Users`.
2. Find the person in `Current Year Roster`.
3. Click `Deactivate` to turn off access without deleting.
4. Click `Remove` only when account should be permanently deleted.

### Job E: Keep Resources Clean

1. Open `Resources`.
2. Add categories/items as needed for current program operations.
3. Use `Edit Category` or `Edit Item` to correct existing entries.
4. Use `Remove Item` for outdated resource entries and confirm.
5. Use `Remove Category` only when that full category should be deleted, then confirm.

## 4) Daily Checklist (Program Days)

1. Confirm correct `Program Year` in `Users` and `Schedule`.
2. Check first two schedule blocks for both tracks.
3. Publish known updates in `Announcements`.
4. Unpin outdated urgent announcements at end of day.
5. Remove outdated or duplicate resources.
6. Open `Settings` and confirm launch-readiness checks are green, especially magic-link template checks.

## 5) Guardrails

1. Do not share your login email link.
2. Do not remove or deactivate your own admin account.
3. Do not use `Clear Year Data` unless Bryan explicitly asks.
4. Do not post private student details in announcements/resources.

## 6) Escalate to Bryan Immediately If...

1. You cannot sign in after retrying once.
2. Schedule changes do not save or disappear.
3. Wrong people can see restricted content.
4. You see repeated error banners.
5. You accidentally removed/deactivated the wrong user.

## 7) Fast Troubleshooting

### "Email rate limit exceeded"
Wait 60 seconds and retry once. If still blocked, escalate.

### "Signups not allowed for otp"
Account is missing or not active. Escalate.

### "PKCE code verifier not found in storage"
Use the `Sign in with code` section on `/login` first. If needed, request a fresh magic link and open it in the same browser where you requested it. On iPhone Gmail, open in Safari first, then retry.

### "code challenge does not match previously saved code verifier"
This is the same browser-context issue. Return to `/login` and use `Sign in with code` from the newest email, or open in Safari and request a fresh sign-in email.

### Magic link opens but does not finish sign-in
Use `Sign in with code` on `/login` and enter the 6-8 digit code from the same email.

### Link opens wrong site/domain
Do not continue. Escalate and include a screenshot.
