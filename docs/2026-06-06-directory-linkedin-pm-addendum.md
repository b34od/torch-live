# TORCH Live - Directory LinkedIn + Profile Persistence PM Addendum (2026-06-06)

This file captures the exact second-brain updates that should accompany the LinkedIn directory opt-in and profile round-trip fix work. Direct Obsidian writes were blocked in this session by an external approval-credit gate, so the content is staged here for manual sync.

## Append to Backlog.md

Path:
`/Users/BryanODonnell/Documents/Obsidian Vault/Projects/TORCH Live/Backlog.md`

Insert after `TL-043` and before `TL-041`:

```md
### [in_review] TL-044 LinkedIn directory opt-in + profile round-trip fix
- **RICE:** R=7/I=8/C=85/E=2 -> score: 23.8
- **Horizon:** Now
- **Added:** 2026-06-06
- **Track:** Directory, Profile, Backend, Identity
- **Summary:** Let students and staff optionally share a LinkedIn profile in the directory by making their directory name open that profile, and fix the current self-edit bug where recently added directory/profile fields do not persist correctly after reload.
- **Source:** Bryan — students and staff should be able to share LinkedIn; self-edit form appeared to forget prior submissions
- **Acceptance:**
  - `ALTER TABLE user_profiles ADD COLUMN linkedin_url text;` migration authored
  - Profile edit form accepts a LinkedIn profile URL with validation
  - Shared LinkedIn profiles are opened by clicking the person's name in the staff and student directories
  - `show_social` opt-in controls LinkedIn visibility; existing social handles remain staff/admin-only
  - Self-edit profile reload includes `pronouns`, `cotl_color`, `superpower`, and `linkedin_url`, so saved values round-trip correctly
- **Spec:**
  - Accept only profile-style `linkedin.com/in/...` or `linkedin.com/pub/...` URLs
  - Strip query/hash noise before persistence
  - Keep directory discoverability explicit with small helper copy on the directory pages
- **Agent:** Codex
- **Evidence:** Local code patch authored in `lib/auth.js`, `app/api/profile/route.js`, `app/_components/ProfileEditForm.js`, `app/_components/DirectoryList.js`, `app/student/directory/page.js`, `app/staff/directory/page.js`, `components/shell/AppShell.js`, `app/login/page.js`, `app/globals.css`, plus migration `20260606194500_directory_linkedin_and_profile_sync.sql`. `npm run build` passed locally on 2026-06-06. Production migration `directory_linkedin_and_profile_sync` applied successfully at version `20260606234929`. Merge, deploy, and live role-based QA remain pending.
```

## Update Decisions.md

Path:
`/Users/BryanODonnell/Documents/Obsidian Vault/Projects/TORCH Live/Decisions.md`

1. Update frontmatter `updated:` to `2026-06-06`
2. Append:

```md
---

## ADR-009 Directory Identity Sharing — LinkedIn via Opt-In Name Links (2026-06-06)

**Status:** Accepted

**Decision:** Support LinkedIn sharing as an opt-in directory feature for both students and staff by adding a dedicated `linkedin_url` field and opening that profile when the person's name is clicked in the directory. Keep `social_handle` under the stricter existing posture: visible only to staff/admin viewers when sharing is enabled.

**Why:** Bryan wants the directory to support lightweight professional connection without regressing to the broader social-sharing posture that earlier safety changes intentionally constrained. A dedicated field avoids overloading `social_handle`, gives better validation, and keeps the UX clear.

**Consequences:**
- `show_social` remains the user's opt-in gate for LinkedIn/social sharing.
- Student and staff directory viewers can open a shared LinkedIn profile in a new tab.
- LinkedIn inputs must be normalized and restricted to profile-style LinkedIn URLs.
- The profile self-edit load path must include all recently added identity fields so save/reload behavior stays trustworthy.
```

## Update Change Log.md

Path:
`/Users/BryanODonnell/Documents/Obsidian Vault/Projects/TORCH Live/Change Log.md`

1. Update frontmatter `updated:` to `2026-06-06`
2. Append:

```md
## CHG-20260606-01

- Class: normal
- Summary: Add LinkedIn directory opt-in, complete the missing dark-mode logo variant, and fix profile self-edit round-trip for identity fields.
- Why now: Bryan explicitly wants professional profile sharing in the directory, and current profile edit flows can forget recently saved identity fields after reload.
- Scope: New `linkedin_url` profile field and validation, directory name-link behavior, helper copy on staff/student directory pages, profile loader fix for `pronouns`/`cotl_color`/`superpower`/`linkedin_url`, dark-mode logo asset swap for login/topbar, and migration `20260606194500_directory_linkedin_and_profile_sync.sql` with drop/recreate of `get_directory_profiles(int)` for the return-shape change.
- Impact: Student/staff profile editing, directory identity display, `get_directory_profiles()` return shape, and pre-deploy migration queue.
- Risk level: medium
- Rollout plan: local build verify -> Bryan approval -> apply migration -> merge -> deploy -> live student/staff QA for save/reload, directory link behavior, and dark-mode branding.
- Rollback plan: revert the code patch and skip applying the migration, or if already deployed, revert the linked-name UI and RPC field exposure while preserving old `social_handle` behavior.
- Verification evidence: `npm run build` passed locally on 2026-06-06 after the patch. Initial production apply surfaced the expected RPC return-type incompatibility; the repo migration was corrected to drop/recreate `get_directory_profiles(int)` and production migration `directory_linkedin_and_profile_sync` then applied successfully at version `20260606234929`. Authenticated live QA has not run yet in this session.
- Approver: Bryan requested the feature in session and explicitly approved migration/closeout work; merge/push/deploy approval still pending
- Status: in_review
```

## Append to Release Readiness.md

Path:
`/Users/BryanODonnell/Documents/Obsidian Vault/Projects/TORCH Live/Release Readiness.md`

```md
## Week of 2026-06-06 (directory identity follow-up)

### Done

- Implemented a local LinkedIn directory opt-in path for students and staff.
- Fixed the profile self-edit round-trip bug by restoring missing identity fields to the authenticated profile loader.
- Authored migration `20260606194500_directory_linkedin_and_profile_sync.sql` to add `linkedin_url` and expose it through `get_directory_profiles()`.
- Applied production migration `directory_linkedin_and_profile_sync` successfully after correcting the RPC drop/recreate path.
- Completed the missing dark-mode logo variant wiring for login and the shared app shell.

### Verified

- `npm run build` passed locally on Friday, June 6, 2026 after the LinkedIn/profile patch.
- LinkedIn input validation now restricts saved values to profile-style LinkedIn URLs and strips query/hash noise.
- Student directory still keeps `social_handle` hidden while allowing an opted-in LinkedIn name link for all authenticated viewers.

### Left

- Bryan approval for merge, push, and deploy.
- Live QA with real student/staff accounts to confirm:
  - profile save -> reload round-trip for pronouns, COTL color, superpower, and LinkedIn
  - student/staff directory name-link behavior
  - graceful behavior when no LinkedIn is present

### Uncertain

- Authenticated runtime behavior in this shell, because local env/session state is not sufficient for meaningful signed-in QA.

### Launch Risk Score

**1.7 / 5: low risk, pending merge/deploy and live auth QA.**

Reason: the code path is locally build-verified, the production schema/RPC change is already applied, and remaining risk is now concentrated in app deployment and authenticated live verification.
```

## Append to TORCH Live.md

Path:
`/Users/BryanODonnell/Documents/Obsidian Vault/Projects/TORCH Live/TORCH Live.md`

```md
## Directory Identity Follow-Up (2026-06-06)

Codex prepared a local follow-up patch for directory/profile trust and professional sharing:

- adds optional LinkedIn profile sharing for students and staff by turning a shared directory name into an external link
- preserves the stricter social-handle posture from the earlier safety pass
- fixes the profile self-edit reload bug that was dropping recently added identity fields from the authenticated profile loader
- finishes dark-mode branding by swapping in the white TORCH logo variant on themed surfaces

Verification in this pass: `npm run build` succeeded locally and the production DB migration is now applied. Remaining gate: Bryan approval for merge/deploy plus authenticated live QA of save/reload, directory link behavior, and dark-mode branding.
```

## Optional session log

Path:
`/Users/BryanODonnell/Documents/Obsidian Vault/Session Logs/2026-06-06 - TORCH Live Directory LinkedIn and Profile Persistence (Codex).md`

```md
# 2026-06-06 - TORCH Live Directory LinkedIn and Profile Persistence (Codex)

## Done

- Implemented optional LinkedIn profile sharing in the directory by linking shared names to a validated LinkedIn URL.
- Fixed the authenticated profile-loader gap that caused pronouns, COTL color, and superpower to disappear on reload and risk being overwritten.
- Authored migration `20260606194500_directory_linkedin_and_profile_sync.sql`.
- Applied production migration `directory_linkedin_and_profile_sync` successfully after correcting the RPC drop/recreate path.
- Added the white TORCH logo asset for dark-mode login/topbar rendering.

## Verified

- `npm run build` passed locally on Next.js 15.5.18.
- LinkedIn validation accepts only profile-style `linkedin.com/in/...` or `linkedin.com/pub/...` URLs and strips query/hash noise.
- Student directory keeps `social_handle` hidden while still allowing LinkedIn name links when users opt in.

## Left

- Bryan approval for merge, push, and deploy.
- Authenticated live QA for student/staff save-reload and directory link behavior.

## Uncertain

- Production migration/apply status.
- Runtime behavior with real auth sessions in this shell.

## Evidence

- Code files:
  - `lib/auth.js`
  - `app/api/profile/route.js`
  - `app/_components/ProfileEditForm.js`
  - `app/_components/DirectoryList.js`
  - `app/student/directory/page.js`
  - `app/staff/directory/page.js`
  - `components/shell/AppShell.js`
  - `app/login/page.js`
  - `app/globals.css`
  - `supabase/migrations/20260606194500_directory_linkedin_and_profile_sync.sql`
- Validation:
  - `npm run build`
```
